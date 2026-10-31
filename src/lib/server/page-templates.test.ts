import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { collections } from '../generated/collections.ts';

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'starter-page-templates-'));
const cwd = process.cwd();
process.chdir(root);
const { detailTemplate } = await import('./public-routes.ts');
const { load: detail } = await import('../../routes/[collection]/[slug]/+page.server.ts');
const { load: home } = await import('../../routes/+page.server.ts');
process.chdir(cwd);
after(() => fs.rm(root, { recursive: true, force: true }));

for (const dir of ['pages', 'settings', 'blocks']) await fs.mkdir(path.join(root, 'content', dir), { recursive: true });
await fs.writeFile(path.join(root, 'content/settings/general.yml'), 'homePage: home\n');
await fs.writeFile(path.join(root, 'content/blocks/shared.yml'), 'title: Shared\ntype: panel\nheading: Shared block\n');
async function write(slug: string, template?: unknown) {
	await fs.writeFile(path.join(root, 'content/pages', `${slug}.md`),
		`---\n${JSON.stringify({ title: 'Example', layout: 'wide', blocks: ['shared'], seo: { title: 'Custom SEO' }, template })}\n---\nA **page** body.\n`);
}
const load = async (slug: string) => {
	const data = await detail({ params: { collection: 'pages', slug } } as Parameters<typeof detail>[0]);
	assert.ok(data);
	return data;
};
const loadHome = async () => {
	const data = await home({} as Parameters<typeof home>[0]);
	assert.ok(data);
	return data;
};

test('valid overrides, absent/cleared values and invalid values resolve safely', (t) => {
	const warning = t.mock.method(console, 'warn', () => {});
	for (const template of [undefined, null, '']) assert.equal(detailTemplate('pages', { template }), 'page');
	assert.equal(detailTemplate('pages', { template: 'landing' }), 'landing');
	for (const template of ['missing', 'podcast', 'person', 'constructor', 12, {}]) {
		assert.equal(detailTemplate('pages', { template, slug: 'example' }), 'page');
	}
	assert.equal(warning.mock.callCount(), 6);
	assert.match(String(warning.mock.calls[0].arguments[0]), /pages\/example/);
	assert.equal(detailTemplate('audio', { template: 'landing' }), 'podcast');
	const definition = collections.pages as { template: string };
	const original = definition.template;
	try {
		definition.template = 'landing';
		assert.equal(detailTemplate('pages', {}), 'landing');
		definition.template = 'missing';
		assert.equal(detailTemplate('pages', {}), 'default');
	} finally { definition.template = original; }
});

test('changing and removing a record override preserves page data, SEO, blocks and layout', async () => {
	await write('example');
	const original = await load('example');
	await write('example', 'landing');
	const changed = await load('example');
	assert.equal(changed.template, 'landing');
	assert.deepEqual(changed.item, { ...original.item, template: 'landing' });
	assert.deepEqual(changed.blocks, original.blocks);
	assert.equal(changed.item.layout, 'wide');
	assert.deepEqual(changed.item.seo, { title: 'Custom SEO' });
	await write('example');
	assert.deepEqual(await load('example'), original);
});

test('the configured homepage uses the same resolution and retains its existing URL policy', async () => {
	await write('home');
	assert.equal((await loadHome()).template, 'page');
	await write('home', 'landing');
	assert.equal((await loadHome()).template, 'landing');
	await assert.rejects(() => load('home'), { status: 404 });
});
