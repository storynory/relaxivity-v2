import { collections } from '#lib/generated/collections.ts';
import { renderMarkdown } from '#lib/content/render.ts';
import type { FolderCollectionName } from '#lib/server/content.ts';
import { absoluteUrl, channelHeader, feedData, feedResponse, itemBase, xml } from '#lib/server/rss.ts';

export const standardFeed = async (collection: FolderCollectionName, origin: string): Promise<Response> => {
	if (String(collections[collection].rss) !== 'standard') return new Response('Feed disabled', { status: 404 });
	const { settings, base, records } = await feedData(collection, origin);
	const options = settings.rss as { enabled?: boolean; limit?: number; content?: string } | null;
	if (options?.enabled === false) return new Response('RSS disabled', { status: 404 });
	const limit = Number.isInteger(options?.limit) && (options?.limit ?? 0) > 0 ? options!.limit! : 20;
	const title = String(settings.siteName ?? 'Website');
	const description = String(settings.description ?? settings.tagline ?? '');
	const language = String(settings.language ?? 'en-GB');
	const items = await Promise.all(records.slice(0, limit).map(async ({ meta, data, body }) => {
		const link = absoluteUrl(`/${collection}/${encodeURIComponent(meta.slug!)}/`, base);
		const description = typeof data.excerpt === 'string' && data.excerpt.trim()
			? data.excerpt : typeof data.description === 'string' ? data.description : '';
		const contents = itemBase(data.title, link, data.date, description);
		if (options?.content === 'full') {
			contents.push(`<content:encoded><![CDATA[${(await renderMarkdown(body)).replaceAll(']]>', ']]]]><![CDATA[>')}]]></content:encoded>`);
		}
		return `<item>${contents.join('')}</item>`;
	}));
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>${channelHeader(title, absoluteUrl('/', base), description, language).join('')}
${items.join('\n')}
</channel></rss>`;
	return feedResponse(body);
};

export const podcastFeed = async (collection: FolderCollectionName, origin: string): Promise<Response> => {
	if (String(collections[collection].rss) !== 'podcast') return new Response('Podcast feed disabled', { status: 404 });
	const { settings, base, records } = await feedData(collection, origin);
	const options = settings.podcastFeed as {
		enabled?: boolean; limit?: number; title?: string; description?: string;
		author?: string; image?: string; category?: string; explicit?: boolean;
		ownerName?: string; ownerEmail?: string; type?: 'episodic' | 'serial';
	} | null;
	if (options?.enabled === false) return new Response('Podcast feed disabled', { status: 404 });
	const limit = Number.isInteger(options?.limit) && (options?.limit ?? 0) > 0 ? options!.limit! : 20;
	const title = options?.title || String(settings.siteName ?? 'Podcast');
	const description = options?.description || String(settings.description ?? settings.tagline ?? '');
	const language = String(settings.language ?? 'en-GB');
	const author = options?.author || title;
	const channel = channelHeader(title, absoluteUrl('/', base), description, language);
	channel.push(`<itunes:author>${xml(author)}</itunes:author>`);
	channel.push(`<itunes:summary>${xml(description)}</itunes:summary>`);
	channel.push(`<itunes:type>${options?.type === 'serial' ? 'serial' : 'episodic'}</itunes:type>`);
	if (options?.ownerName?.trim() && options?.ownerEmail?.trim()) {
		channel.push(`<itunes:owner><itunes:name>${xml(options.ownerName.trim())}</itunes:name><itunes:email>${xml(options.ownerEmail.trim())}</itunes:email></itunes:owner>`);
	}
	channel.push(`<itunes:explicit>${options?.explicit === true ? 'true' : 'false'}</itunes:explicit>`);
	if (options?.category) channel.push(`<itunes:category text="${xml(options.category)}"/>`);
	if (options?.image) {
		const image = absoluteUrl(options.image, base);
		channel.push(`<itunes:image href="${xml(image)}"/>`);
		channel.push(`<image><url>${xml(image)}</url><title>${xml(title)}</title><link>${xml(absoluteUrl('/', base))}</link></image>`);
	}
	const items = records
		.filter(({ data }) => {
			if (typeof data.audio !== 'string' || !/^https:\/\//i.test(data.audio)) return false;
			return typeof data.length === 'number' && Number.isSafeInteger(data.length) && data.length > 0;
		})
		.slice(0, limit)
		.map(({ meta, data }) => {
			const link = absoluteUrl(`/${collection}/${encodeURIComponent(meta.slug!)}/`, base);
			const description = typeof data.description === 'string' ? data.description : '';
			const contents = itemBase(data.title, link, data.date, description);
			contents.push(`<enclosure url="${xml(data.audio)}" length="${data.length}" type="audio/mpeg"/>`);
			if (typeof data.episodeNumber === 'number') contents.push(`<itunes:episode>${data.episodeNumber}</itunes:episode>`);
			if (typeof data.seasonNumber === 'number') contents.push(`<itunes:season>${data.seasonNumber}</itunes:season>`);
			if (typeof data.duration === 'string' && /^\d{1,3}:\d{2}(?::\d{2})?$/.test(data.duration))
				contents.push(`<itunes:duration>${xml(data.duration)}</itunes:duration>`);
			return `<item>${contents.join('')}</item>`;
		});
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
<channel>${channel.join('')}
${items.join('\n')}
</channel></rss>`;
	return feedResponse(body);
};

