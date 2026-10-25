import { error } from '@sveltejs/kit';
import { readAll, readOne } from '#lib/content/read.ts';
import { renderMarkdown } from '#lib/content/render.ts';
import { resolveRelations } from '#lib/content/relations.ts';
import type { EntryGenerator, PageServerLoad } from './$types';

// Prerender published posts only. Draft previews remain available in local development,
// but are deliberately not included in the publicly deployed static site.
export const entries: EntryGenerator = async () => {
	const posts = await readAll('posts');
	return posts
		.filter((post) => post.data.draft !== true && post.meta.slug)
		.map((post) => ({ slug: post.meta.slug! }));
};

export const load: PageServerLoad = async ({ params }) => {
	const post = await readOne('posts', params.slug);

	if (!post) {
		error(404, 'Post not found');
	}

	// Resolve all relationships automatically
	const related = await resolveRelations('posts', post.data);

	const author = related.author;
	const category = related.category;
	const tags = related.tags;

	const authorData = author && !Array.isArray(author) ? author : null;
	const categoryData = category && !Array.isArray(category) ? category : null;

	return {
		title: String(post.data.title ?? params.slug),
		date: post.data.date ? String(post.data.date) : '',

		author: String(authorData?.name ?? ''),
		category: String(categoryData?.title ?? ''),

		tags: Array.isArray(tags)
			? tags.filter((tag) => tag !== null).map((tag) => String(tag.title ?? ''))
			: [],

		html: await renderMarkdown(post.body)
	};
};
