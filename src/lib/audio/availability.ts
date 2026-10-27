import { audioUrl } from './url.ts';

type Episode = Record<string, unknown>;
export type AudioAvailability = {
	isInFreeFeed: boolean;
	isPermanentlyFree: boolean;
	canPlayFullAudio: boolean;
	playbackType: 'full' | 'sample' | 'unavailable';
};

function timestamp(value: unknown): number {
	return typeof value === 'string' || value instanceof Date ? new Date(value).getTime() : NaN;
}

export function isPublishedEpisode(episode: Episode, now = Date.now()): boolean {
	return episode.draft !== true && timestamp(episode.date) <= now;
}

// Compare slugs directly so ties do not depend on filesystem order or locale.
export function compareEpisodes(a: Episode, b: Episode): number {
	const date = timestamp(b.date) - timestamp(a.date);
	if (date) return date;
	const left = String(a.slug ?? '');
	const right = String(b.slug ?? '');
	return left < right ? -1 : left > right ? 1 : 0;
}

export function latestFreeEpisodes<T extends Episode>(episodes: T[], now = Date.now()): T[] {
	return episodes.filter((episode) => isPublishedEpisode(episode, now))
		.sort(compareEpisodes).slice(0, 12);
}

// The layout supplies a publication snapshot and rolling IDs using the RSS selector.
// Select metadata together with its source; archived episodes never fall back to audio.
export function publicAudio(episode: Episode, freeSlugs: string[], base: unknown, now = Date.now()) {
	const published = isPublishedEpisode(episode, now);
	const isInFreeFeed = published && freeSlugs.includes(String(episode.slug));
	const isPermanentlyFree = episode.permanentlyFree === true;
	const canPlayFullAudio = published && (isInFreeFeed || isPermanentlyFree);
	const src = published ? audioUrl(canPlayFullAudio ? episode.audio : episode.sampleAudio, base) : '';
	const availability: AudioAvailability = {
		isInFreeFeed, isPermanentlyFree, canPlayFullAudio,
		playbackType: src ? canPlayFullAudio ? 'full' : 'sample' : 'unavailable'
	};
	return {
		...availability, src,
		duration: src && typeof episode[canPlayFullAudio ? 'duration' : 'sampleDuration'] === 'string'
			? String(episode[canPlayFullAudio ? 'duration' : 'sampleDuration']) : '',
		length: src ? episode[canPlayFullAudio ? 'length' : 'sampleLength'] : undefined
	};
}

export function subscriptionUrl(value: unknown): string {
	if (typeof value !== 'string') return '';
	try {
		const url = new URL(value);
		return /^https?:$/.test(url.protocol) && !url.username && !url.password ? url.href : '';
	} catch {
		return '';
	}
}
