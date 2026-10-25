import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';

export type CmsField = {
	name: string;
	widget?: string;
	required?: boolean;
	multiple?: boolean;
	collection?: string;
	value_field?: string;
	fields?: CmsField[];
	field?: CmsField;
	options?: (string | { label?: string; value: string })[];
};

export type CmsCollection = {
	public_route?: boolean;
	rss?: false | 'standard' | 'podcast';
	template?: string;
	list_template?: string;
	fields?: CmsField[];
	name: string;
	folder?: string;
	extension?: string;
	format?: string;
	files?: {
		name: string;
		file: string;
		format?: string;
		fields?: CmsField[];
	}[];
};

export async function loadConfig(): Promise<CmsCollection[]> {
	const directory = 'static/admin/collections';
	const filenames = (await fs.readdir(directory)).filter((name) => /\.ya?ml$/.test(name)).sort();

	const collections: CmsCollection[] = [];

	for (const filename of filenames) {
		const raw = await fs.readFile(path.join(directory, filename), 'utf8');
		const config = YAML.parse(raw);

		if (!Array.isArray(config?.collections)) {
			throw new Error(`Missing collections list in ${filename}`);
		}

		for (const collection of config.collections) {
			if (!collection?.name) {
				throw new Error(`Missing collection name in ${filename}`);
			}

			collections.push(collection);
		}
	}

	return collections;
}
