import { Plugin, TFile, TFolder, normalizePath } from "obsidian";

export async function openMileageFile(plugin: Plugin, path: string): Promise<TFile> {
	const file = plugin.app.vault.getAbstractFileByPath(normalizePath(path));
	if (file instanceof TFolder) {
		throw new Error("The file you configured already exists as folder.")
	}
	
	if (!file) {
		return await createMileageFile(plugin, path);
	}

	if (isTFile(file))
		return file
	else {
		throw new Error("Error opening Mileage Log file")
	}
}

async function createMileageFile(plugin: Plugin, path: string): Promise<TFile> {
	const newFilePath = normalizePath(path)
	const content = "\n```mileage-log\n```\n";
	return await plugin.app.vault.create(newFilePath, content).then(async f => {
		return f
	}).catch(reason =>{
		throw new Error(reason)
	});
}

export function isTFile(obj: unknown): obj is TFile {
	return isOfType<TFile>(obj, 'extension');
}

function isOfType<T>(
	obj: unknown,
	discriminator: keyof T,
	val?: unknown,
): obj is T {
	let ret = false;

	if (obj && (obj as T)[discriminator] !== undefined) {
		ret = true;
		if (val !== undefined && val !== (obj as T)[discriminator]) {
			ret = false;
		}
	}

	return ret;
}
