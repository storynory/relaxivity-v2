import { json } from '@sveltejs/kit';
import { getAll } from '#lib/server/content.ts';
import { homePageSlug } from '#lib/server/home.ts';
import { publicCollections, published } from '#lib/server/public-routes.ts';
import type { RequestHandler } from './$types';

export const prerender = true;

type Data = Record<string, unknown>;
const asText = (value: unknown): string => typeof value === 'string' ? value : '';

function relationNames(value: unknown): string[] {
	const values = Array.isArray(value) ? value : value ? [value] : [];
	return values.flatMap((related) => {
		if (!related || typeof related !== 'object') return [];
		const record = related as Data;
		const name = asText(record.title) || asText(record.name) || asText(record.slug);
		return name ? [name] : [];
	});
}

export const GET: RequestHandler = async () => {
	const home = await homePageSlug();
	const groups = await Promise.all(publicCollections().map(async (collection) => {
		const items = await getAll(collection, (records) =>
			records.filter((record) => published(record.data))
		);
		return items.map((item) => {
			const record = item as unknown as Data;
			return {
				title: asText(record.title) || asText(record.name) || item.slug,
				excerpt: asText(record.excerpt) || asText(record.description),
				url: collection === 'pages' && item.slug === home
					? '/'
					: `/${collection}/${encodeURIComponent(item.slug)}/`,
				collection,
				kind: 'content',
				categories: relationNames(record.category),
				tags: relationNames(record.tags)
			};
		});
	}));
  const archives = await Promise.all((['categories', 'tags'] as const).map(async (collection) => {
    const terms = await getAll(collection);
    return terms.map((term) => ({
      title: term.title,
      excerpt: asText(term.description),
      url: `/${collection === 'categories' ? 'category' : 'tag'}/${encodeURIComponent(term.slug)}/`,
      collection,
      kind: collection === 'categories' ? 'category' : 'tag',
      categories: [],
      tags: []
    }));
  }));
  return json([...archives.flat(), ...groups.flat()]);
};
