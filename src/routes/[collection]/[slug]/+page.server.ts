import { error } from '@sveltejs/kit';
import { collections } from '#lib/generated/collections.ts';
import { buildBlocks } from '#lib/server/blocks.ts';
import { homePageSlug } from '#lib/server/home.ts';
import { getOne } from '#lib/server/content.ts';
import { publicCollection, publicEntries, published } from '#lib/server/public-routes.ts';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = publicEntries;

export const load: PageServerLoad = async ({ params }) => {
	const collection = publicCollection(params.collection);
	if (!collection) error(404, 'Collection not found');
	if (collection === 'pages' && params.slug === await homePageSlug()) error(404, 'Visit the homepage at /');
	const item = await getOne(collection, params.slug);
	if (!item || !published(item as unknown as Record<string, unknown>)) {
		error(404, 'Content not found');
	}
	const record = item as unknown as Record<string, unknown>;
	const heading = record.title ?? record.name;
	return {
		title: typeof heading === 'string' && heading ? heading : params.slug,
		collection,
		template: collections[collection].template,
		item: record,
		blocks: await buildBlocks(record.blocks)
	};
};
