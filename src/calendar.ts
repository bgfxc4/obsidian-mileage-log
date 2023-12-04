import { DateTime, Info } from "luxon"
import MileageLogPlugin from "./main"

export function draw_calendar(plugin: MileageLogPlugin, source: string, el: HTMLElement) {
	const rows = source.split("\n").filter((row) => row.length > 0)

	const cal = el.createDiv({ cls: "mlog-calendar" })
	const top_bar = cal.createDiv({ cls: "mlog-top-bar" })
	const month_btn_left = top_bar.createSpan({ text: "<", cls: "mlog-month-button" })
	const month_label = top_bar.createDiv({ cls: "mlog-month-name" })
	set_month_text(plugin.selected_date, month_label)
	const month_btn_right = top_bar.createSpan({ text: ">", cls: "mlog-month-button" })

	const weekday_label_container = cal.createDiv({ cls: "mlog-weekday-label-container" })
	const weekday_abbrevs = Info.weekdays("short") 
	for (let i = 0; i < 7; i++) {
		weekday_label_container.createSpan({ text: weekday_abbrevs[i], cls: "mlog-weekday-label" })
	}
	const day_container = cal.createDiv({ cls: "mlog-day-container" })
	draw_days(plugin.selected_date, day_container)

	for (let i = 0; i < rows.length; i++) {
		const cols = rows[i].split(" ");
		for (let j = 0; j < cols.length; j++) {
			continue
		}
	}

	month_btn_left.addEventListener("click", () => {
		plugin.selected_date = plugin.selected_date.minus({ months: 1 })
		draw_days(plugin.selected_date, day_container)
		set_month_text(plugin.selected_date, month_label)
	})

	month_btn_right.addEventListener("click", () => {
		plugin.selected_date = plugin.selected_date.plus({ months: 1 })
		draw_days(plugin.selected_date, day_container)
		set_month_text(plugin.selected_date, month_label)
	})
}

function draw_days(selected_date: DateTime, day_container: HTMLElement) {
	day_container.innerHTML = ""
	const weekday_offset = selected_date.startOf("month").weekday - 1
	const days_in_month = selected_date.daysInMonth || 0;
	const days_in_last_month = selected_date.minus({month: 1}).daysInMonth || 0;
	for (let i = -weekday_offset; i < 42 - weekday_offset; i++) {
		const day = day_container.createSpan({ cls: "mlog-day" })
		const label = day.createDiv({ cls: "mlog-day-label" })
		if (i >= 0 && i < days_in_month) {
			label.setText((i+1).toString())
		} else if (i >= days_in_month) {
			label.setText((i - days_in_month+1).toString())
			day.addClass("mlog-inactive-day")
		} else {
			label.setText((days_in_last_month + i + 1).toString())
			day.addClass("mlog-inactive-day")
		}
	}
}

function set_month_text(selected_date: DateTime, month_label: HTMLElement) {
	month_label.setText(`${selected_date.monthLong} ${selected_date.year}`)
}
