import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import YAML from 'yaml';

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
		assert.equal([...html.matchAll(/<main(?:\s|>)/g)].length, 1, path.relative(buildDir, page));
		assert.equal([...html.matchAll(/<\/main>/g)].length, 1, path.relative(buildDir, page));
	}
});

test('podcast artwork and header logo reserve image space in rendered HTML', async () => {
	const html = await fs.readFile(path.join(buildDir, 'podcasts/birth-of-buddha/index.html'), 'utf8');
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
