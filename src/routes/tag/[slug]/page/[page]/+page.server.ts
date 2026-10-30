import { error } from '@sveltejs/kit';
import { loadTagArchive, tagPageEntries } from '#lib/server/taxonomy.ts';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = tagPageEntries;

export const load: PageServerLoad = ({ params }) => {
	if (!/^[1-9]\d*$/.test(params.page) || Number(params.page) < 2) error(404, 'Tag page not found');
	return loadTagArchive(params.slug, Number(params.page));
};
