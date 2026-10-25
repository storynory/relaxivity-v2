import { getAll, getOne } from '#lib/server/content.ts';
import { published, publicCollection } from '#lib/server/public-routes.ts';

// Blocks contain presentation settings; content remains in its own collection.
export type BlockItem = {
	collection: string;
	slug: string;
	title: string;
	excerpt: string;
	date: string;
	image: string;
};

export type RenderedBlock = {
	slug: string;
	type: string;
	heading: string;
	introduction: string;
	image: string;
	imageAlt: string;
	imagePosition: string;
	buttonText: string;
	buttonUrl: string;
	items: BlockItem[];
};

type Data = Record<string, unknown>;
const value = (data: Data, key: string): string =>
	typeof data[key] === 'string' ? data[key] as string : '';

function slugOf(value: unknown): string {
	if (typeof value === 'string') return value;
	if (value && typeof value === 'object' && !Array.isArray(value)) {
		const record = value as Data;
		return typeof record.slug === 'string' ? record.slug : '';
	}
	return '';
}

function matches(record: Data, block: Data): boolean {
	if (!published(record)) return false;
	const category = slugOf(block.category);
	if (category && slugOf(record.category) !== category) return false;
	const tags = Array.isArray(block.tags) ? block.tags.map(slugOf).filter(Boolean) : [];
	if (tags.length) {
		const recordTags = Array.isArray(record.tags) ? record.tags.map(slugOf) : [];
		const has = (tag: string) => recordTags.includes(tag);
		if (block.tagMatch === 'all' ? !tags.every(has) : !tags.some(has)) return false;
	}
	return true;
}

function toItem(record: Data, collection: string): BlockItem {
	return {
		collection,
		slug: value(record, 'slug'),
		title: value(record, 'title') || value(record, 'name') || value(record, 'slug'),
		excerpt: value(record, 'excerpt') || value(record, 'description'),
		date: value(record, 'date'),
		image: value(record, 'featuredImage')
	};
}

export async function buildBlock(slug: string): Promise<RenderedBlock | null> {
	const block = await getOne('blocks', slug);
	if (!block) return null;
	const settings = block as unknown as Data;
	const type = value(settings, 'type');
	const limit = typeof settings.limit === 'number' && Number.isFinite(settings.limit)
		? Math.max(1, Math.min(30, Math.floor(settings.limit))) : 4;
	let records: BlockItem[] = [];

	if (type === 'selected') {
		const selected = Array.isArray(settings.items) ? settings.items : [];
		for (const entry of selected) {
			if (!entry || typeof entry !== 'object') continue;
			const choice = entry as Data;
			// Sveltia variable-type list stores { type: 'posts', slug: '...' } (or podcasts).
			// Continue accepting older { collection, slug } records as well.
			const collection = publicCollection(value(choice, 'type') || value(choice, 'collection'));
			const selectedSlug = value(choice, 'slug');
			if (!collection || !selectedSlug) continue;
			const item = await getOne(collection, selectedSlug);
			if (item && published(item as unknown as Data)) {
				records.push(toItem(item as unknown as Data, collection));
			}
			if (records.length >= limit) break;
		}
	} else if (type === 'latest' || type === 'featured') {
		const collection = publicCollection(value(settings, 'collection'));
		if (collection) {
			const all = await getAll(collection, (items) => items
				.filter((item) => matches(item.data, settings))
				.filter((item) => type !== 'featured' || item.data.featured === true)
				.sort((a, b) => value(b.data, 'date').localeCompare(value(a.data, 'date')))
				.slice(0, limit));
			records = all.map((item) => toItem(item as unknown as Data, collection));
		}
	}
	return {
		slug,
		type,
		heading: value(settings, 'heading') || value(settings, 'title'),
		introduction: value(settings, 'introduction'),
		image: value(settings, 'image'),
		imageAlt: value(settings, 'imageAlt'),
		imagePosition: value(settings, 'imagePosition'),
		buttonText: value(settings, 'buttonText'),
		buttonUrl: value(settings, 'buttonUrl'),
		items: records
	};
}

/** Resolve an ordered list of block relations from a Page or other record. */
export async function buildBlocks(references: unknown): Promise<RenderedBlock[]> {
	if (!Array.isArray(references)) return [];
	const slugs = references.map(slugOf).filter(Boolean);
	const results = await Promise.all(slugs.map(buildBlock));
	return results.filter((block): block is RenderedBlock => block !== null);
}
