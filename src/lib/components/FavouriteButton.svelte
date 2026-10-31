<script lang="ts">
	import { getContext } from 'svelte';
	import { favouritesKey, type Favourites } from '#lib/audio/favourites.ts';
	let { slug, title }: { slug: string; title: string } = $props();
	const favourites = getContext<Favourites>(favouritesKey);
	const saved = $derived($favourites.slugs.includes(slug));
	let added = $state(false);
	function toggle() {
		added = !saved;
		favourites.toggle(slug);
	}
</script>

<button type="button" class:saved disabled={!$favourites.ready} aria-pressed={saved}
	aria-label={`${saved ? 'Remove' : 'Add'} ${title} ${saved ? 'from' : 'to'} playlist`}
	onclick={toggle}>
	<svg class:pulse={added && saved} aria-hidden="true" onanimationend={() => added = false}><use href="/icons.svg#heart" /></svg>
	{saved ? 'Remove from playlist' : 'Add to playlist'}
</button>

<style>
	button { min-height: 48px; padding: 0.5em 0.8em; border: 1px solid currentColor; border-radius: var(--radius); background: transparent; color: var(--text); font: inherit; cursor: pointer; transition: color 180ms ease; }
	button.saved { color: var(--accent); }
	button:disabled { opacity: 0.6; cursor: default; }
	svg { width: 1.1em; height: 1.1em; margin-inline-end: 0.25em; vertical-align: -0.15em; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
	.saved svg { fill: currentColor; }
	.pulse { animation: pulse 280ms ease-out; }
	@keyframes pulse { 50% { transform: scale(1.15); } }
	@media (prefers-reduced-motion: reduce) { .pulse { animation: none; } }
</style>
