import { collections, type CollectionName } from '#lib/generated/collections.ts';
import { readOne, type ReadResult } from '#lib/content/read.ts';
type RelatedRecord = (ReadResult['data'] & { slug: string }) | null;

type RelationDefinition = {
	collection: string;
	multiple: boolean;
	valueField: string;
};

export async function resolveRelations(
	collection: CollectionName,
	data: Record<string, unknown>
): Promise<Record<string, RelatedRecord | RelatedRecord[]>> {
	const definition = collections[collection];

	if (!('relations' in definition)) return {};

	const relations = definition.relations as Record<string, RelationDefinition>;
	const result: Record<string, RelatedRecord | RelatedRecord[]> = {};

	for (const [field, relation] of Object.entries(relations)) {
		if (relation.valueField !== '{{slug}}') {
			throw new Error(`Unsupported relationship value field: ${relation.valueField}`);
		}

		if (!(relation.collection in collections)) {
			throw new Error(`Unknown related collection: ${relation.collection}`);
		}

		const target = relation.collection as CollectionName;
		const value = data[field];

		const lookup = async (slug: unknown): Promise<RelatedRecord> => {
			if (typeof slug !== 'string' || !slug) return null;

			const record = await readOne(target, slug);
			return record ? { ...record.data, slug } : null;
		};

		if (relation.multiple) {
			const slugs = Array.isArray(value) ? value : value ? [value] : [];
			result[field] = await Promise.all(slugs.map(lookup));
		} else {
			result[field] = await lookup(value);
		}
	}

	return result;
}
