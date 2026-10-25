import { error } from '@sveltejs/kit';
import { getOne } from '#lib/server/content.ts';
import { buildBlocks } from '#lib/server/blocks.ts';
import { homePageSlug } from '#lib/server/home.ts';
import { published } from '#lib/server/public-routes.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const slug = await homePageSlug();
	const item = await getOne('pages', slug);
	if (!item || !published(item as unknown as Record<string, unknown>)) {
		error(404, 'Homepage not found or unpublished');
	}
	const record = item as unknown as Record<string, unknown>;
	return {
		title: typeof record.title === 'string' ? record.title : 'Home',
		collection: 'pages',
		template: 'page',
		item: record,
		blocks: await buildBlocks(record.blocks)
	};
};
