import { readAll } from '#lib/content/read.ts';
import { compareEpisodes, isPublishedEpisode, publicAudio } from '#lib/audio/availability.ts';
import type { PageServerLoad } from './$types';

// Only this page needs the catalogue; favourites themselves stay in the browser.
export const load: PageServerLoad = async ({ parent }) => {
	const settings = await parent();
	const records = await readAll('audio');
	const text = (value: unknown) => typeof value === 'string' ? value : '';
	return {
		episodes: records
			.filter(({ data }) => isPublishedEpisode(data, settings.audioPublicationTime))
			.map(({ data, meta }): Record<string, unknown> & { slug: string } => ({ ...data, slug: meta.slug! }))
			.sort(compareEpisodes)
			.map((episode) => ({
				slug: episode.slug,
				title: text(episode.title) || episode.slug,
				date: episode.date instanceof Date ? episode.date.toISOString() : text(episode.date),
				excerpt: text(episode.excerpt),
				artwork: text(episode.featuredImage),
				href: `/audio/${encodeURIComponent(episode.slug)}/`,
				audio: publicAudio(episode, settings.freeEpisodeSlugs, settings.audioBaseUrl, settings.audioPublicationTime)
			}))
	};
};
