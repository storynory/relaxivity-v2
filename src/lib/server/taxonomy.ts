import { getAll, getOne } from '#lib/server/content.ts';
import { publicCollections, published } from '#lib/server/public-routes.ts';
import { collections } from '#lib/generated/collections.ts';

export type TaxonomyKind = 'category' | 'tag';
export type ArchiveItem = { collection: string; slug: string; title: string; excerpt: string; date: string };

const stringValue = (v: unknown) => typeof v === 'string' ? v : '';
const slugOf = (v: unknown): string => typeof v === 'string' ? v : v && typeof v === 'object' && 'slug' in v ? stringValue(v.slug) : '';

export async function terms(kind: TaxonomyKind) {
  const collection = kind === 'category' ? 'categories' : 'tags';
  const records = await getAll(collection);
  return records.map((term) => ({
    slug: term.slug,
    title: term.title,
    description: stringValue(term.description),
    parent: kind === 'category' ? slugOf('parent' in term ? term.parent : '') : ''
  })).sort((a, b) => a.title.localeCompare(b.title));
}

export async function archive(kind: TaxonomyKind, slug: string) {
  const collection = kind === 'category' ? 'categories' : 'tags';
  const term = await getOne(collection, slug);
  if (!term) return null;
  const allTerms = kind === 'category' ? await terms('category') : [];
  const included = new Set([slug]);
  // A parent category includes content from all descendants, without a depth limit.
  let changed = true;
  while (changed) {
    changed = false;
    for (const entry of allTerms) {
      if (!included.has(entry.slug) && included.has(entry.parent)) {
        included.add(entry.slug);
        changed = true;
      }
    }
  }

  const eligible = publicCollections().filter((name) => {
    const relations = collections[name].relations as Record<string, { collection: string }>;
    return kind === 'category' ? relations.category?.collection === 'categories' : relations.tags?.collection === 'tags';
  });
  const content = await Promise.all(eligible.map(async (name) => {
    const items = await getAll(name, (records) => records.filter(({ data }) => {
      if (!published(data)) return false;
      return kind === 'category'
        ? included.has(slugOf(data.category))
        : Array.isArray(data.tags) && data.tags.some((value) => included.has(slugOf(value)));
    }));
    return items.map((item): ArchiveItem => {
      const record = item as unknown as Record<string, unknown>;
      return {
        collection: name,
        slug: item.slug,
        title: stringValue(record.title) || item.slug,
        excerpt: stringValue(record.excerpt) || stringValue(record.description),
        date: stringValue(record.date)
      };
    });
  }));
  return {
    term: term as unknown as Record<string, unknown>,
    title: term.title,
    description: stringValue(term.description),
    items: content.flat().sort((a, b) => b.date.localeCompare(a.date))
  };
}
