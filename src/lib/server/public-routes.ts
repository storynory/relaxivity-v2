import { isPublishedEpisode } from '#lib/audio/availability.ts';
import { collections, templateNames } from '#lib/generated/collections.ts';
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

export function detailTemplate(collection: FolderCollectionName, record: Record<string, unknown>): string {
	const definition = collections[collection];
	const fallback = templateNames.some((name) => name === definition.template) ? definition.template : 'default';
	// Only collections with the optional CMS selector enable record overrides.
	const allowed: readonly string[] = definition.templateOverrides;
	if (!allowed.length || record.template == null || record.template === '') return fallback;
	if (typeof record.template === 'string' && allowed.includes(record.template)
		&& templateNames.some((name) => name === record.template)) return record.template;
	console.warn(`Invalid template override "${String(record.template)}" for ${collection}/${record.slug ?? ''}; using "${fallback}". Allowed: ${allowed.join(', ')}`);
	return fallback;
}

export function published(data: Record<string, unknown>, collection?: string): boolean {
	return collection === 'audio' ? isPublishedEpisode(data) : data.draft !== true;
}

export async function publicEntries(): Promise<{ collection: string; slug: string }[]> {
	const home = await homePageSlug();
	const items = await Promise.all(
		publicCollections().map(async (collection) =>
			(await readAll(collection))
				.filter((item) => published(item.data, collection) && item.meta.slug && !(collection === 'pages' && item.meta.slug === home))
				.map((item) => ({ collection, slug: item.meta.slug! }))
		)
	);
	return items.flat();
}
