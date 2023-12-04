import { App, Plugin, PluginSettingTab, Setting } from 'obsidian'
import * as fileHelper from "./fileHelper"
import { DateTime } from "luxon"
import { draw_calendar } from './calendar'

// Remember to rename these classes and interfaces!

interface MileageLogSettings {
	filePath: string
}

const DEFAULT_SETTINGS: MileageLogSettings = {
	filePath: '/MileageLog'
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

		this.registerMarkdownCodeBlockProcessor("mileage-log", (source, el, _ctx) => {
			draw_calendar(this, source, el)
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
	}
}
