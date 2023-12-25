import { DateTime } from "luxon";
import { Entry } from "./main";

export function parse_source(source: string): Entry[] {
	const days = source.split("\n");

	if (source == "") {
		return []
	}

	const ret: Entry[] = []
	for (const d in days) {
		const splitted = days[d].split(";")
		const date = DateTime.fromISO(splitted[0])
		if (date.invalidReason) {
			throw new Error(`Cant parse element number ${d}: Wrong date format.`)
		}

		const entry: Entry = {
			date,
			transportations: []
		}

		for (let i = 1; i < splitted.length; i++) {
			const transport = splitted[i].split(":")
			if (transport.length != 4) {
				throw new Error(`Cant parse element number ${d}: at transport number ${i}: wrong number of arguments.`)
			}
			entry.transportations.push({
				name: transport[0],
				vehicle: transport[1],
				start: transport[2],
				destination: transport[3]
			})
		}
		ret.push(entry)
	}
	return ret
}

export function dump_to_source(entries: Entry[]): string {
	return entries.map(e =>
		`${e.date.toISODate()};${e.transportations.map(el =>
			`${el.name}:${el.vehicle}:${el.start}:${el.destination}`
		).join(';')}`
	).join("\n")
}
