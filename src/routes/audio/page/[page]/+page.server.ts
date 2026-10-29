import { error } from '@sveltejs/kit';
import { audioPageEntries, loadAudioArchive } from '#lib/server/audio-archive.ts';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = audioPageEntries;

export const load: PageServerLoad = ({ params }) => {
	if (!/^[1-9]\d*$/.test(params.page) || Number(params.page) < 2) error(404, 'Audio page not found');
	return loadAudioArchive(Number(params.page));
};
