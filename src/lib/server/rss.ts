import type { FolderCollectionName } from '#lib/server/content.ts';
import { readAll, readDoc } from '#lib/content/read.ts';
import { published } from '#lib/server/public-routes.ts';

export const xml = (value: unknown): string =>
	String(value ?? '').replace(/[&<>"']/g, (char) =>
		({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char] ?? char
	);

export function absoluteUrl(path: string, base: URL): string {
	return new URL(path, base).href;
}

export function publicationDate(value: unknown): string | null {
	if (typeof value !== 'string' && !(value instanceof Date)) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date.toUTCString();
}

export async function feedData(collection: FolderCollectionName, requestOrigin: string) {
	const settings = (await readDoc('settings', 'general')).data;
	const siteUrl = typeof settings.siteUrl === 'string' ? settings.siteUrl.trim() : '';
	const base = new URL(siteUrl || requestOrigin);
	const records = (await readAll(collection))
		.filter((record) => published(record.data) && record.meta.slug && publicationDate(record.data.date))
		.sort((a, b) => new Date(String(b.data.date)).getTime() - new Date(String(a.data.date)).getTime());
	return { settings, base, records };
}

export function channelHeader(title: string, link: string, description: string, language: string): string[] {
	return [
		`<title>${xml(title)}</title>`,
		`<link>${xml(link)}</link>`,
		`<description>${xml(description)}</description>`,
		`<language>${xml(language)}</language>`
	];
}

export const feedResponse = (body: string) =>
	new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });

export function itemBase(title: unknown, link: string, date: unknown, description: unknown): string[] {
	return [
		`<title>${xml(title)}</title>`,
		`<link>${xml(link)}</link>`,
		`<guid isPermaLink="true">${xml(link)}</guid>`,
		`<pubDate>${xml(publicationDate(date))}</pubDate>`,
		`<description>${xml(description)}</description>`
	];
}
