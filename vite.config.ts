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
					// Preview has no entries when all posts are drafts or the collection is empty.
					const unexpected = routes.filter((route) => route !== '/preview/[slug]');
					if (unexpected.length) {
						throw new Error(`Prerenderable routes were not generated: ${unexpected.join(', ')}`);
					}
				}
			}
		})
	]
});
