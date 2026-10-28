<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import SiteHeader from '#lib/components/SiteHeader.svelte';
	import PersistentAudioPlayer from '#lib/components/PersistentAudioPlayer.svelte';
	import { onMount, setContext } from 'svelte';
	import { createPlayback, playbackKey } from '#lib/audio/playback.ts';
	import { createFavourites, favouritesKey, favouritesStorageKey } from '#lib/audio/favourites.ts';
	import '../styles/base.css';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
	const usesLora = $derived(
		[data.typography.bodyFont, data.typography.headingFont].some((stack) =>
			/^(['"]?)Lora\1\s*(?:,|$)/i.test(stack)
		)
	);
	const playback = createPlayback();
	setContext(playbackKey, playback);
	const favourites = createFavourites();
	setContext(favouritesKey, favourites);
	let playerHeight = $state(0);
	onMount(() => {
		favourites.load();
		const syncFavourites = (event: StorageEvent) => {
			if (event.key === favouritesStorageKey || event.key === null) favourites.load();
		};
		window.addEventListener('storage', syncFavourites);
		return () => window.removeEventListener('storage', syncFavourites);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{#if usesLora}
		<link rel="preload" href="/fonts/lora.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
	{/if}
	{#each data.feeds as feed (feed.href)}
		<link rel="alternate" type="application/rss+xml" title={feed.title} href={feed.href} />
	{/each}
</svelte:head>

<div
	class="site"
	style:padding-bottom={`${$playback.visible ? playerHeight : 0}px`}
	style:--font-body={data.typography.bodyFont}
	style:--font-heading={data.typography.headingFont}
	style:--font-size={`${data.typography.fontSize}px`}
	style:--font-scale={data.typography.fontScale}
	style:--line-height={data.typography.lineHeight}
	style:--prime={data.colours.prime}
	style:--accent={data.colours.accent}
	style:--second={data.colours.second}
	style:--gray={data.colours.gray}
	style:--text={data.colours.text}
	style:--surface-text={data.colours.surfaceText}
	style:--reading-background={data.colours.readingBackground}
	style:--reading-text={data.colours.readingText}
	style:--reading-link={data.colours.readingLink}
>
	<SiteHeader siteName={data.siteName} siteLogo={data.siteLogo} items={data.navigation} />
	{#if $favourites.ready && !$favourites.persistent}
		<p class="container" role="status">Browser storage is unavailable. Your favourites will be kept for this visit only.</p>
	{/if}
	{@render children()}
	<PersistentAudioPlayer bind:height={playerHeight} publisher={data.siteName} />
</div>

<style>
	.site {
		background: var(--prime);
		color: var(--text);
		min-height: 100vh;
		font: var(--font-size) / var(--line-height) var(--font-body);
	}
</style>
