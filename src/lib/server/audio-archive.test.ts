import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'relaxivity-audio-archive-'));
const originalCwd = process.cwd();
process.chdir(root);
const { loadAudioArchive, audioPageEntries, audioPageSize } = await import('./audio-archive.ts');
const { load: archivePage } = await import('../../routes/audio/page/[page]/+page.server.ts');
process.chdir(originalCwd);
after(() => fs.rm(root, { recursive: true, force: true }));

await fs.mkdir(path.join(root, 'content/audio'), { recursive: true });
await fs.mkdir(path.join(root, 'content/people'), { recursive: true });
await fs.writeFile(path.join(root, 'content/people/reader.yml'), 'name: Reader\n');
async function episode(slug: string, data: Record<string, unknown>) {
	await fs.writeFile(path.join(root, `content/audio/${slug}.md`), `---\n${JSON.stringify(data)}\n---\n**Transcript**`);
}
for (let i = 1; i <= 23; i++) {
	await episode(`story-${String(i).padStart(2, '0')}`, { title: `Story ${i}`, date: `2020-01-${String(i).padStart(2, '0')}`, narrator: 'reader' });
}
await episode('draft', { title: 'Draft', date: '2020-01-31', draft: true });
await episode('future', { title: 'Future', date: '2999-01-01' });

test('audio pages select ten published records newest first with complete, non-overlapping coverage', async () => {
	const entries = await audioPageEntries();
	assert.deepEqual(entries, [{ page: '2' }, { page: '3' }]);
	const pages = await Promise.all([1, 2, 3].map(loadAudioArchive));
	assert.equal(audioPageSize, 10);
	assert.deepEqual(pages.map(({ items }) => items.length), [10, 10, 3]);
	assert.deepEqual(pages.flatMap(({ items }) => items.map(({ slug }) => slug)),
		Array.from({ length: 23 }, (_, i) => `story-${String(23 - i).padStart(2, '0')}`));
	assert.equal(pages[0].pagination.total, 23);
	assert.deepEqual(pages[2].pagination.pages, [
		{ number: 1, href: '/audio/' }, { number: 2, href: '/audio/page/2/' }, { number: 3, href: '/audio/page/3/' }
	]);
	assert.equal(pages[0].items[0].html, '<p><strong>Transcript</strong></p>\n');
	assert.deepEqual(pages[0].items[0].narrator, { name: 'Reader', slug: 'reader' });
});

test('invalid, duplicate first-page and out-of-range URLs return 404', async () => {
	for (const page of [0, -1, 1.5, NaN, Infinity, 4]) {
		await assert.rejects(() => loadAudioArchive(page), { status: 404 });
	}
	for (const page of ['1', '02', '-1', '2.5', 'abc', '999999999999999999999']) {
		await assert.rejects(async () => archivePage({ params: { page } } as Parameters<typeof archivePage>[0]), { status: 404 });
	}
});

test('an empty audio collection has a valid first page and no extra prerender entries', async () => {
	await fs.rm(path.join(root, 'content/audio'), { recursive: true });
	await fs.mkdir(path.join(root, 'content/audio'));
	assert.deepEqual(await audioPageEntries(), []);
	const data = await loadAudioArchive();
	assert.deepEqual(data.items, []);
	assert.equal(data.pagination.totalPages, 1);
	assert.equal(data.pagination.total, 0);
	await assert.rejects(() => loadAudioArchive(2), { status: 404 });
});
