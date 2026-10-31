import { error } from '@sveltejs/kit';
import { readAll } from '#lib/content/read.ts';
import { compareEpisodes, isPublishedEpisode } from '#lib/audio/availability.ts';
import { getAll } from '#lib/server/content.ts';
import { storyDescription } from './story-description.ts';

export const audioPageSize = 10;
export const audioPageHref = (page: number) => page === 1 ? '/audio/' : `/audio/page/${page}/`;
const pageCount = (count: number) => Math.max(1, Math.ceil(count / audioPageSize));

export async function audioPageEntries() {
	const records = (await readAll('audio')).filter(({ data }) => isPublishedEpisode(data));
	return Array.from({ length: pageCount(records.length) - 1 }, (_, index) => ({ page: String(index + 2) }));
}

export async function loadAudioArchive(page = 1) {
	if (!Number.isSafeInteger(page) || page < 1) error(404, 'Audio page not found');
	let total = 0;
	const items = await getAll('audio', (records) => {
		const eligible = records.filter(({ data }) => isPublishedEpisode(data))
			.sort((a, b) => compareEpisodes({ ...a.data, slug: a.meta.slug }, { ...b.data, slug: b.meta.slug }));
		total = eligible.length;
		if (page > pageCount(total)) error(404, 'Audio page not found');
		// Select the page before rendering Markdown and resolving relationships.
		return eligible.slice((page - 1) * audioPageSize, page * audioPageSize);
	});
	const title = page === 1 ? 'Stories' : `Stories Page ${page}`;
	return {
		title,
		seo: { description: page > 1 ? storyDescription(items, title) : '' },
		collection: 'audio',
		listTemplate: 'episodes',
		items: items as unknown as Record<string, unknown>[],
		pagination: {
			page,
			totalPages: pageCount(total),
			total,
			pages: Array.from({ length: pageCount(total) }, (_, index) => ({ number: index + 1, href: audioPageHref(index + 1) }))
		}
	};
}
