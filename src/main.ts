import { App, DropdownComponent, Plugin, PluginSettingTab, Setting, TextComponent } from 'obsidian'
import * as fileHelper from "./fileHelper"
import { DateTime } from "luxon"
import { draw_calendar } from './calendar'
import { parse_source } from './sourceHelper'

// Remember to rename these classes and interfaces!

interface MileageLogSettings {
	filePath: string,
	placeOptions: string[],
	transpOptions: string[],
}

export type Transportation = {
	name: string,
	vehicle: string,
	start: string,
	destination: string
}

export type Entry = {
	date: DateTime,
	transportations: Transportation[],
}

const DEFAULT_SETTINGS: MileageLogSettings = {
	filePath: '/MileageLog',
	placeOptions: [],
	transpOptions: [],
}

export default class MileageLogPlugin extends Plugin {
	settings: MileageLogSettings

	selected_date = DateTime.now()

	async onload() {
		await this.loadSettings()

		// This creates an icon in the left ribbon.
		this.addRibbonIcon('map', 'Mileage Log', async (_evt: MouseEvent) => {
			// Called when the user clicks the icon.
			const f = await fileHelper.openMileageFile(this, this.settings.filePath)

			const leaf = this.app.workspace.getLeaf(true)
			await leaf.openFile(f)
		})

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this))

		this.registerMarkdownCodeBlockProcessor("mileage-log", (source, el, ctx) => {
			const entries = parse_source(source)
			draw_calendar(this, entries, el, ctx)
		});
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
	}

	async saveSettings() {
		await this.saveData(this.settings)
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MileageLogPlugin

	constructor(app: App, plugin: MileageLogPlugin) {
		super(app, plugin)
		this.plugin = plugin
	}

	display(): void {
		const {containerEl} = this

		containerEl.empty()

		new Setting(containerEl)
			.setName('Mileage Log File')
			.setDesc('The file to store the log in. If the file does not exist, it will be created for you.')
			.addText(text => text
				.setPlaceholder('Enter the vault-absolute path')
				.setValue(this.plugin.settings.filePath)
				.onChange(async (value) => {
					this.plugin.settings.filePath = value
					await this.plugin.saveSettings()
				}))


		let deleteTranspDropdown: DropdownComponent
		const transpSetting = new Setting(containerEl)
		new Setting(containerEl)
			.setName("Delete transportations")
			.setDesc("Select a transportation from the dropdown to delete")
			.addDropdown(drop => {
					deleteTranspDropdown = drop
					this.plugin.settings.transpOptions.forEach(el => drop.addOption(el, el))
				})
			.addButton(btn => { btn
				.setButtonText("Delete selected transportation")
				.onClick(async () => {
					this.plugin.settings.transpOptions.splice(this.plugin.settings.transpOptions.findIndex(el => el == deleteTranspDropdown.getValue()), 1)
					transpSetting.setDesc(`The transportation types your are using. Current transportations: ${this.plugin.settings.transpOptions.join(', ')}`)
					await this.plugin.saveSettings()
				})
			})

		let transpField: TextComponent
		transpSetting
			.setName("Transportations")
			.setDesc(`The transportation types your are using. Current transportations: ${this.plugin.settings.transpOptions.join(', ')}`)
			.addText(text => { text
				.setPlaceholder("Enter a name for a new transportation")
				transpField = text
			})
			.addButton(btn => { btn
				.setButtonText("Add to list")
				.onClick(async () => {
					this.plugin.settings.transpOptions.push(transpField.getValue())
					deleteTranspDropdown.addOption(transpField.getValue(), transpField.getValue())
					transpField.setValue("")
					transpSetting.setDesc(`The transportation types your are using. Current transportations: ${this.plugin.settings.transpOptions.join(', ')}`)
					await this.plugin.saveSettings()
				})
			})

		let deletePlaceDropdown: DropdownComponent
		const placeSetting = new Setting(containerEl)
		new Setting(containerEl)
			.setName("Delete places")
			.setDesc("Select a place from the dropdown to delete")
			.addDropdown(drop => {
					deletePlaceDropdown = drop
					this.plugin.settings.placeOptions.forEach(el => drop.addOption(el, el))
				})
			.addButton(btn => { btn
				.setButtonText("Delete selected place")
				.onClick(async () => {
					this.plugin.settings.placeOptions.splice(this.plugin.settings.placeOptions.findIndex(el => el == deletePlaceDropdown.getValue()), 1)
					placeSetting.setDesc(`The places your are traveling to. Current places: ${this.plugin.settings.placeOptions.join(', ')}`)
					await this.plugin.saveSettings()
				})
			})

		let placeField: TextComponent
		placeSetting
			.setName("Places")
			.setDesc(`The places your are traveling to. Current places: ${this.plugin.settings.placeOptions.join(', ')}`)
			.addText(text => { text
				.setPlaceholder("Enter a name for a new place")
				placeField = text
			})
			.addButton(btn => { btn
				.setButtonText("Add to list")
				.onClick(async () => {
					this.plugin.settings.placeOptions.push(placeField.getValue())
					deletePlaceDropdown.addOption(placeField.getValue(), placeField.getValue())
					placeField.setValue("")
					placeSetting.setDesc(`The places your are traveling to. Current places: ${this.plugin.settings.placeOptions.join(', ')}`)
					await this.plugin.saveSettings()
				})
			})
	}
}
