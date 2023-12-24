import { DateTime, Info } from "luxon"
import { MarkdownPostProcessorContext } from "obsidian"
import { DayModal } from "./dayModal"
import MileageLogPlugin, { Entry } from "./main"

export function draw_calendar(plugin: MileageLogPlugin, entries: Entry[], el: HTMLElement, mkdwn_ctx: MarkdownPostProcessorContext) {

	const cal = el.createDiv({ cls: "mlog-calendar" })
	const top_bar = cal.createDiv({ cls: "mlog-top-bar" })
	const month_btn_left = top_bar.createSpan({ text: " < ", cls: "mlog-month-button" })
	const month_label = top_bar.createDiv({ cls: "mlog-month-name" })
	set_month_text(plugin.selected_date, month_label)
	const month_btn_right = top_bar.createSpan({ text: " > ", cls: "mlog-month-button" })

	const weekday_label_container = cal.createDiv({ cls: "mlog-weekday-label-container" })
	const weekday_abbrevs = Info.weekdays("short") 
	for (let i = 0; i < 7; i++) {
		weekday_label_container.createSpan({ text: weekday_abbrevs[i], cls: "mlog-weekday-label" })
	}
	const day_container = cal.createDiv({ cls: "mlog-day-container" })
	draw_days(plugin, entries, day_container, mkdwn_ctx, el)

	month_btn_left.addEventListener("click", () => {
		plugin.selected_date = plugin.selected_date.minus({ months: 1 })
		draw_days(plugin, entries, day_container, mkdwn_ctx, el)
		set_month_text(plugin.selected_date, month_label)
	})

	month_btn_right.addEventListener("click", () => {
		plugin.selected_date = plugin.selected_date.plus({ months: 1 })
		draw_days(plugin, entries, day_container, mkdwn_ctx, el)
		set_month_text(plugin.selected_date, month_label)
	})
}

function draw_days(plugin: MileageLogPlugin, entries: Entry[], day_container: HTMLElement, mkdwn_ctx: MarkdownPostProcessorContext, calendar_el: HTMLElement) {
	const weekday_offset = plugin.selected_date.startOf("month").weekday - 1
	const days_in_month = plugin.selected_date.daysInMonth || 0;
	const days_in_last_month = plugin.selected_date.minus({month: 1}).daysInMonth || 0;

	const entries_in_month = entries.filter(el => el.date.month == plugin.selected_date.month && el.date.year == plugin.selected_date.year)
	const entries_last_month = entries.filter(el => el.date.month == plugin.selected_date.minus({month: 1}).month && el.date.year == plugin.selected_date.minus({month: 1}).year)
	const entries_next_month = entries.filter(el => el.date.month == plugin.selected_date.plus({month: 1}).month && el.date.year == plugin.selected_date.plus({month: 1}).year)

	day_container.innerHTML = ""

	for (let i = -weekday_offset; i < 42 - weekday_offset; i++) {
		const day = day_container.createSpan({ cls: "mlog-day" })
		const label = day.createDiv({ cls: "mlog-day-label" })

		let entry: Entry | undefined
		let real_day = 0
		let month_modifier = 0

		if (i >= 0 && i < days_in_month) {
			label.setText((i+1).toString())
			real_day = i+1

			entry = entries_in_month.find(el => el.date.day == i+1)
			if (entry) {
				const marker_container = day.createDiv({ cls: "mlog-day-entry-container" })
				for (const _ of entry.transportations) {
					marker_container.createDiv({ cls: "mlog-day-entry-marker" })
				}
			}	
		} else if (i >= days_in_month) {
			label.setText((i - days_in_month+1).toString())
			day.addClass("mlog-inactive-day")
			real_day = i - days_in_month + 1
			month_modifier = +1

			entry = entries_next_month.find(el => el.date.day == (i - days_in_month+1))
			if (entry) {
				const marker_container = day.createDiv({ cls: "mlog-day-entry-container" })
				for (const _ of entry.transportations) {
					marker_container.createDiv({ cls: "mlog-day-entry-marker" })
				}
			}
		} else {
			label.setText((days_in_last_month + i + 1).toString())
			day.addClass("mlog-inactive-day")
			real_day = i + days_in_month + 1
			month_modifier = -1

			entry = entries_last_month.find(el => el.date.day == (days_in_last_month + i + 1))
			if (entry) {
				const marker_container = day.createDiv({ cls: "mlog-day-entry-container" })
				for (const _ of entry.transportations) {
					marker_container.createDiv({ cls: "mlog-day-entry-marker" })
				}
			}
		}

		day.addEventListener("click", () => {
			new DayModal(plugin, entries, entry || { date: plugin.selected_date.set({ day: real_day }).plus({ month: month_modifier }), transportations: [] }, mkdwn_ctx, calendar_el).open()
		})
	}
}

function set_month_text(selected_date: DateTime, month_label: HTMLElement) {
	month_label.setText(`${selected_date.monthLong} ${selected_date.year}`)
}
