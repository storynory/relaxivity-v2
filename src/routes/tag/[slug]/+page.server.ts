import { error } from '@sveltejs/kit';
import { archive, terms } from '#lib/server/taxonomy.ts';
export const entries = async () => (await terms('tag')).map(({ slug }) => ({ slug }));
export const load = async ({ params }: { params: { slug: string } }) => {
  const data = await archive('tag', params.slug);
  if (!data) error(404, 'Tag not found');
  return data;
};
