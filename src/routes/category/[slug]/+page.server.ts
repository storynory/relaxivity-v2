import { error } from '@sveltejs/kit';
import { archive, terms } from '#lib/server/taxonomy.ts';
export const entries = async () => (await terms('category')).map(({ slug }) => ({ slug }));
export const load = async ({ params }: { params: { slug: string } }) => {
  const data = await archive('category', params.slug);
  if (!data) error(404, 'Category not found');
  return data;
};
