import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import YAML from 'yaml';

const run = promisify(execFile);

test('YAML-only public collections get built archives, detail pages, SEO and search visibility', { timeout: 120_000 }, async () => {
	const project = process.cwd();
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'starter-archive-acceptance-'));
	try {
		// Build an isolated copy: never add fixture collections to the working site.
		for (const entry of ['src', 'scripts', 'static', 'content', 'package.json', 'package-lock.json', 'tsconfig.json', 'vite.config.ts']) {
			await fs.cp(path.join(project, entry), path.join(root, entry), { recursive: true });
		}
		// Reuse installed dependencies, but keep SvelteKit's writable generated
		// $app types and Vite caches local to the fixture.
		await fs.mkdir(path.join(root, 'node_modules'));
		for (const entry of await fs.readdir(path.join(project, 'node_modules'))) {
			if (entry === '$app' || entry.startsWith('.vite') || entry === '.cache') continue;
			await fs.symlink(path.join(project, 'node_modules', entry), path.join(root, 'node_modules', entry));
		}
		const settingsPath = path.join(root, 'content/settings/general.yml');
		const settings = YAML.parse(await fs.readFile(settingsPath, 'utf8'));
		settings.description = 'Acceptance site description.';
		settings.homePage = 'template-home';
		await fs.writeFile(settingsPath, YAML.stringify(settings));
		const fields = [
			{ name: 'title', widget: 'string' }, { name: 'excerpt', widget: 'text', required: false },
			{ name: 'body', widget: 'richtext', required: false }, { name: 'draft', widget: 'boolean', required: false }
		];
		await fs.writeFile(path.join(root, 'static/admin/collections/acceptance.yml'), YAML.stringify({ collections: [
			{ name: 'field-notes', label: 'Field Notes', public_route: true, folder: 'content/field-notes',
				template: 'post', list_template: 'default', fields,
				archive: { title: 'Field Notes Archive', introduction: 'Notes from our travels.',
					seo: { title: 'Explore Field Notes', description: 'Read our latest field notes.' } } },
			{ name: 'dispatches', label: 'Dispatches', public_route: true, folder: 'content/dispatches',
				template: 'default', fields },
			{ name: 'internal-notes', label: 'Internal Notes', public_route: false, folder: 'content/internal-notes', fields }
		] }));
		async function record(collection: string, slug: string, data: Record<string, unknown>) {
			await fs.mkdir(path.join(root, 'content', collection), { recursive: true });
			await fs.writeFile(path.join(root, 'content', collection, `${slug}.md`),
				`---\n${YAML.stringify(data)}---\nA **published body** for this record.\n`);
		}
		await record('field-notes', 'first-note', { title: 'A Field Note', excerpt: 'A note from the coast.' });
		await record('field-notes', 'draft-note', { title: 'Unpublished Note', draft: true });
		await record('field-notes', 'own-seo', { title: 'Another Note',
			seo: { title: 'Record SEO title', description: 'Record SEO description.' } });
		await record('dispatches', 'first-dispatch', { title: 'First Dispatch' });
		await record('internal-notes', 'private-note', { title: 'Private Note' });
		const page = { title: 'Template Example', excerpt: 'An introduction.', layout: 'wide',
			blocks: ['latest-stories'], seo: { title: 'Page SEO', description: 'Page description.' } };
		await record('pages', 'template-default', page);
		await record('pages', 'template-page', { ...page, template: 'page' });
		await record('pages', 'template-landing', { ...page, template: 'landing' });
		await record('pages', 'template-landing-standard', { ...page, layout: 'standard', template: 'landing' });
		await record('pages', 'template-home', { ...page, template: 'landing' });
		await record('pages', 'template-invalid', { ...page, template: 'podcast' });
		await record('pages', 'template-cleared', { ...page, template: null });

		try {
			await run('npm', ['run', 'build'], { cwd: root, maxBuffer: 8 * 1024 * 1024 });
			await run('npm', ['run', 'check'], { cwd: root, maxBuffer: 8 * 1024 * 1024 });
		} catch (error) {
			const result = error as Error & { stdout?: string; stderr?: string };
			throw new Error(`Acceptance build/check failed:\n${result.stdout ?? ''}\n${result.stderr ?? ''}`, { cause: error });
		}
		const html = (route: string) => fs.readFile(path.join(root, 'build', route, 'index.html'), 'utf8');
		const originalPage = await html('pages/template-default');
		const main = (value: string) => value.match(/<main\b[\s\S]*?<\/main>/)?.[0];
		for (const slug of ['template-page', 'template-invalid', 'template-cleared']) {
			assert.equal(main(await html(`pages/${slug}`)), main(originalPage));
		}
		const landing = await html('pages/template-landing');
		assert.doesNotMatch(main(await html('pages/template-landing-standard')) ?? '', /<main\b[^>]*class="[^"]*\bwide\b/);
		assert.match(await html(''), /class="landing\b/);
		await assert.rejects(() => html('pages/template-home'), { code: 'ENOENT' });
		assert.match(landing, /class="landing\b/);
		assert.doesNotMatch(originalPage, /class="landing\b/);
		for (const value of [originalPage, landing]) {
			assert.match(value, /<title>Page SEO<\/title>/);
			assert.ok(value.includes('name="description" content="Page description."'));
			assert.ok(value.includes('<strong>published body</strong>'));
			assert.match(value, /<main\b[^>]*class="[^"]*\bwide\b/);
			assert.ok(value.includes('Browse stories'));
		}
		const archive = await html('field-notes');
		assert.match(archive, /<h1[^>]*>Field Notes Archive<\/h1>/);
		assert.ok(archive.includes('Notes from our travels.'));
		assert.match(archive, /<title>Explore Field Notes<\/title>/);
		for (const name of ['name="description"', 'property="og:description"', 'name="twitter:description"']) {
			assert.ok(archive.includes(`${name} content="Read our latest field notes."`));
		}
		assert.ok(archive.includes('href="/field-notes/first-note/"'));
		assert.ok(!archive.includes('Unpublished Note'));
		assert.match(archive, /rel="canonical" href="[^"]*\/field-notes\/"/);
		const detail = await html('field-notes/first-note');
		assert.match(detail, /<h1[^>]*>A Field Note<\/h1>/);
		assert.ok(detail.includes('<strong>published body</strong>'));
		assert.match(detail, /<title>A Field Note<\/title>/);
		assert.ok(detail.includes('name="description" content="A note from the coast."'));
		const overridden = await html('field-notes/own-seo');
		assert.match(overridden, /<title>Record SEO title<\/title>/);
		assert.ok(overridden.includes('name="description" content="Record SEO description."'));

		// No archive settings: the label supplies both the heading and SEO title.
		const defaults = await html('dispatches');
		assert.match(defaults, /<h1[^>]*>Dispatches<\/h1>/);
		assert.match(defaults, /<title>Dispatches<\/title>/);
		assert.ok(defaults.includes('name="description" content="Acceptance site description."'));
		assert.match(await html('dispatches/first-dispatch'), /<title>First Dispatch<\/title>/);
		for (const route of ['field-notes/draft-note', 'internal-notes', 'internal-notes/private-note']) {
			await assert.rejects(() => html(route), { code: 'ENOENT' });
		}
		const search = JSON.parse(await fs.readFile(path.join(root, 'build/api/search-index'), 'utf8')) as { url: string }[];
		assert.ok(search.some(({ url }) => url === '/field-notes/first-note/'));
		assert.ok(search.some(({ url }) => url === '/dispatches/first-dispatch/'));
		assert.ok(!search.some(({ url }) => url.includes('draft-note') || url.includes('internal-notes')));
		const sitemap = await fs.readFile(path.join(root, 'build/sitemap.xml'), 'utf8');
		assert.ok(sitemap.includes('/field-notes/</loc>'));
		assert.ok(sitemap.includes('/field-notes/first-note/</loc>'));
	} finally {
		await fs.rm(root, { recursive: true, force: true });
	}
});
