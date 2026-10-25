<script lang="ts">
	import { onMount } from 'svelte';
	import Fuse from 'fuse.js';

	type SearchItem = {
		title: string;
		excerpt: string;
		url: string;
		collection: string;
		kind: 'category' | 'tag' | 'content';
		categories: string[];
		tags: string[];
	};

	let { indexUrl = '/api/search-index' }: { indexUrl?: string } = $props();

	let query = $state('');
	let items = $state<SearchItem[]>([]);
	let loading = $state(true);
	let loadError = $state('');

	const fuse = $derived(
		new Fuse(items, {
			includeScore: true,
			ignoreLocation: true,
			threshold: 0.3,
			keys: [
				{ name: 'title', weight: 5 },
				{ name: 'excerpt', weight: 3 },
				{ name: 'categories', weight: 2 },
				{ name: 'tags', weight: 2 }
			]
		})
	);
	const terms = $derived(query.trim().split(/\s+/).filter(Boolean));
	// Searching each word separately allows "Chinese dragon" to match a category
	// and a tag, even when the words don't occur in the same field.
	const results = $derived.by(() => {
		if (!terms.length) return [];
		const scores = new Map<string, { item: SearchItem; score: number; matches: number }>();
		for (const term of terms) {
			for (const match of fuse.search(term)) {
				const key = match.item.url;
				const existing = scores.get(key) ?? { item: match.item, score: 0, matches: 0 };
				existing.score += match.score ?? 1;
				existing.matches++;
				scores.set(key, existing);
			}
		}
		return [...scores.values()]
			.filter((entry) => entry.matches === terms.length)
			.sort((a, b) => {
        const priority = (item: SearchItem) => item.kind === 'category' ? 0 : item.kind === 'tag' ? 1 : 2;
        return priority(a.item) - priority(b.item) || a.score - b.score;
      })
			.map((entry) => entry.item);
	});

	onMount(async () => {
		try {
			const response = await fetch(indexUrl);
			if (!response.ok) throw new Error('Search index unavailable');
			items = await response.json();
		} catch {
			loadError = 'Search is unavailable at the moment.';
		} finally {
			loading = false;
		}
	});
</script>

<form role="search" onsubmit={(event) => event.preventDefault()}>
	<label for="site-search">Search the site</label>
	<input
		id="site-search"
		type="search"
		bind:value={query}
		placeholder="Search stories and pages…"
		autocomplete="off"
	/>
</form>

<p role="status">
	{#if loading}Loading search…
	{:else if loadError}{loadError}
	{:else if terms.length}{results.length} {results.length === 1 ? 'result' : 'results'} found{/if}
</p>

{#if !loading && !loadError && terms.length}
	<ul>
		{#each results as item (item.url)}
			<li>
				<h2><a href={item.url}>{item.title}</a></h2>
				{#if item.excerpt}<p>{item.excerpt}</p>{/if}
				<small
					>{item.kind === 'category' ? 'Category' : item.kind === 'tag' ? 'Tag' : item.collection}{item.categories.length
						? ` · ${item.categories.join(', ')}`
						: ''}</small
				>
			</li>
		{/each}
	</ul>
{/if}

<style>
	form {
		display: grid;
		gap: 0.5rem;
	}
	label {
		font-weight: bold;
	}
	input {
		width: 100%;
		padding: 0.8rem;
		border: 1px solid var(--prime);
		border-radius: var(--radius);
		font: inherit;
		background: var(--second);
		color: var(--text);
	}
	input:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	ul {
		list-style: none;
		padding: 0;
	}
	li {
		padding: 1rem 0;
		border-bottom: 1px solid var(--gray);
	}
	h2 {
		margin: 0 0 0.35rem;
		font-size: 1.2rem;
	}
	h2 a {
		color: var(--accent);
	}
	p {
		margin: 0.4rem 0;
	}
	small {
		opacity: 0.75;
	}
</style>
