<script lang="ts">
	import { getContext } from 'svelte';
	import { favouritesKey, type Favourites } from '#lib/audio/favourites.ts';
	import type { Track } from '#lib/audio/playback.ts';
	import AutoAdvanceSwitch from '#lib/components/AutoAdvanceSwitch.svelte';
	import AudioPlayer from '#lib/components/AudioPlayer.svelte';
	import FavouriteButton from '#lib/components/FavouriteButton.svelte';
	import Picture from '#lib/components/Picture.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const favourites = getContext<Favourites>(favouritesKey);
	const catalogue = $derived(new Map(data.episodes.map((episode) => [episode.slug, episode])));
	const saved = $derived($favourites.slugs.map((slug) => ({ slug, episode: catalogue.get(slug) })));
	const tracks: Track[] = $derived(saved.flatMap(({ episode }) => episode?.audio.src ? [{
		src: episode.audio.src,
		title: episode.audio.playbackType === 'sample' ? `${episode.title} — Audio Sample` : episode.title,
		href: episode.href,
		artwork: episode.artwork,
		duration: episode.audio.duration
	}] : []));
</script>

<svelte:head>
	<title>Favourites</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="container-narrow">
	<h1>Favourites</h1>
	<p>Your personal story playlist, saved on this browser.</p>
	{#if !$favourites.ready}
		<p role="status">Loading your favourites…</p>
	{:else if !saved.length}
		<p>No favourites yet. Use the heart button on a story to save it here.</p>
		<p><a href="/podcasts/">Browse stories</a></p>
	{:else}
		<div class="playlist-controls">
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
								<AudioPlayer src={episode.audio.src} queue={tracks}
									title={episode.audio.playbackType === 'sample' ? `${episode.title} — Audio Sample` : episode.title}
									href={episode.href} artwork={episode.artwork} duration={episode.audio.duration} />
							{:else}<p>Audio is currently unavailable for this story. It will be skipped.</p>{/if}
							<FavouriteButton {slug} title={episode.title} />
						</div>
					{:else}
						<p>This saved story is no longer available.</p>
						<FavouriteButton {slug} title="unavailable story" />
					{/if}
					<div class="reorder">
						<button type="button" disabled={index === 0} aria-label={`Move ${episode?.title ?? 'unavailable story'} earlier`}
							onclick={() => favourites.move(slug, -1)}>↑ Earlier</button>
						<button type="button" disabled={index === saved.length - 1} aria-label={`Move ${episode?.title ?? 'unavailable story'} later`}
							onclick={() => favourites.move(slug, 1)}>↓ Later</button>
					</div>
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
