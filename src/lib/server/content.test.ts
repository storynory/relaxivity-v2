import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// Load the real reader against an isolated content tree, without changing repository content.
const root = await fs.mkdtemp(path.join(os.tmpdir(), 'starter-content-'));
const originalCwd = process.cwd();
process.chdir(root);
const { getAll } = await import('./content.ts');
const { buildBlock } = await import('./blocks.ts');
const { load } = await import('../../routes/[collection]/+page.server.ts');
const { load: loadLayout } = await import('../../routes/+layout.server.ts');
process.chdir(originalCwd);
after(() => fs.rm(root, { recursive: true, force: true }));

async function write(collection: string, slug: string, data: Record<string, unknown>, body = '') {
	const dir = path.join(root, 'content', collection);
	await fs.mkdir(dir, { recursive: true });
	const markdown = ['posts', 'podcasts', 'pages'].includes(collection);
	await fs.writeFile(path.join(dir, `${slug}.${markdown ? 'md' : 'yml'}`),
		markdown ? `---\n${JSON.stringify(data)}\n---\n${body}` : JSON.stringify(data));
}

await write('people', 'reader', { name: 'Reader' });
await write('categories', 'topic', { title: 'Topic' });
await write('tags', 'one', { title: 'One' });
await write('tags', 'two', { title: 'Two' });
await write('posts', 'older', { title: 'Older', date: '2026-01-01', category: 'topic', tags: ['one', 'two'], featured: true, custom: { retained: true } }, '**Body**');
await write('posts', 'newer', { title: 'Newer', date: '2026-02-01', category: 'topic', tags: ['one'], featured: false });
await write('posts', 'draft', { title: 'Draft', date: '2026-03-01', draft: true, category: 'topic', tags: ['one', 'two'], featured: true });
await write('posts', 'undated', { title: 'Undated', category: 'topic', tags: ['two'], featured: true });
await write('posts', 'dangling', { title: 'Dangling', category: 'missing', tags: ['missing'] });
await write('podcasts', 'episode', { title: 'Episode', narrator: 'reader' }, 'Episode body');
await write('pages', 'home', { title: 'Home' });
await write('pages', 'about', { title: 'About' });
await write('pages', 'draft', { title: 'Draft', draft: true });
await write('settings', 'general', { homePage: 'home', siteName: 'Test Site', siteLogo: '/logo.svg' });
await write('colour-schemes', 'default', { title: 'Default', prime: '#123456' });
await write('typography', 'default', { title: 'System Sans', bodyFont: 'Arial, sans-serif', headingFont: 'Georgia, serif', fontSize: 17, fontScale: 1.2, lineHeight: 1.6 });
await write('navigation', 'main-menu', { title: 'Main', items: [
	{ label: 'About', url: '/pages/about/', newTab: false, children: [
		{ label: 'External', url: 'https://example.com', newTab: true }
	] }
] });
for (const [slug, settings] of Object.entries({
	latest: { type: 'latest', limit: 2, tags: ['one', 'two'], tagMatch: 'any' },
	all: { type: 'latest', tags: ['one', 'two'], tagMatch: 'all' },
	featured: { type: 'featured', tags: ['one', 'two'], tagMatch: 'any' },
	selected: { type: 'selected', items: [{ type: 'posts', slug: 'draft' }, { collection: 'posts', slug: 'older' }, { type: 'podcasts', slug: 'episode' }], limit: 1 }
})) {
	await write('blocks', slug, { title: slug, collection: 'posts', category: 'topic', ...settings });
}

test('getAll without a selector preserves HTML, arbitrary fields and resolved relationships', async () => {
	const records = await getAll('posts');
	assert.equal(records.length, 5);
	const older = records.find((item) => item.slug === 'older')!;
	assert.equal(older.html, '<p><strong>Body</strong></p>\n');
	assert.equal(older.category?.title, 'Topic');
	assert.deepEqual(older.tags?.map((tag) => tag?.title), ['One', 'Two']);
	assert.deepEqual((older as unknown as Record<string, unknown>).custom, { retained: true });
});

test('selector sees stored missing references; preparation still resolves them to null', async () => {
	const records = await getAll('posts', (items) => items.filter((item) => item.data.category === 'missing'));
	assert.deepEqual(records.map((item) => item.slug), ['dangling']);
	assert.equal(records[0].category, null);
	assert.deepEqual(records[0].tags, [null]);
});

test('only selected records are prepared, in selector order, including an empty selection', async () => {
	const records = await getAll('posts', (items) => {
		// Both would fail if preparation attempted relationship resolution or Markdown rendering.
		const excluded = items.find((item) => item.meta.slug === 'draft')!;
		excluded.data = { ...excluded.data };
		Object.defineProperty(excluded.data, 'category', { get() { throw new Error('Excluded relationship read'); } });
		const unrendered = items.find((item) => item.meta.slug === 'dangling')!;
		Object.defineProperty(unrendered, 'body', { get() { throw new Error('Excluded Markdown read'); } });
		return ['newer', 'older'].map((slug) => items.find((item) => item.meta.slug === slug)!);
	});
	assert.deepEqual(records.map((item) => item.slug), ['newer', 'older']);
	assert.deepEqual(await getAll('posts', () => []), []);
});

test('latest and featured blocks retain publication, category, tag, order and limit rules', async () => {
	assert.deepEqual((await buildBlock('latest'))?.items.map((item) => item.slug), ['newer', 'older']);
	assert.deepEqual((await buildBlock('all'))?.items.map((item) => item.slug), ['older']);
	assert.deepEqual((await buildBlock('featured'))?.items.map((item) => item.slug), ['older', 'undated']);
});

test('selected blocks retain explicit ordering, legacy references, publication checks and limits', async () => {
	assert.deepEqual((await buildBlock('selected'))?.items.map((item) => item.slug), ['older']);
});

test('listings exclude drafts and the homepage while retaining resolved narrator data', async () => {
	// The route only reads params; SvelteKit supplies the remaining event fields in production.
	const pages = await load({ params: { collection: 'pages' } } as Parameters<typeof load>[0]) as { items: Record<string, unknown>[] };
	assert.deepEqual(pages.items.map((item) => item.slug), ['about']);
	const episodes = await load({ params: { collection: 'podcasts' } } as Parameters<typeof load>[0]) as { items: Record<string, unknown>[] };
	assert.deepEqual(episodes.items[0].narrator, { name: 'Reader', slug: 'reader' });
});

test('root layout exposes branding and nested navigation alongside the selected colours', async () => {
	const data = await loadLayout({} as Parameters<typeof loadLayout>[0]);
	assert.equal(data?.siteName, 'Test Site');
	assert.equal(data?.siteLogo, '/logo.svg');
	assert.equal(data?.colours.prime, '#123456');
	assert.equal(data?.typography.bodyFont, 'Arial, sans-serif');
	assert.equal(data?.typography.fontSize, 17);
	assert.equal(data?.navigation[0].url, '/pages/about/');
	assert.deepEqual(data?.navigation[0].children, [
		{ label: 'External', url: 'https://example.com', newTab: true }
	]);
});
