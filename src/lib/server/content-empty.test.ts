import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { collections, type CollectionName } from '../generated/collections.ts';
import type { FolderCollectionName } from './content.ts';

// Exercise the real reader and routes without touching repository content.
const root = await fs.mkdtemp(path.join(os.tmpdir(), 'starter-empty-content-'));
const originalCwd = process.cwd();
process.chdir(root);
const { readAll, readOne, readDoc } = await import('../content/read.ts');
const { getAll } = await import('./content.ts');
const { publicEntries } = await import('./public-routes.ts');
const { archive } = await import('./taxonomy.ts');
const categoryIndex = await import('../../routes/category/+page.server.ts');
const categoryDetail = await import('../../routes/category/[slug]/+page.server.ts');
const tagIndex = await import('../../routes/tag/+page.server.ts');
const tagDetail = await import('../../routes/tag/[slug]/+page.server.ts');
process.chdir(originalCwd);
after(() => fs.rm(root, { recursive: true, force: true }));

// Required settings documents retain their existing behaviour.
await fs.mkdir(path.join(root, 'content/settings'), { recursive: true });
await fs.writeFile(path.join(root, 'content/settings/general.yml'), 'homePage: home\n');

const folders = (Object.keys(collections) as CollectionName[]).filter((name): name is FolderCollectionName =>
	collections[name].kind === 'folder');

for (const state of ['missing', 'empty'] as const) {
	test(`${state} folder collections return empty results throughout reading and prerendering`, async () => {
		for (const name of folders) {
			const def = collections[name];
			if (def.kind !== 'folder') continue;
			if (state === 'empty') await fs.mkdir(path.join(root, def.folder), { recursive: true });
			assert.deepEqual(await readAll(name), [], name);
			assert.deepEqual(await getAll(name), [], name);
			assert.equal(await readOne(name, 'missing'), null, name);
		}
		assert.deepEqual(await publicEntries(), []);
		for (const [index, detail] of [[categoryIndex, categoryDetail], [tagIndex, tagDetail]] as const) {
			assert.deepEqual(await index.load(), { terms: [] });
			assert.deepEqual(await detail.entries(), []);
			await assert.rejects(() => detail.load({ params: { slug: 'missing' } }), { status: 404 });
		}
	});
}

test('taxonomy archives with terms but no content return empty item lists', async () => {
	for (const [kind, collection] of [['category', 'categories'], ['tag', 'tags']] as const) {
		await fs.writeFile(path.join(root, `content/${collection}/topic.yml`), 'title: Topic\n');
		assert.deepEqual((await archive(kind, 'topic'))?.items, []);
	}
});

test('directory permission errors propagate', async (t) => {
	const error = Object.assign(new Error('Permission denied'), { code: 'EACCES' });
	t.mock.method(fs, 'readdir', async () => { throw error; });
	await assert.rejects(() => readAll('posts'), (err) => err === error);
});

test('an invalid collection directory propagates ENOTDIR', async () => {
	await fs.rmdir(path.join(root, 'content/posts'));
	await fs.writeFile(path.join(root, 'content/posts'), 'not a directory');
	await assert.rejects(() => readAll('posts'), { code: 'ENOTDIR' });
});

test('a file disappearing after directory listing still reports the read error', async (t) => {
	const error = Object.assign(new Error('File disappeared'), { code: 'ENOENT' });
	t.mock.method(fs, 'readFile', async () => { throw error; });
	await assert.rejects(() => readAll('categories'), (err) => err === error);
});

test('missing required settings documents still report ENOENT', async () => {
	await fs.unlink(path.join(root, 'content/settings/general.yml'));
	await assert.rejects(() => readDoc('settings', 'general'), { code: 'ENOENT' });
});
