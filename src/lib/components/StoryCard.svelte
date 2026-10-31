<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { publicAudio } from '#lib/audio/availability.ts';
	import type { Track } from '#lib/audio/playback.ts';
	import AudioPlayer from './AudioPlayer.svelte';
	import FavouriteButton from './FavouriteButton.svelte';
	import Picture from './Picture.svelte';

	let { slug, title, href, artwork = '', excerpt = '', narrator = '', audio,
		queue = [], contextId = '', headingLevel = 2, ordering }: {
		slug: string; title: string; href: string; artwork?: string; excerpt?: string;
		narrator?: string; audio?: ReturnType<typeof publicAudio>; queue?: Track[];
		contextId?: string; headingLevel?: 2 | 3; ordering?: Snippet;
	} = $props();

	function readableDuration(value: string) {
		if (!/^\d{1,3}:\d{2}(?::\d{2})?$/.test(value)) return value;
		const seconds = value.split(':').reduce((total, part) => total * 60 + Number(part), 0);
		return seconds < 60 ? 'Less than 1 min' : `${Math.round(seconds / 60)} min`;
	}
</script>

<article class="story-card" class:with-artwork={!!artwork}>
	{#if artwork}
		<a class="artwork" {href} tabindex="-1" aria-hidden="true">
			<Picture src={artwork} alt="" sizes="(max-width: 560px) calc(100vw - 48px), 200px" />
		</a>
	{/if}
	<div class="story-copy">
		<svelte:element this={`h${headingLevel}`}><a {href}>{title}</a></svelte:element>
		{#if audio || narrator}
			<p class="meta">
				{#if audio?.duration}<span>{readableDuration(audio.duration)}</span>{/if}
				{#if audio}<span>{audio.canPlayFullAudio ? 'Full Story · Free' : 'Audio Sample'}</span>{/if}
				{#if narrator}<span>Narrated by {narrator}</span>{/if}
			</p>
		{/if}
		{#if excerpt}<p class="excerpt">{excerpt}</p>{/if}
		{#if audio}
			<div class="actions">
				{#if audio.src}
					<AudioPlayer src={audio.src} title={audio.playbackType === 'sample' ? `${title} — Audio Sample` : title}
						{href} {artwork} {queue} {contextId} duration={audio.duration} compact />
				{/if}
				<FavouriteButton {slug} {title} />
			</div>
			{#if !audio.src}<p class="availability">Audio is currently unavailable for this story.</p>{/if}
		{/if}
		{#if ordering}<div class="ordering">{@render ordering()}</div>{/if}
	</div>
</article>

<style>
	.story-card { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1rem; padding-block: 1.25rem; border-bottom: 1px solid color-mix(in srgb, var(--text) 30%, var(--prime)); }
	.with-artwork { grid-template-columns: minmax(0, 200px) minmax(0, 1fr); }
	.artwork { display: block; align-self: start; aspect-ratio: 1; }
	.artwork :global(picture) { display: block; width: 100%; height: 100%; }
	.artwork :global(img) { display: block; width: 100%; height: 100%; object-fit: cover; }
	.story-copy { min-width: 0; overflow-wrap: anywhere; }
	h2, h3 { margin: 0; font-size: calc(var(--font-size) * var(--font-scale) * var(--font-scale)); }
	a { color: inherit; }
	.meta { display: flex; flex-wrap: wrap; gap: 0.25rem 0.75rem; margin-block: 0.5rem; font-size: 0.85em; }
	.excerpt { margin-block: 0.5rem 0.75rem; font-size: 0.9em; line-height: 1.5; }
	.actions, .ordering { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 0.75rem; margin-top: 0.75rem; }
	.actions { font-size: max(1rem, 0.85em); }
	.availability { margin-block: 0.5rem 0; font-size: 0.9em; }
	@media (max-width: 48rem) {
		h2, h3 { font-size: calc(var(--font-size) * var(--font-scale) * var(--font-scale) * 0.9); }
		.excerpt { font-size: max(1rem, 0.9em); }
	}
	@media (max-width: 560px) {
		.with-artwork { grid-template-columns: minmax(0, 1fr); }
	}
</style>
