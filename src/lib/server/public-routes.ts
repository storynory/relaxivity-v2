import { collections } from '#lib/generated/collections.ts';
import type { FolderCollectionName } from '#lib/server/content.ts';
import { homePageSlug } from '#lib/server/home.ts';
import { readAll } from '#lib/content/read.ts';

export function publicCollections(): FolderCollectionName[] {
	return Object.keys(collections).filter((name): name is FolderCollectionName => {
		const def = collections[name as keyof typeof collections];
		return def.kind === 'folder' && def.publicRoute;
	});
}

export function publicCollection(name: string): FolderCollectionName | null {
	return publicCollections().find((item) => item === name) ?? null;
}

export function published(data: Record<string, unknown>): boolean {
	return data.draft !== true;
}

export async function publicEntries(): Promise<{ collection: string; slug: string }[]> {
	const home = await homePageSlug();
	const items = await Promise.all(
		publicCollections().map(async (collection) =>
			(await readAll(collection))
				.filter((item) => published(item.data) && item.meta.slug && !(collection === 'pages' && item.meta.slug === home))
				.map((item) => ({ collection, slug: item.meta.slug! }))
		)
	);
	return items.flat();
}
