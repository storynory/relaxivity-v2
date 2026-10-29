import { redirect } from '@sveltejs/kit';

// Prerendered as an HTML redirect so old bookmarks work on static hosts too.
export const load = () => redirect(308, '/playlist/');
