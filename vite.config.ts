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
					// Preview can be empty; audio pagination has no entries until a second page is needed.
					const optional = ['/preview/[slug]', '/audio/page/[page]'];
					const unexpected = routes.filter((route) => !optional.includes(route));
					if (unexpected.length) {
						throw new Error(`Prerenderable routes were not generated: ${unexpected.join(', ')}`);
					}
				}
			}
		})
	]
});
