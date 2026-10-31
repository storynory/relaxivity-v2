<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import SiteHeader from '#lib/components/SiteHeader.svelte';
	import SiteFooter from '#lib/components/SiteFooter.svelte';
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
	{#if data.siteLogo}
		<link rel="icon" type="image/png" sizes="16x16" href="/app-icons/favicon-16.png" />
		<link rel="icon" type="image/png" sizes="32x32" href="/app-icons/favicon-32.png" />
		<link rel="icon" type="image/png" sizes="48x48" href="/app-icons/favicon-48.png" />
		<link rel="apple-touch-icon" sizes="180x180" href="/app-icons/apple-touch-icon.png" />
	{:else}
		<link rel="icon" href={favicon} />
	{/if}
	<link rel="manifest" href="/site.webmanifest" />
	<meta name="theme-color" content={data.colours.prime} />
	{#if usesLora}
		<link rel="preload" href="/fonts/lora.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
		<link rel="preload" href="/fonts/lora-italic.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
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
		<p class="container" role="status">Browser storage is unavailable. Your playlist will be kept for this visit only.</p>
	{/if}
	<div class="site-content">
		{@render children()}
	</div>
	<SiteFooter {...data.footer} />
	<PersistentAudioPlayer bind:height={playerHeight} publisher={data.siteName} />
</div>

<style>
	.site {
		display: flex;
		flex-direction: column;
		background: var(--prime);
		color: var(--text);
		min-height: 100vh;
		min-height: 100dvh;
		font: var(--font-size) / var(--line-height) var(--font-body);
	}
	.site-content {
		/* Keep page margins inside the coloured site rather than exposing the body. */
		display: flow-root;
		flex: 1;
	}

	@media (max-width: 48rem) {
		/* Keep the gap below the masthead consistent across mobile page templates. */
		.site-content :global(main) {
			margin-top: 1rem;
			padding-top: 0;
			padding-inline: 0.75rem;
		}
		.site-content :global(main h1) {
			margin-top: 0;
		}
		.site-content :global(main > article:first-child) {
			margin-top: 0;
		}
	}
</style>
