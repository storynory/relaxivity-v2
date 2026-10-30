import { getAll, getOne } from '#lib/server/content.ts';
import { publicCollections, published } from '#lib/server/public-routes.ts';
import { collections } from '#lib/generated/collections.ts';
import { error } from '@sveltejs/kit';
import { storyDescription } from './story-description.ts';

export type TaxonomyKind = 'category' | 'tag';
export type ArchiveItem = Record<string, unknown> & { collection: string; slug: string; title: string; excerpt: string; date: string };

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
      if (!published(data, name)) return false;
      return kind === 'category'
        ? included.has(slugOf(data.category))
        : Array.isArray(data.tags) && data.tags.some((value) => included.has(slugOf(value)));
    }));
    return items.map((item): ArchiveItem => {
      const record = { ...item } as Record<string, unknown>;
      // Listings need episode metadata and relationships, but not the rendered body.
      delete record.html;
      return {
        ...record,
        collection: name,
        slug: item.slug,
        title: stringValue(record.title) || item.slug,
        excerpt: stringValue(record.excerpt) || stringValue(record.description),
        date: record.date instanceof Date ? record.date.toISOString() : stringValue(record.date)
      };
    });
  }));
  return {
    term: term as unknown as Record<string, unknown>,
    title: term.title,
    description: stringValue(term.description),
    items: content.flat().sort((a, b) => b.date.localeCompare(a.date)
      || a.collection.localeCompare(b.collection) || a.slug.localeCompare(b.slug))
  };
}

export const tagPageSize = 10;
export const tagPageHref = (slug: string, page: number) => page === 1
  ? `/tag/${encodeURIComponent(slug)}/` : `/tag/${encodeURIComponent(slug)}/page/${page}/`;

export async function tagPageEntries() {
  const entries: { slug: string; page: string }[] = [];
  for (const term of await terms('tag')) {
    const data = await archive('tag', term.slug);
    const count = Math.ceil((data?.items.length ?? 0) / tagPageSize);
    for (let page = 2; page <= count; page++) entries.push({ slug: term.slug, page: String(page) });
  }
  return entries;
}

export async function loadTagArchive(slug: string, page = 1) {
  if (!Number.isSafeInteger(page) || page < 1) error(404, 'Tag page not found');
  const data = await archive('tag', slug);
  if (!data) error(404, 'Tag not found');
  const totalPages = Math.max(1, Math.ceil(data.items.length / tagPageSize));
  if (page > totalPages) error(404, 'Tag page not found');
  const items = data.items.slice((page - 1) * tagPageSize, page * tagPageSize);
  const title = page === 1 ? data.title : `${data.title} Page ${page}`;
  const seo = data.term.seo && typeof data.term.seo === 'object' ? data.term.seo : {};
  return {
    ...data, title, items,
    term: page === 1 ? data.term : {
      ...data.term, seo: { ...seo, title, description: storyDescription(items, title) }
    },
    pagination: {
      page, totalPages, total: data.items.length,
      pages: Array.from({ length: totalPages }, (_, index) => ({
        number: index + 1, href: tagPageHref(slug, index + 1)
      }))
    }
  };
}
