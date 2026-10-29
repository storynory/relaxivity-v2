import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import YAML from 'yaml';
import { readAll } from '../src/lib/content/read.ts';
import { compareEpisodes, isPublishedEpisode } from '../src/lib/audio/availability.ts';
import { audioPageSize } from '../src/lib/server/audio-archive.ts';

const buildDir = path.resolve('build');

async function htmlFiles(dir: string): Promise<string[]> {
	const files: string[] = [];
	for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) files.push(...(await htmlFiles(full)));
		else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
	}
	return files;
}

function targetFile(pathname: string): string {
	const relative = decodeURIComponent(pathname).replace(/^\/+/, '');
	if (!relative || relative.endsWith('/')) return path.join(buildDir, relative, 'index.html');
	return path.join(buildDir, relative);
}

test('all local links in prerendered HTML point to built files', async () => {
	const pages = await htmlFiles(buildDir);
	assert.ok(pages.length, 'No HTML pages found: run npm run build first');
	const missing: string[] = [];

	for (const page of pages) {
		const html = await fs.readFile(page, 'utf8');
		for (const match of html.matchAll(/\bhref=["']([^"']+)["']/g)) {
			const href = match[1];
			if (/^(?:#|mailto:|tel:|javascript:|data:)/i.test(href)) continue;
			const url = new URL(href, 'https://example.test/' + path.relative(buildDir, page).replace(/index\.html$/, ''));
			if (url.origin !== 'https://example.test') continue;
			const file = targetFile(url.pathname);
			// Keep relative links inside the build output.
			if (!file.startsWith(buildDir + path.sep)) {
				missing.push(`${path.relative(buildDir, page)}: unsafe link ${href}`);
				continue;
			}
			try {
				await fs.access(file);
			} catch {
				missing.push(`${path.relative(buildDir, page)} → ${href}`);
			}
		}
	}
	assert.deepEqual(missing, [], 'Broken internal links in prerendered pages');
});


test('public prerendered pages have exactly one main landmark', async () => {
	const pages = (await htmlFiles(buildDir)).filter((file) =>
		!path.relative(buildDir, file).startsWith('admin' + path.sep)
	);
	assert.ok(pages.length, 'Run npm run build first');
	for (const page of pages) {
		const html = await fs.readFile(page, 'utf8');
		// SvelteKit emits a minimal HTML redirect for this legacy route.
		if (path.relative(buildDir, page) === path.join('favourites', 'index.html')) continue;
		assert.equal([...html.matchAll(/<main(?:\s|>)/g)].length, 1, path.relative(buildDir, page));
		assert.equal([...html.matchAll(/<\/main>/g)].length, 1, path.relative(buildDir, page));
	}
});

test('playlist is built, utility links are visible, and the legacy URL redirects', async () => {
	const html = await fs.readFile(path.join(buildDir, 'playlist/index.html'), 'utf8');
	assert.match(html, /<title>My Playlist<\/title>/);
	assert.match(html, /<h1[^>]*>My Playlist<\/h1>/);
	const utility = html.match(/<nav\b[^>]*aria-label="Utility"[^>]*>(.*?)<\/nav>/s)?.[1] ?? '';
	assert.match(utility, /href="\/search\/"/);
	assert.match(utility, /href="\/playlist\/"/);
	assert.match(utility, /\/icons\.svg#search/);
	assert.match(utility, /\/icons\.svg#heart/);
	assert.match(utility, /Search/);
	assert.match(utility, /Playlist/);
	assert.match(utility, /href="\/audio\/"/);
	assert.match(utility, /\/icons\.svg#headphones/);
	const menu = html.match(/<nav\b[^>]*id="main-navigation"[^>]*>(.*?)<\/nav>/s)?.[1] ?? '';
	for (const [route, label, icon] of [['audio', 'Audio', 'headphones'], ['playlist', 'Playlist', 'heart'], ['search', 'Search', 'search']]) {
		const link = menu.match(new RegExp(`<a\\b[^>]*href="/${route}/"[^>]*>(.*?)</a>`, 's'))?.[1] ?? '';
		assert.ok(link.includes(label), `${label} is labelled in the main menu`);
		assert.ok(link.includes(`/icons.svg#${icon}`), `${label} has its menu icon`);
	}
	assert.doesNotMatch(html, /href="\/favourites\/"/);
	const redirect = await fs.readFile(path.join(buildDir, 'favourites/index.html'), 'utf8');
	assert.match(redirect, /http-equiv="refresh"/i);
	assert.match(redirect, /0;url=\/playlist\//);
});

test('audio archive pages are crawlable, canonical, and cover every published episode once', async () => {
	const episodes = (await readAll('audio')).filter(({ data }) => isPublishedEpisode(data))
		.sort((a, b) => compareEpisodes({ ...a.data, slug: a.meta.slug }, { ...b.data, slug: b.meta.slug }));
	const expected = episodes.map(({ meta }) => `/audio/${encodeURIComponent(meta.slug!)}/`);
	const pageCount = Math.max(1, Math.ceil(expected.length / audioPageSize));
	const seen: string[] = [];
	const sitemap = await fs.readFile(path.join(buildDir, 'sitemap.xml'), 'utf8');
	for (let page = 1; page <= pageCount; page++) {
		const href = page === 1 ? '/audio/' : `/audio/page/${page}/`;
		const html = await fs.readFile(targetFile(href), 'utf8');
		assert.ok(html.includes(`rel="canonical" href="https://relaxivity.app${href}"`), href);
		assert.ok(sitemap.includes(`https://relaxivity.app${href}</loc>`), href);
		assert.doesNotMatch(html, /href="\/podcasts\//);
		const links = [...html.matchAll(/<h2[^>]*>\s*<a href="([^"#]+)"/g)].map((match) => match[1]);
		assert.deepEqual(links, expected.slice((page - 1) * audioPageSize, page * audioPageSize), href);
		seen.push(...links);
		if (page < pageCount) assert.match(html, new RegExp(`href="/audio/page/${page + 1}/"[^>]*rel="next"`));
		if (page > 1) {
			const previous = page === 2 ? '/audio/' : `/audio/page/${page - 1}/`;
			assert.ok(html.includes(`href="${previous}" rel="prev"`), href);
		}
	}
	assert.deepEqual(seen, expected);
	assert.equal(new Set(seen).size, expected.length);
	const feed = await fs.readFile(path.join(buildDir, 'audio/feed.xml'), 'utf8');
	assert.match(feed, /<rss /);
	assert.match(feed, /\/audio\//);
	assert.doesNotMatch(feed, /\/podcasts\//);
});

test('podcast artwork and header logo reserve image space in rendered HTML', async () => {
	const html = await fs.readFile(path.join(buildDir, 'audio/birth-of-buddha/index.html'), 'utf8');
	const images = [...html.matchAll(/<img\b[^>]*>/g)].map((match) => match[0]);
	assert.ok(images.length >= 2);
	for (const image of images) {
		assert.match(image, /\bwidth="[1-9]\d*"/);
		assert.match(image, /\bheight="[1-9]\d*"/);
	}
	assert.match(images[0], /\bloading="eager"/);
});


test('taxonomy pages render optional artwork and SEO overrides with content fallbacks', async () => {
	const settings = YAML.parse(await fs.readFile('content/settings/general.yml', 'utf8'));
	const text = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
	const decode = (value: string) => value.replace(/&quot;/g, '"').replace(/&#(?:39|x27);/g, "'")
		.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
	for (const [collection, route] of [['tags', 'tag'], ['categories', 'category']]) {
		for (const file of await fs.readdir(`content/${collection}`)) {
			if (!file.endsWith('.yml')) continue;
			const term = YAML.parse(await fs.readFile(`content/${collection}/${file}`, 'utf8'));
			const slug = file.slice(0, -4);
			const html = await fs.readFile(path.join(buildDir, route, slug, 'index.html'), 'utf8');
			const head = html.split('</head>')[0];
			const meta = (name: string) => {
				const tag = [...head.matchAll(/<meta\b[^>]*>/g)].find(([tag]) =>
					tag.includes(`name="${name}"`) || tag.includes(`property="${name}"`));
				return decode(tag?.[0].match(/content="([^"]*)"/)?.[1] ?? '');
			};
			const title = text(term.seo?.title) || text(term.title);
			const description = text(term.seo?.description) || text(term.description) || text(settings.description);
			const image = text(term.seo?.image) || text(term.image) || text(settings.defaultImage);
			assert.equal(decode(head.match(/<title>(.*?)<\/title>/s)?.[1] ?? ''), title, `${route}/${slug} title`);
			for (const key of ['og:title', 'twitter:title']) assert.equal(meta(key), title);
			for (const key of ['description', 'og:description', 'twitter:description']) assert.equal(meta(key), description);
			for (const key of ['og:image', 'twitter:image']) {
				assert.equal(meta(key), image ? new URL(image, settings.siteUrl + '/').href : '');
			}
			const body = html.split('</head>')[1];
			assert.equal(body.includes('class="archive-image'), Boolean(text(term.image)), `${route}/${slug} artwork`);
			if (text(term.image)) {
				const artwork = body.match(/class="archive-image[^>]*>.*?<img\b[^>]*>/s)?.[0] ?? '';
				assert.ok(artwork.includes(`alt="${term.title}"`), `${route}/${slug} image alt`);
				assert.match(artwork, /loading="eager"/);
			}
		}
	}
});
