import { json } from '@sveltejs/kit';
import { readDoc } from '#lib/content/read.ts';

export const prerender = true;

export async function GET() {
	const { data } = await readDoc('settings', 'general');
	const options = data.podcastFeed as { audioBaseUrl?: string } | null;
	return json({ audioBaseUrl: options?.audioBaseUrl ?? '' });
}
