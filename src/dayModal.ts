import { DateTime } from "luxon";
import { App, Modal } from "obsidian";
import { Entry } from "./main";

export class DayModal extends Modal {
	dayEntry: Entry
	ul: HTMLElement
	app: App

	constructor(app: App, dayEntry: Entry) {
		super(app);
		this.dayEntry = dayEntry
		this.app = app

		const {contentEl} = this;
		this.ul = contentEl.createEl("ul")
	}

	onOpen() {
		this.contentEl.createDiv({ text: "+", cls: "mlog-day-modal-add-entry-button" })
			.addEventListener("click", () => {
				new CreateEntryModal(this.app, this.dayEntry.date).open();
			})

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

class CreateEntryModal extends Modal {
	day: DateTime
	ul: HTMLElement

	constructor(app: App, day: DateTime) {
		super(app);
		this.day = day

	}

	onOpen() {
		const {contentEl} = this;
		contentEl.createEl("h3", { text: `Create Entry for ${this.day.toLocaleString(DateTime.DATE_HUGE)}:` })
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
