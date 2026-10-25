import { collections } from '#lib/generated/collections.ts';
import { publicCollections, publicCollection } from '#lib/server/public-routes.ts';
import { standardFeed, podcastFeed } from '#lib/server/feed-handlers.ts';
import type { EntryGenerator, RequestHandler } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () =>
  publicCollections()
    .filter((collection) => collections[collection].rss !== false)
    .map((collection) => ({ collection }));

export const GET: RequestHandler = ({ params, url }) => {
  const collection = publicCollection(params.collection);
  if (!collection) return new Response('Not found', { status: 404 });

  const type: string = String(collections[collection].rss);
  if (type === 'standard') return standardFeed(collection, url.origin);
  if (type === 'podcast') return podcastFeed(collection, url.origin);
  return new Response('No feed for this collection', { status: 404 });
};
