import type { PageServerLoad } from './$types';

// Search content is downloaded on demand from the static search-index endpoint.
export const load: PageServerLoad = () => ({});
