import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import YAML from 'yaml';
import { loadConfig, type CmsCollection } from './config';
import { discoverTemplates, generateTemplateRegistry, syncTemplateOptions } from './templates';

test('Pages choices are derived from compatible registered templates, excluding specialised designs', async () => {
	const templates = await discoverTemplates('src/lib/templates');
	const pages = (await loadConfig()).find(({ name }) => name === 'pages')!;
	const choices = templates.filter(({ templateFor }) => templateFor === 'pages').map(({ key }) => key);
	assert.deepEqual(choices, ['landing', 'page']);
	const field = pages.fields!.find(({ name }) => name === 'template')!;
	assert.equal(field.required, false);
	assert.deepEqual(field.options?.map((option) => typeof option === 'string' ? option : option.value), choices);
	assert.match(generateTemplateRegistry([pages], templates, false), /"landing": Template\d/);
});

test('adding a compatible Svelte design updates CMS options deterministically without another list', async () => {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'starter-template-options-'));
	try {
		const designs = path.join(root, 'templates');
		const schemas = path.join(root, 'collections');
		await fs.mkdir(designs);
		await fs.mkdir(schemas);
		await fs.writeFile(path.join(designs, 'Default.svelte'), '<main>Default</main>');
		await fs.writeFile(path.join(designs, 'Promo.svelte'), '<script module>export const templateFor = "pages";</script><main>Promo</main>');
		await fs.writeFile(path.join(designs, 'Podcast.svelte'), '<main>Specialised</main>');
		const config: CmsCollection[] = [{ name: 'pages', folder: 'content/pages', fields: [
			{ name: 'template', widget: 'select', required: false, options: [] }
		] }];
		const file = path.join(schemas, 'pages.yml');
		await fs.writeFile(file, '# Keep this comment\n' + YAML.stringify({ collections: config }));
		const templates = await discoverTemplates(designs);
		await syncTemplateOptions(config, templates, schemas);
		assert.deepEqual(config[0].fields![0].options, [{ label: 'Promo', value: 'promo' }]);
		assert.match(await fs.readFile(file, 'utf8'), /# Keep this comment/);
		const stamp = (await fs.stat(file)).mtimeMs;
		await syncTemplateOptions(config, templates, schemas);
		assert.equal((await fs.stat(file)).mtimeMs, stamp);
		await fs.writeFile(path.join(designs, 'Invalid.svelte'), '<script module>export const templateFor = ["pages"];</script>');
		await assert.rejects(() => discoverTemplates(designs), /literal collection name/);
	} finally {
		await fs.rm(root, { recursive: true, force: true });
	}
});
