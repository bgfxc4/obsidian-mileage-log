import { DateTime } from "luxon";
import { App, MarkdownPostProcessorContext, MarkdownView, Modal, setIcon, Setting } from "obsidian";
import { Entry, Transportation } from "./main";
import MileageLogPlugin from "./main";
import { dump_to_source } from "./sourceHelper";

export class DayModal extends Modal {
	dayEntry: Entry
	ul: HTMLElement
	app: App
	plugin: MileageLogPlugin
	entries: Entry[]
	calendar_el: HTMLElement
	mkdwn_ctx: MarkdownPostProcessorContext

	constructor(plugin: MileageLogPlugin, entries: Entry[], dayEntry: Entry, mkdwn_ctx: MarkdownPostProcessorContext, calendar_el: HTMLElement) {
		super(plugin.app);
		this.dayEntry = dayEntry
		this.plugin = plugin
		this.entries = entries
		this.calendar_el = calendar_el
		this.mkdwn_ctx = mkdwn_ctx

		const {contentEl} = this;
		this.ul = contentEl.createEl("ul")
	}

	onOpen() {
		const createBtn = this.contentEl.createDiv({ text: "+", cls: "mlog-day-modal-add-entry-button" })
		createBtn.addEventListener("click", () => {
				new CreateEntryModal(this.plugin, this.entries, this.dayEntry.date, this.mkdwn_ctx, this.calendar_el).open();
		})
		setIcon(createBtn, "plus-circle")

		if (!this.dayEntry) {
			this.ul.setText("No entry yet.")
			return
		}

		for (const t of this.dayEntry.transportations) {
			this.ul.createEl("li", { text: `${t.name}: From ${t.start} to ${t.destination} using ${t.vehicle}.` })
		}
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

type EntrySettings = {
	from: string
	to: string
	vehicle: string
	reverse: boolean
	name: string
}

class CreateEntryModal extends Modal {
	day: DateTime
	ul: HTMLElement
	plugin: MileageLogPlugin
	entries: Entry[]
	mkdwn_ctx: MarkdownPostProcessorContext
	calendar_el: HTMLElement
	
	settings: EntrySettings = {
		from: "",
		to: "",
		vehicle: "",
		name: "",
		reverse: false,
	}

	constructor(plugin: MileageLogPlugin, entries: Entry[], day: DateTime, mkdwn_ctx: MarkdownPostProcessorContext, calendar_el: HTMLElement) {
		super(plugin.app);
		this.day = day
		this.plugin = plugin
		this.entries = entries
		this.mkdwn_ctx = mkdwn_ctx
		this.calendar_el = calendar_el
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.createEl("h4", { text: `Create Entry for ${this.day.toLocaleString(DateTime.DATE_HUGE)}:` })

		new Setting(contentEl)
			.setName("Name")
			.setDesc(`For example "To Work" or "From Work"`)
			.addText(text => {
				text.onChange(val => this.settings.name = val)
			})

		new Setting(contentEl)
			.setName("From")
			.setDesc("Select the place where this entry started from:")
			.addDropdown(drop => {
				this.plugin.settings.placeOptions.forEach(el => drop.addOption(el, el))
				this.settings.from = drop.getValue()
				drop.onChange(val => this.settings.from = val)
			})

		new Setting(contentEl)
			.setName("To")
			.setDesc("Select the place where you went in this entry:")
			.addDropdown(drop => {
				this.plugin.settings.placeOptions.forEach(el => drop.addOption(el, el))
				this.settings.to = drop.getValue()
				drop.onChange(val => this.settings.to = val)
			})

		new Setting(contentEl)
			.setName("Vehicle")
			.setDesc("Select the type of transportation you were using:")
			.addDropdown(drop => {
				this.plugin.settings.transpOptions.forEach(el => drop.addOption(el, el))
				this.settings.vehicle = drop.getValue()
				drop.onChange(val => this.settings.vehicle = val)
			})

		new Setting(contentEl)
			.setName("Same way back?")
			.setDesc("Do you want to create an entry from the target place to the start place? (Same type of transportation)")
			.addToggle(toggle => {
				toggle.onChange(val => this.settings.reverse = val)
			})

		new Setting(contentEl)
			.addButton(btn =>
				btn.setButtonText("Cancel")
				.onClick(() => {
					this.close()
				}))
			.addButton(btn =>
				btn.setButtonText("Create entry")
				.onClick(() => {
					this.insertEntry(this.settings)
				}))
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}

	insertEntry(settings: EntrySettings) {
		const transps: Transportation[] = [
			{
				name: settings.name,
				vehicle: settings.vehicle,
				start: settings.from,
				destination: settings.to,
			}
		]

		if (settings.reverse) {
			transps.push({
				name: settings.name + " - reverse",
				vehicle: settings.vehicle,
				destination: settings.from,
				start: settings.to,	
			})
		}

		const idx = this.entries.findIndex(el => el.date == this.day)

		if (idx == -1) {
			this.entries.push({
				date: this.day,
				transportations: transps
			})
		} else {
			this.entries[idx].transportations.push(...transps)
		}

		const editor = this.plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor
		const info = this.mkdwn_ctx.getSectionInfo(this.calendar_el)

		if (!editor || !info)
			return console.error("Can't save to source right now!")

		const currentContent = editor.getValue();
		const block_start = {line: info.lineStart + 1, ch: 0}
		const block_end = {line: info.lineEnd - 1, ch: currentContent.split("\n")[info.lineEnd-1].length}

		editor.replaceRange(dump_to_source(this.entries), block_start, block_end)
		this.close()
	}
}
