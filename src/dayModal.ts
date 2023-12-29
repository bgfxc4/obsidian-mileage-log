import { App, MarkdownPostProcessorContext, MarkdownView, Modal, setIcon } from "obsidian";
import { Entry } from "./main";
import MileageLogPlugin from "./main";
import { CreateEntryModal } from "./createDayModal";
import { dump_to_source } from "./sourceHelper";

export class DayModal extends Modal {
	dayEntry: Entry
	ul: HTMLElement
	app: App
	plugin: MileageLogPlugin
	entries: Entry[]
	calendar_el: HTMLElement
	mkdwn_ctx: MarkdownPostProcessorContext
	entryContainer: HTMLElement

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
				new CreateEntryModal(this.plugin, this.entries, this.dayEntry.date, this.mkdwn_ctx, this.calendar_el, entries => {
					this.entries = entries
					this.dayEntry = this.entries.find(el => el.date == this.dayEntry.date) || {date: this.dayEntry.date, transportations: []}
					this.generateEntryList()
				}).open();
		})
		setIcon(createBtn, "plus-circle")
		
		this.entryContainer = this.ul.createDiv()

		this.generateEntryList()
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}

	generateEntryList() {
		console.log("asdas")
		this.entryContainer.childNodes.forEach(e => e.remove())
		this.entryContainer.setText("")

		if (this.dayEntry.transportations.length == 0) {
			this.entryContainer.setText("No entry yet.")
			return
		}

		for (const i in this.dayEntry.transportations) {
			const t = this.dayEntry.transportations[i]
			const li = this.entryContainer.createEl("li")
			li.createEl("p", { text: `${t.name}: From ${t.start} to ${t.destination} using ${t.vehicle}.`, cls: "mlog-entry-text" })
			const btn = li.createSpan({ cls: "mlog-remove-entry-button" })
			btn.onClickEvent(() => {
				this.removeEntry(Number.parseInt(i))
			})
			setIcon(btn, "trash-2")
		}
	}

	removeEntry(idx: number) {
		const i = this.entries.findIndex(el => el.date == this.dayEntry.date)
		if (!i)
			throw new Error("Problem occured!")

		if (this.entries[i].transportations.length == 1) {
			if (idx != 0)
				throw new Error("Problem occured!")

			this.entries.splice(i, 1)
		} else {
			this.entries[i].transportations.splice(idx)
		}


		const editor = this.plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor
		const info = this.mkdwn_ctx.getSectionInfo(this.calendar_el)

		if (!editor || !info)
			return console.error("Can't save to source right now!")

		const currentContent = editor.getValue();
		const block_start = {line: info.lineStart + 1, ch: 0}
		const block_end = {line: info.lineEnd - 1, ch: currentContent.split("\n")[info.lineEnd-1].length}

		editor.replaceRange(dump_to_source(this.entries), block_start, block_end)
		this.dayEntry = this.entries.find(el => el.date == this.dayEntry.date) || {date: this.dayEntry.date, transportations: []}
		this.generateEntryList()
	}
}
