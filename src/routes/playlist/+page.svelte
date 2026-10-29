<script lang="ts">
	import { getContext, tick } from 'svelte';
	import { favouritesKey, type Favourites } from '#lib/audio/favourites.ts';
	import { playbackKey, type Playback, type Track } from '#lib/audio/playback.ts';
	import { orderStories, type StoryOrder } from '#lib/audio/story-order.ts';
	import StoryOrderSelect from '#lib/components/StoryOrderSelect.svelte';
	import AutoAdvanceSwitch from '#lib/components/AutoAdvanceSwitch.svelte';
	import AudioPlayer from '#lib/components/AudioPlayer.svelte';
	import FavouriteButton from '#lib/components/FavouriteButton.svelte';
	import Picture from '#lib/components/Picture.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const favourites = getContext<Favourites>(favouritesKey);
	const playback = getContext<Playback>(playbackKey);
	// Keep the existing internal playback context when changing the public URL.
	let order = $state<StoryOrder>('manual');
	const catalogue = $derived(new Map(data.episodes.map((episode) => [episode.slug, episode])));
	const saved = $derived(orderStories($favourites.slugs.map((slug) => {
		const episode = catalogue.get(slug);
		return { slug, episode, date: episode?.date, title: episode?.title };
	}), order));
	const tracks: Track[] = $derived(saved.flatMap(({ episode }) => episode?.audio.src ? [{
		src: episode.audio.src,
		title: episode.audio.playbackType === 'sample' ? `${episode.title} — Audio Sample` : episode.title,
		href: episode.href,
		artwork: episode.artwork,
		duration: episode.audio.duration
	}] : []));
	async function changeOrder() {
		await tick();
		playback.reorderQueue(tracks, '/favourites/');
	}
</script>

<svelte:head>
	<title>My Playlist</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="container-narrow">
	<h1>My Playlist</h1>
	<p>Your saved recordings, kept in this browser. Play any story with “Play next story automatically” on to continue through your playlist in the selected order. Turn it off to play just one story.</p>
	{#if !$favourites.ready}
		<p role="status">Loading your playlist…</p>
	{:else if !saved.length}
		<p>Your playlist is empty. Use the heart button on a story to save it here.</p>
		<p><a href="/podcasts/">Browse stories</a></p>
	{:else}
		<div class="playlist-controls">
			<StoryOrderSelect bind:value={order} manual onchange={changeOrder} />
			<AutoAdvanceSwitch />
		</div>
		<ol>
			{#each saved as { slug, episode }, index (slug)}
				<li>
					{#if episode}
						<div class="story">
							{#if episode.artwork}<Picture src={episode.artwork} alt="" sizes="100px" />{/if}
							<div>
								<h2><a href={episode.href}>{episode.title}</a></h2>
								{#if episode.excerpt}<p>{episode.excerpt}</p>{/if}
								<p>{episode.audio.canPlayFullAudio ? 'Full Story · Free' : 'Audio Sample'}{episode.audio.duration ? ` · ${episode.audio.duration}` : ''}</p>
							</div>
						</div>
						<div class="actions">
							{#if episode.audio.src}
								<AudioPlayer src={episode.audio.src} queue={tracks} contextId="/favourites/"
									title={episode.audio.playbackType === 'sample' ? `${episode.title} — Audio Sample` : episode.title}
									href={episode.href} artwork={episode.artwork} duration={episode.audio.duration} />
							{:else}<p>Audio is currently unavailable for this story. It will be skipped.</p>{/if}
							<FavouriteButton {slug} title={episode.title} />
						</div>
					{:else}
						<p>This saved story is no longer available.</p>
						<FavouriteButton {slug} title="unavailable story" />
					{/if}
					{#if order === 'manual'}<div class="reorder">
						<button type="button" disabled={index === 0} aria-label={`Move ${episode?.title ?? 'unavailable story'} earlier`}
							onclick={() => favourites.move(slug, -1)}>↑ Earlier</button>
						<button type="button" disabled={index === saved.length - 1} aria-label={`Move ${episode?.title ?? 'unavailable story'} later`}
							onclick={() => favourites.move(slug, 1)}>↓ Later</button>
					</div>{/if}
				</li>
			{/each}
		</ol>
	{/if}
</main>

<style>
	main { padding-block: 2rem 4rem; }
	h1 { margin-top: 0; }
	h2 { margin: 0 0 0.5em; font-size: 1.25em; }
	ol { padding-inline-start: 1.5rem; }
	li { padding: 1.5rem 0; border-top: 1px solid color-mix(in srgb, var(--text) 30%, var(--prime)); }
	.story { display: flex; align-items: start; gap: 1rem; }
	.story > div { min-width: 0; overflow-wrap: anywhere; }
	.story :global(picture) { flex: 0 0 80px; max-width: 80px; }
	.story :global(img) { display: block; width: 100%; height: auto; }
	.playlist-controls, .actions, .reorder { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; margin-block: 1rem; }
	button { min-height: 44px; cursor: pointer; }
	.reorder button { padding: 0.5em 0.8em; border: 1px solid currentColor; border-radius: var(--radius); background: transparent; color: inherit; font: inherit; }
	button:disabled { opacity: 0.4; cursor: default; }
</style>
