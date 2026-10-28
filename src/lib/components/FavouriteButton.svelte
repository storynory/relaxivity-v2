<script lang="ts">
	import { getContext } from 'svelte';
	import { favouritesKey, type Favourites } from '#lib/audio/favourites.ts';
	let { slug, title }: { slug: string; title: string } = $props();
	const favourites = getContext<Favourites>(favouritesKey);
	const saved = $derived($favourites.slugs.includes(slug));
</script>

<button type="button" class:saved disabled={!$favourites.ready} aria-pressed={saved}
	aria-label={`${saved ? 'Remove' : 'Add'} ${title} ${saved ? 'from' : 'to'} favourites`}
	onclick={() => favourites.toggle(slug)}>
	<span aria-hidden="true">{saved ? '×' : '♡'}</span> {saved ? 'Remove from favourites' : 'Add to favourites'}
</button>

<style>
	button { min-height: 44px; padding: 0.5em 0.8em; border: 1px solid currentColor; border-radius: var(--radius); background: transparent; color: var(--text); font: inherit; cursor: pointer; }
	button.saved { color: var(--accent); }
	button:disabled { opacity: 0.6; cursor: default; }
	span { margin-inline-end: 0.25em; }
</style>
