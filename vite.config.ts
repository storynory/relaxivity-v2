import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			adapter: adapter(),

			prerender: {
				entries: ['*'],
				handleUnseenRoutes: ({ routes }) => {
					// These routes can legitimately have no entries when their collections are empty.
					const optional = ['/preview/[slug]', '/audio/page/[page]', '/category/[slug]', '/tag/[slug]', '/tag/[slug]/page/[page]'];
					const unexpected = routes.filter((route) => !optional.includes(route));
					if (unexpected.length) {
						throw new Error(`Prerenderable routes were not generated: ${unexpected.join(', ')}`);
					}
				}
			}
		})
	]
});
