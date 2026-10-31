import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { parse } from 'svelte/compiler';
import type { CmsCollection } from './config';
import { writeIfChanged } from './write-if-changed';

type Template = { name: string; key: string; templateFor?: string };

export async function discoverTemplates(directory: string): Promise<Template[]> {
	const templates: Template[] = [];
	for (const file of (await fs.readdir(directory)).sort()) {
		if (!/^[A-Za-z][A-Za-z0-9]*\.svelte$/.test(file)) continue;
		const name = path.basename(file, '.svelte');
		const key = name.toLowerCase();
		if (templates.some((template) => template.key === key)) throw new Error(`Duplicate template name: ${name}`);
		const ast = parse(await fs.readFile(path.join(directory, file), 'utf8'), { modern: true });
		let templateFor: string | undefined;
		for (const node of ast.module?.content.body ?? []) {
			if (node.type !== 'ExportNamedDeclaration' || node.declaration?.type !== 'VariableDeclaration') continue;
			for (const declaration of node.declaration.declarations) {
				if (declaration.id.type !== 'Identifier' || declaration.id.name !== 'templateFor') continue;
				if (declaration.init?.type !== 'Literal' || typeof declaration.init.value !== 'string') {
					throw new Error(`${file}: templateFor must be a literal collection name`);
				}
				templateFor = declaration.init.value;
			}
		}
		templates.push({ name, key, templateFor });
	}
	if (!templates.some(({ key }) => key === 'default')) throw new Error(`Missing Default.svelte template in ${directory}`);
	return templates;
}

// Generate options in the existing schema, preserving its other fields/comments.
export async function syncTemplateOptions(config: CmsCollection[], templates: Template[], directory = 'static/admin/collections') {
	for (const filename of (await fs.readdir(directory)).filter((name) => /\.ya?ml$/.test(name)).sort()) {
		const file = path.join(directory, filename);
		const doc = YAML.parseDocument(await fs.readFile(file, 'utf8'));
		let changed = false;
		for (const [index, collection] of (doc.toJS().collections as CmsCollection[]).entries()) {
			const definition = config.find(({ name }) => name === collection.name);
			const fieldIndex = collection.fields?.findIndex((field) => field.name === 'template' && field.widget === 'select') ?? -1;
			if (fieldIndex < 0 || !definition) continue;
			const options = templates.filter(({ templateFor }) => templateFor === collection.name)
				.map(({ name, key }) => ({ label: name, value: key }));
			if (!options.length) throw new Error(`No compatible templates for ${collection.name}`);
			definition.fields![fieldIndex].options = options;
			if (JSON.stringify(collection.fields![fieldIndex].options) === JSON.stringify(options)) continue;
			doc.setIn(['collections', index, 'fields', fieldIndex, 'options'], options);
			changed = true;
		}
		if (changed) await writeIfChanged(file, doc.toString());
	}
}

export function generateTemplateRegistry(config: CmsCollection[], templates: Template[], listing: boolean) {
	const directory = listing ? 'list-templates' : 'templates';
	const prefix = listing ? 'ListTemplate' : 'Template';
	for (const collection of config) {
		if (!collection.folder || collection.public_route !== true) continue;
		const name = (listing ? collection.list_template : collection.template) ?? 'default';
		if (!templates.some(({ key }) => key === name)) throw new Error(`Unknown ${listing ? 'listing ' : ''}template "${name}" for collection "${collection.name}"`);
	}
	const imports = templates.map(({ name }, i) => `import ${prefix}${i} from '../${directory}/${name}.svelte';`).join('\n');
	const mappings = templates.map(({ key }, i) => `  ${JSON.stringify(key)}: ${prefix}${i}`).join(',\n');
	return `// Generated automatically. Do not edit.\n${imports}\nexport const ${listing ? 'listTemplates' : 'templates'} = {\n${mappings}\n};\n`;
}
