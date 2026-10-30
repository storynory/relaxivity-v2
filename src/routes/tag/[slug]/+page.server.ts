import { loadTagArchive, terms } from '#lib/server/taxonomy.ts';
export const entries = async () => (await terms('tag')).map(({ slug }) => ({ slug }));
export const load = async ({ params }: { params: { slug: string } }) => {
  return loadTagArchive(params.slug);
};
