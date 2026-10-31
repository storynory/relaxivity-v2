import fs from 'node:fs/promises';
import { loadConfig } from './config';
import { discoverTemplates, generateTemplateRegistry, syncTemplateOptions } from './templates';
import { generateCollections } from './collections';
import { generateTypes } from './types';
import { generateAdminIndex } from './admin-index';
import { writeIfChanged } from './write-if-changed';

async function main() {
	const config = await loadConfig();
	const templates = await discoverTemplates('src/lib/templates');
	const listingTemplates = await discoverTemplates('src/lib/list-templates');
	await syncTemplateOptions(config, templates);
	const collectionFiles = await fs.readdir('static/admin/collections');
	const indexPath = 'static/admin/index.html';
	const indexHtml = await fs.readFile(indexPath, 'utf8');
	const generatedIndex = generateAdminIndex(indexHtml, collectionFiles);
	if (generatedIndex !== indexHtml) await fs.writeFile(indexPath, generatedIndex);
	const output = generateCollections(config, templates.map(({ key }) => key));
	const registry = generateTemplateRegistry(config, templates, false);
	const listRegistry = generateTemplateRegistry(config, listingTemplates, true);

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
