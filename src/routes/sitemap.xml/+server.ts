import { readDoc, readOne } from '#lib/content/read.ts';
import { homePageSlug } from '#lib/server/home.ts';
import { publicCollections, publicEntries, published } from '#lib/server/public-routes.ts';
import type { RequestHandler } from './$types';

// Generate this endpoint as a static XML file during the build.
export const prerender = true;

const escapeXml = (value: string): string =>
	value.replace(/[&<>"']/g, (char) => ({
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&apos;'
	})[char] ?? char);

export const GET: RequestHandler = async ({ url }) => {
	const settings = (await readDoc('settings', 'general')).data;
	const sitemap = settings.sitemap as { enabled?: boolean } | null | undefined;

	if (sitemap?.enabled === false) {
		return new Response('Sitemap disabled', { status: 404 });
	}

	const configuredUrl = typeof settings.siteUrl === 'string' ? settings.siteUrl.trim() : '';
	const base = new URL(configuredUrl || url.origin);
	const home = await readOne('pages', await homePageSlug());
	const paths: string[] = [];

	if (home && published(home.data)) paths.push('/');
	for (const collection of publicCollections()) paths.push(`/${collection}/`);
	for (const { collection, slug } of await publicEntries()) {
		paths.push(`/${collection}/${encodeURIComponent(slug)}/`);
	}

	const xml = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...paths.map((path) => `  <url><loc>${escapeXml(new URL(path, base).href)}</loc></url>`),
		'</urlset>'
	].join('\n');

	return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
