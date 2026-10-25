import { readAll, readOne, readDoc, type ReadResult } from '#lib/content/read.ts';
import { resolveRelations } from '#lib/content/relations.ts';
import { renderMarkdown } from '#lib/content/render.ts';
import { collections, type CollectionName } from '#lib/generated/collections.ts';
import type { ContentByCollection } from '#lib/generated/types.ts';

// Folder collections can be listed and accessed by slug; files collections cannot.
export type FolderCollectionName = {
	[K in CollectionName]: (typeof collections)[K] extends { kind: 'folder' } ? K : never;
}[CollectionName];

type RelationDefinitions<K extends FolderCollectionName> =
	(typeof collections)[K] extends { relations: infer Relations } ? Relations : Record<never, never>;

// Relation slugs are replaced with the related records by resolveRelations().
type ResolvedRelations<K extends FolderCollectionName> = {
	[Field in keyof RelationDefinitions<K>]:
		RelationDefinitions<K>[Field] extends {
			collection: infer Target extends keyof ContentByCollection;
			multiple: infer Multiple extends boolean;
		}
			? Multiple extends true
				? (ContentByCollection[Target] | null)[]
				: ContentByCollection[Target] | null
			: unknown;
};

export type ContentItem<K extends FolderCollectionName> =
	Omit<ContentByCollection[K], keyof ResolvedRelations<K> | 'body'> &
	ResolvedRelations<K> & {
		slug: string;
		html: string;
	};

// The reader returns unvalidated YAML/frontmatter. This cast describes the schema
// provided by the CMS; runtime validation would be a separate improvement.
async function prepare<K extends FolderCollectionName>(
	collection: K,
	record: ReadResult
): Promise<ContentItem<K>> {
	const related = await resolveRelations(collection, record.data);

	return {
		...record.data,
		...related,
		slug: record.meta.slug ?? '',
		html: await renderMarkdown(record.body)
	} as ContentItem<K>;
}

export async function getOne<K extends FolderCollectionName>(
	collection: K,
	slug: string
): Promise<ContentItem<K> | null> {
	const record = await readOne(collection, slug);
	if (!record) return null;
	return prepare(collection, record);
}

// Selection sees stored relation slugs, including references whose targets are missing.
// Only selected records are prepared; missing targets then resolve to null as usual.
export async function getAll<K extends FolderCollectionName>(
	collection: K,
	select?: (records: ReadResult[]) => ReadResult[]
): Promise<ContentItem<K>[]> {
	const records = await readAll(collection);
	const selected = select ? select(records) : records;
	return Promise.all(selected.map((record) => prepare(collection, record)));
}

// Files collections have a different structure; keep this getter untyped for now.
export async function getSettings(
	collection: CollectionName = 'settings',
	document = 'general'
): Promise<Record<string, unknown>> {
	const record = await readDoc(collection, document);
	const related = await resolveRelations(collection, record.data);
	return { ...record.data, ...related };
}
