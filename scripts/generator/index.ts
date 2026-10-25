import fs from 'node:fs/promises';
import path from 'node:path';
import { loadConfig, type CmsCollection } from './config';
import { generateCollections } from './collections';
import { generateTypes } from './types';
import { generateAdminIndex } from './admin-index';
import { writeIfChanged } from './write-if-changed';

async function generateTemplateRegistry(config: CmsCollection[], listing: boolean) {
	const directory = listing ? 'list-templates' : 'templates';
	const prefix = listing ? 'ListTemplate' : 'Template';
	const names = new Map<string, string>();
	for (const file of await fs.readdir(`src/lib/${directory}`)) {
		if (!/^[A-Za-z][A-Za-z0-9]*\.svelte$/.test(file)) continue;
		const name = path.basename(file, '.svelte');
		const key = name.toLowerCase();
		if (names.has(key)) {
			throw new Error(
				listing ? `Duplicate listing template: ${name}` : `Duplicate template name: ${name}`
			);
		}
		names.set(key, name);
	}
	if (!names.has('default')) {
		throw new Error(
			listing ? 'Missing listing Default.svelte template' : 'Missing Default.svelte template'
		);
	}
	for (const collection of config) {
		if (!collection.folder || collection.public_route !== true) continue;
		const name = (listing ? collection.list_template : collection.template) ?? 'default';
		if (!names.has(name)) {
			throw new Error(
				listing
					? `Unknown listing template "${name}" for collection "${collection.name}"`
					: `Unknown template "${name}" for collection "${collection.name}". Available templates: ${[...names.keys()].join(', ')}`
			);
		}
	}
	const imports = [...names]
		.map(([, file], i) => `import ${prefix}${i} from '../${directory}/${file}.svelte';`)
		.join('\n');
	const mappings = [...names]
		.map(([key], i) => `  ${JSON.stringify(key)}: ${prefix}${i}`)
		.join(',\n');
	const exportName = listing ? 'listTemplates' : 'templates';
	return `// Generated automatically. Do not edit.\n${imports}\nexport const ${exportName} = {\n${mappings}\n};\n`;
}

async function main() {
	const config = await loadConfig();
	const collectionFiles = await fs.readdir('static/admin/collections');
	const indexPath = 'static/admin/index.html';
	const indexHtml = await fs.readFile(indexPath, 'utf8');
	const generatedIndex = generateAdminIndex(indexHtml, collectionFiles);
	if (generatedIndex !== indexHtml) await fs.writeFile(indexPath, generatedIndex);
	const output = generateCollections(config);
	const registry = await generateTemplateRegistry(config, false);
	const listRegistry = await generateTemplateRegistry(config, true);

	await fs.mkdir('src/lib/generated', { recursive: true });
	await writeIfChanged('src/lib/generated/collections.ts', output);
	await writeIfChanged('src/lib/generated/types.ts', generateTypes(config));
	await writeIfChanged('src/lib/generated/templates.ts', registry);
	await writeIfChanged('src/lib/generated/list-templates.ts', listRegistry);

	console.log(`Generated ${config.length} CMS collections.`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
