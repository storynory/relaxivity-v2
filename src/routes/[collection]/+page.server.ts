import { error } from '@sveltejs/kit';
import { collections } from '#lib/generated/collections.ts';
import { homePageSlug } from '#lib/server/home.ts';
import { getAll } from '#lib/server/content.ts';
import { publicCollection, publicCollections, published } from '#lib/server/public-routes.ts';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = () => publicCollections().map((collection) => ({ collection }));

export const load: PageServerLoad = async ({ params }) => {
	const collection = publicCollection(params.collection);
	if (!collection) error(404, 'Collection not found');

	const home = collection === 'pages' ? await homePageSlug() : null;
	const items = await getAll(collection, (records) => records.filter((record) =>
		published(record.data) && !(home && record.meta.slug === home)));
	return { collection, listTemplate: collections[collection].listTemplate, items: items as Record<string, unknown>[] };
};
