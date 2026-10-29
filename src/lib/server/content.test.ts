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
const { podcastFeed } = await import('./feed-handlers.ts');
const { GET: podcastSettings } = await import('../../routes/admin/podcast-settings.json/+server.ts');
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
await write('podcasts', 'episode', { title: 'Episode', date: '2026-01-01', narrator: 'reader' }, 'Episode body');
await write('pages', 'home', { title: 'Home' });
await write('pages', 'about', { title: 'About' });
await write('pages', 'draft', { title: 'Draft', draft: true });
await write('settings', 'general', { homePage: 'home', siteName: 'Test Site', siteLogo: '/logo.svg', podcastFeed: { audioBaseUrl: 'https://audio.relaxivity.app/' } });
await write('colour-schemes', 'default', { title: 'Default', prime: '#123456', surfaceText: '#102030', readingBackground: '#fff8ee', readingText: 'invalid' });
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

test('episode blocks sort YAML timestamps and string dates newest first before limiting', async () => {
	for (const [slug, date] of [
		['order-a-oldest', '2025-01-01T10:00:00'],
		['order-z-newest', '2025-03-01T10:00:00'],
		['order-m-middle', '"2025-02-01T10:00:00"']
	]) {
		await fs.writeFile(path.join(root, 'content/podcasts', `${slug}.md`),
			`---\ntitle: ${slug}\ndate: ${date}\nfeatured: true\ncategory: topic\n---\n`);
	}
	for (const type of ['latest', 'featured']) {
		await write('blocks', `episode-order-${type}`, {
			title: 'Episodes', type, collection: 'podcasts', category: 'topic', limit: 2
		});
		assert.deepEqual((await buildBlock(`episode-order-${type}`))?.items.map((item) => item.slug),
			['order-z-newest', 'order-m-middle']);
	}
});

test('block introductions render rich text, plain text and missing values', async () => {
	for (const type of ['panel', 'hero', 'latest']) {
		await write('blocks', `intro-${type}`, {
			title: 'Introduction', type,
			introduction: 'Read [our stories](/posts/).\n\n**Welcome**'
		});
		assert.equal((await buildBlock(`intro-${type}`))?.introductionHtml,
			'<p>Read <a href="/posts/">our stories</a>.</p>\n<p><strong>Welcome</strong></p>\n');
	}
	await write('blocks', 'intro-plain', { title: 'Plain', type: 'panel', introduction: 'Welcome' });
	assert.equal((await buildBlock('intro-plain'))?.introductionHtml, '<p>Welcome</p>\n');
	assert.equal((await buildBlock('selected'))?.introductionHtml, '');
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
	assert.equal(data?.audioBaseUrl, 'https://audio.relaxivity.app/');
	assert.equal(data?.colours.prime, '#123456');
	assert.equal(data?.colours.surfaceText, '#102030');
	assert.equal(data?.colours.readingBackground, '#fff8ee');
	assert.equal(data?.colours.readingText, '#252824');
	assert.equal(data?.colours.readingLink, '#005747');
	assert.equal(data?.typography.bodyFont, 'Arial, sans-serif');
	assert.equal(data?.typography.fontSize, 17);
	assert.equal(data?.navigation[0].url, '/pages/about/');
	assert.deepEqual(data?.navigation[0].children, [
		{ label: 'External', url: 'https://example.com', newTab: true }
	]);
});

test('podcast RSS resolves R2 paths and retains full URLs, byte lengths and publication filtering', async () => {
	const episode = { date: '2026-01-01', length: 12345, duration: '01:30', draft: false };
	await write('podcasts', 'r2', { ...episode, title: 'R2', audio: 'episodes/story.mp3?x=1&y=2' });
	await write('podcasts', 'legacy', { ...episode, title: 'Legacy', audio: 'https://old.example/story.mp3' });
	await write('podcasts', 'draft-audio', { ...episode, title: 'Draft audio', audio: 'draft.mp3', draft: true });
	await write('podcasts', 'no-size', { ...episode, title: 'No size', audio: 'missing.mp3', length: 0 });
	const feed = await (await podcastFeed('podcasts', 'https://example.com')).text();
	assert.match(feed, /<enclosure url="https:\/\/audio.relaxivity.app\/episodes\/story.mp3\?x=1&amp;y=2" length="12345" type="audio\/mpeg"\/>/);
	assert.match(feed, /<enclosure url="https:\/\/old.example\/story.mp3"/);
	assert.match(feed, /<itunes:duration>01:30<\/itunes:duration>/);
	assert.doesNotMatch(feed, /<title>(Draft audio|No size)<\/title>/);
	assert.deepEqual(await (await podcastSettings()).json(), { audioBaseUrl: 'https://audio.relaxivity.app/' });
});

test('website and RSS share the rolling twelve, without backfilling invalid enclosures or permanent archive stories', async () => {
	const { load: detail } = await import('../../routes/[collection]/[slug]/+page.server.ts');
	const { publicAudio } = await import('../audio/availability.ts');
	const { publicEntries } = await import('./public-routes.ts');
	for (let i = 1; i <= 14; i++) {
		await write('podcasts', `rolling-${i}`, {
			title: `Rolling ${i}`, date: `2026-09-${String(i).padStart(2, '0')}`, audio: `full-${i}.mp3`,
			length: i === 14 ? 0 : 10000, duration: '01:00:00', sampleAudio: `sample-${i}.mp3`,
			sampleLength: 100, sampleDuration: '00:01:00', permanentlyFree: i === 1
		});
	}
	await write('podcasts', 'future', { title: 'Future', date: '2999-01-01', audio: 'future.mp3', length: 12345 });
	const layout = (await loadLayout({} as Parameters<typeof loadLayout>[0]))!;
	assert.equal(layout.supercastUrl, '');
	assert.equal(layout.freeEpisodeSlugs.length, 12);
	assert.ok(!layout.freeEpisodeSlugs.includes('rolling-1'));
	const listing = await load({ params: { collection: 'podcasts' } } as Parameters<typeof load>[0]) as { items: Record<string, unknown>[] };
	assert.ok(!listing.items.some(({ slug }) => slug === 'future'));
	assert.ok(!(await publicEntries()).some(({ slug }) => slug === 'future'));
	await assert.rejects(async () => detail({ params: { collection: 'podcasts', slug: 'future' } } as Parameters<typeof detail>[0]), { status: 404 });
	const archived = await detail({ params: { collection: 'podcasts', slug: 'rolling-2' } } as Parameters<typeof detail>[0]) as { item: Record<string, unknown> };
	const selection = publicAudio(archived.item, layout.freeEpisodeSlugs, layout.audioBaseUrl, layout.audioPublicationTime);
	assert.equal(selection.src, 'https://audio.relaxivity.app/sample-2.mp3');
	assert.equal(selection.duration, '00:01:00');
	assert.equal(selection.length, 100);
	const permanent = listing.items.find(({ slug }) => slug === 'rolling-1')!;
	assert.equal(publicAudio(permanent, layout.freeEpisodeSlugs, layout.audioBaseUrl, layout.audioPublicationTime).playbackType, 'full');
	const feed = await (await podcastFeed('podcasts', 'https://example.com')).text();
	assert.equal((feed.match(/<item>/g) ?? []).length, 11);
	assert.doesNotMatch(feed, /sample-|full-[12]\.mp3|future\.mp3|full-14\.mp3|<title>R2<\/title>/);
	assert.match(feed, /full-3\.mp3" length="10000"/);
	assert.match(feed, /<itunes:duration>01:00:00<\/itunes:duration>/);
});

test('legacy favourites URL permanently redirects to the playlist', async () => {
	const { load } = await import('../../routes/favourites/+page.server.ts');
	assert.throws(() => load(), { status: 308, location: '/playlist/' });
});

test('playlist catalogue excludes unpublished episodes and uses the current full/sample selection', async () => {
	const { load: favourites } = await import('../../routes/playlist/+page.server.ts');
	const layout = (await loadLayout({} as Parameters<typeof loadLayout>[0]))!;
	const data = await favourites({ parent: async () => layout } as Parameters<typeof favourites>[0]) as {
		episodes: { slug: string; href: string; title: string; date: string; audio: { src: string; playbackType: string } }[];
	};
	assert.ok(!data.episodes.some(({ slug }) => ['future', 'draft-audio'].includes(slug)));
	const archived = data.episodes.find(({ slug }) => slug === 'rolling-2')!;
	assert.equal(archived.audio.playbackType, 'sample');
	assert.equal(archived.audio.src, 'https://audio.relaxivity.app/sample-2.mp3');
	assert.equal(archived.href, '/podcasts/rolling-2/');
	assert.equal(archived.date, '2026-09-02');
	assert.equal(data.episodes.find(({ slug }) => slug === 'rolling-1')?.audio.playbackType, 'full');
	assert.ok(!('body' in archived));
	assert.ok(!('html' in archived));
	assert.doesNotMatch(JSON.stringify(archived), /full-2\.mp3/);
});

test('taxonomy archives retain episode metadata, descendant categories and mixed content in newest-first order', async () => {
	const { archive } = await import('./taxonomy.ts');
	const { publicAudio } = await import('../audio/availability.ts');
	await write('categories', 'playlist-parent', { title: 'Parent' });
	await write('categories', 'playlist-child', { title: 'Child', parent: 'playlist-parent' });
	await write('tags', 'playlist-tag', { title: 'Playlist tag' });
	const common = { category: 'playlist-child', tags: ['playlist-tag'], narrator: 'reader' };
	await write('podcasts', 'taxonomy-z-new', {
		...common, title: 'Newest', date: '2025-03-01T10:00:00', audio: 'new.mp3',
		permanentlyFree: true, featuredImage: '/new.jpg', duration: '00:10:00'
	});
	// Real CMS YAML timestamps are parsed as Date objects, unlike quoted string dates.
	await fs.writeFile(path.join(root, 'content/podcasts/taxonomy-a-old.md'),
		'---\ntitle: Oldest\ndate: 2025-01-01T10:00:00\ncategory: playlist-child\ntags: [playlist-tag]\nnarrator: reader\naudio: old.mp3\nsampleAudio: old-sample.mp3\nsampleDuration: "00:01:00"\nfeaturedImage: /old.jpg\n---\nTranscript');
	await write('posts', 'taxonomy-post', { ...common, title: 'Post', date: '2025-02-01T10:00:00' });
	await write('podcasts', 'taxonomy-draft', { ...common, title: 'Draft', date: '2025-04-01', draft: true });
	await write('podcasts', 'taxonomy-future', { ...common, title: 'Future', date: '2999-01-01' });
	for (const [kind, slug] of [['category', 'playlist-parent'], ['tag', 'playlist-tag']] as const) {
		const data = (await archive(kind, slug))!;
		assert.deepEqual(data.items.map((item) => item.title), ['Newest', 'Post', 'Oldest']);
		const oldest = data.items[2];
		assert.equal(oldest.date, '2025-01-01T10:00:00.000Z');
		assert.equal(oldest.featuredImage, '/old.jpg');
		assert.equal((oldest.narrator as { name: string }).name, 'Reader');
		assert.ok(!('html' in oldest));
		const layout = (await loadLayout({} as Parameters<typeof loadLayout>[0]))!;
		const audio = publicAudio(oldest, layout.freeEpisodeSlugs, layout.audioBaseUrl, layout.audioPublicationTime);
		assert.equal(audio.playbackType, 'sample');
		assert.equal(audio.duration, '00:01:00');
		assert.match(audio.src, /old-sample\.mp3$/);
	}
	assert.equal(await archive('tag', 'missing'), null);
});
