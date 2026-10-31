import { error } from '@sveltejs/kit';
import { collections } from '#lib/generated/collections.ts';
import { homePageSlug } from '#lib/server/home.ts';
import { getAll } from '#lib/server/content.ts';
import { publicCollection, publicCollections, published } from '#lib/server/public-routes.ts';
import { loadAudioArchive } from '#lib/server/audio-archive.ts';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = () => publicCollections().map((collection) => ({ collection }));

export const load: PageServerLoad = async ({ params }) => {
	const collection = publicCollection(params.collection);
	if (!collection) error(404, 'Collection not found');
	if (collection === 'audio') return loadAudioArchive();

	const home = collection === 'pages' ? await homePageSlug() : null;
	const items = await getAll(collection, (records) => records.filter((record) =>
		published(record.data, collection) && !(home && record.meta.slug === home)));
	const definition = collections[collection];
	return {
		collection, listTemplate: definition.listTemplate, items: items as Record<string, unknown>[],
		title: definition.archive.title,
		description: definition.archive.introduction,
		seo: definition.archive.seo
	};
};
