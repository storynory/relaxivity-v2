<script lang="ts">
	import { getContext } from 'svelte';
	import { favouritesKey, type Favourites } from '#lib/audio/favourites.ts';
	import { playbackKey, type Playback, type Track } from '#lib/audio/playback.ts';
	import { orderStories, type StoryOrder } from '#lib/audio/story-order.ts';
	import StoryOrderSelect from '#lib/components/StoryOrderSelect.svelte';
	import AutoAdvanceSwitch from '#lib/components/AutoAdvanceSwitch.svelte';
	import StoryCard from '#lib/components/StoryCard.svelte';
	import FavouriteButton from '#lib/components/FavouriteButton.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const favourites = getContext<Favourites>(favouritesKey);
	const playback = getContext<Playback>(playbackKey);
	// Keep the existing internal playback context when changing the public URL.
	let order = $state<StoryOrder>('manual');
	const catalogue = $derived(new Map(data.episodes.map((episode) => [episode.slug, episode])));
	const saved = $derived(
		orderStories(
			$favourites.slugs.map((slug) => {
				const episode = catalogue.get(slug);
				return { slug, episode, date: episode?.date, title: episode?.title };
			}),
			order
		)
	);
	const tracks: Track[] = $derived(
		saved.flatMap(({ episode }) =>
			episode?.audio.src
				? [
						{
							src: episode.audio.src,
							title:
								episode.audio.playbackType === 'sample'
									? `${episode.title} — Audio Sample`
									: episode.title,
							href: episode.href,
							artwork: episode.artwork,
							duration: episode.audio.duration
						}
					]
				: []
		)
	);
	$effect(() => {
		playback.reorderQueue(tracks, '/favourites/');
	});
</script>

<svelte:head>
	<title>My Playlist</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="container-narrow">
	<h1>My Playlist</h1>
	<p>Your favourite stories appear here. You can arrange the order and play the list.</p>
	{#if !$favourites.ready}
		<p role="status">Loading your playlist…</p>
	{:else if !saved.length}
		<p>Your playlist is empty. Use the heart button on a story to save it here.</p>
		<p><a href="/audio/">Browse stories</a></p>
	{:else}
		<div class="playlist-controls">
			<StoryOrderSelect bind:value={order} manual />
			<AutoAdvanceSwitch />
		</div>
		<ol>
			{#each saved as { slug, episode }, index (slug)}
				<li>
					{#snippet reorder()}
						{#if order === 'manual'}
							<button type="button" disabled={index === 0}
								aria-label={`Move ${episode?.title ?? 'unavailable story'} earlier`}
								onclick={() => favourites.move(slug, -1)}>↑ Earlier</button>
							<button type="button" disabled={index === saved.length - 1}
								aria-label={`Move ${episode?.title ?? 'unavailable story'} later`}
								onclick={() => favourites.move(slug, 1)}>↓ Later</button>
						{/if}
					{/snippet}
					{#if episode}
						<StoryCard {slug} title={episode.title} href={episode.href} artwork={episode.artwork}
							audio={episode.audio} queue={tracks} contextId="/favourites/" ordering={reorder} />
					{:else}
						<p>This saved story is no longer available.</p>
						<FavouriteButton {slug} title="unavailable story" />
						{@render reorder()}
					{/if}
				</li>
			{/each}
		</ol>
	{/if}
</main>

<style>
	main {
		padding-block: 2rem 4rem;
	}
	h1 {
		margin-top: 0;
	}
	ol { padding-inline-start: 1.25rem; }
	.playlist-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; margin-block: 1rem; }

	button {
		min-height: 44px;
		cursor: pointer;
		padding: 0.5em 0.8em;
		border: 1px solid currentColor;
		border-radius: var(--radius);
		background: transparent;
		color: inherit;
		font: inherit;
	}
	button:disabled {
		opacity: 0.4;
		cursor: default;
	}
</style>
