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

<button type="button" class="button button--ghost" class:saved disabled={!$favourites.ready} aria-pressed={saved}
	aria-label={`${saved ? 'Remove' : 'Add'} ${title} ${saved ? 'from' : 'to'} playlist`}
	onclick={toggle}>
	<svg class:pulse={added && saved} aria-hidden="true" onanimationend={() => added = false}><use href="/icons.svg#heart" /></svg>
	{saved ? 'Remove from playlist' : 'Add to playlist'}
</button>

<style>
	svg { width: 1.1em; height: 1.1em; flex-shrink: 0; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
	.saved svg { fill: currentColor; }
	.pulse { animation: pulse 280ms ease-out; }
	@keyframes pulse { 50% { transform: scale(1.15); } }
	@media (prefers-reduced-motion: reduce) { .pulse { animation: none; } }
</style>
