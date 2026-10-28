import { writable } from 'svelte/store';

export const favouritesKey = Symbol('favourites');
export const favouritesStorageKey = 'relaxivity:favourites:v1';

export function createFavourites() {
	let slugs: string[] = [];
	let ready = false;
	let persistent = true;
	const store = writable({ slugs, ready, persistent });
	const publish = () => store.set({ slugs, ready, persistent });
	const save = () => {
		try {
			localStorage.setItem(favouritesStorageKey, JSON.stringify(slugs));
			persistent = true;
		} catch {
			persistent = false;
		}
		publish();
	};

	return {
		subscribe: store.subscribe,
		load() {
			try {
				const raw = localStorage.getItem(favouritesStorageKey);
				let saved: unknown;
				try { saved = JSON.parse(raw ?? '[]'); } catch { saved = []; }
				slugs = Array.isArray(saved)
					? [...new Set(saved.filter((slug): slug is string => typeof slug === 'string' && !!slug.trim()))]
					: [];
			} catch {
				persistent = false;
			}
			ready = true;
			publish();
		},
		toggle(slug: string) {
			if (!ready || !slug.trim()) return;
			slugs = slugs.includes(slug) ? slugs.filter((item) => item !== slug) : [...slugs, slug];
			save();
		},
		move(slug: string, direction: -1 | 1) {
			const index = slugs.indexOf(slug);
			const target = index + direction;
			if (index < 0 || target < 0 || target >= slugs.length) return;
			const reordered = [...slugs];
			[reordered[index], reordered[target]] = [reordered[target], reordered[index]];
			slugs = reordered;
			save();
		}
	};
}

export type Favourites = ReturnType<typeof createFavourites>;
