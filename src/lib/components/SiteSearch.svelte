<script lang="ts">
	import { onMount } from 'svelte';
	import Fuse from 'fuse.js';
	import { goto } from '$app/navigation';

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

	async function followResult(event: MouseEvent, url: string) {
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		const term = query.trim();
		if (!term) return;
		event.preventDefault();
		const searchUrl = new URL(window.location.href);
		searchUrl.searchParams.set('q', term);
		// Replace the current search entry before navigating to the chosen result.
		await goto(searchUrl.pathname + searchUrl.search, { replaceState: true });
		await goto(url);
	}
	let items = $state<SearchItem[]>([]);
	const topics = $derived(items.filter((item) => item.kind === 'tag').sort((a, b) => a.title.localeCompare(b.title)));
	let loading = $state(true);
	let loadError = $state('');

	const fuse = $derived(
		new Fuse(items, {
			includeScore: true,
			ignoreLocation: true,
			threshold: 0.4,
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
		query = new URL(window.location.href).searchParams.get('q') ?? '';
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

<form role="search" onsubmit={(event) => { event.preventDefault(); const term = query.trim(); if (term) void goto(`/search/?q=${encodeURIComponent(term)}`); }}>
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

{#if !loading && !loadError && !terms.length && topics.length}
	<section class="topics" aria-labelledby="topics-heading">
		<h2 id="topics-heading">Explore by topic</h2>
		<div class="topic-links">
			{#each topics as topic (topic.url)}
				<a href={topic.url}>{topic.title}</a>
			{/each}
		</div>
	</section>
{/if}

{#if !loading && !loadError && terms.length}
	<ul>
		{#each results as item (item.url)}
			<li>
				<h2><a href={item.url} onclick={(event) => followResult(event, item.url)}>{item.title}</a></h2>
				{#if item.excerpt}<p>{item.excerpt}</p>{/if}
				<small
					>{item.kind === 'category' ? 'Category' : item.kind === 'tag' ? 'Tag' : item.collection === 'audio' ? 'Story' : item.collection}{item.categories.length
						? ` · ${item.categories.join(', ')}`
						: ''}</small
				>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.topics { margin-top: 1.5rem; }
	.topics h2 { font-size: 1.1rem; margin-bottom: 0.75rem; }
	.topic-links { display: flex; flex-wrap: wrap; gap: 0.5rem; }
	.topic-links a { padding: 0.25rem 0; color: var(--accent); text-decoration: underline; text-underline-offset: 0.2em; }
	.topic-links a:hover, .topic-links a:focus-visible { text-decoration: underline; }
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
		background: var(--reading-background);
		color: var(--reading-text);
	}
	input:focus-visible {
		outline: 2px solid var(--reading-link);
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
