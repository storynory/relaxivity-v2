<script lang="ts">
	import type { DetailTemplateData } from './types.ts';
	import { relationLabel, textField } from './fields.ts';
	import Picture from '#lib/components/Picture.svelte';
	import AudioPlayer from '#lib/components/AudioPlayer.svelte';

	let { data }: { data: DetailTemplateData } = $props();
	const item = $derived(data.item);
	const audio = $derived(textField(item, 'audio'));
	const duration = $derived(textField(item, 'duration'));
	const date = $derived(textField(item, 'date'));
	const artwork = $derived(textField(item, 'featuredImage'));
	const artworkAlt = $derived(textField(item, 'featuredImageAlt'));
	const number = $derived(textField(item, 'episodeNumber'));
	const season = $derived(textField(item, 'seasonNumber'));
	const narrator = $derived(relationLabel(item.narrator, 'name'));
	const author = $derived(relationLabel(item.author, 'name'));
	const presenter = $derived(relationLabel(item.presenter, 'name'));
	const producer = $derived(relationLabel(item.producer, 'name'));
	const description = $derived(textField(item, 'description'));
	const html = $derived(textField(item, 'html'));
</script>

<main>
<article>
	<header>
		<h1>{data.title}</h1>
		<div class="meta">
			{#if date}<time datetime={date}>{date.slice(0, 10)}</time>{/if}
			{#if season}<span>Season {season}</span>{/if}
			{#if number}<span>Episode {number}</span>{/if}
			{#if duration}<span>{duration}</span>{/if}
		</div>
	</header>

	{#if artwork}
		<Picture src={artwork} alt={artworkAlt || data.title} sizes="(min-width: 760px) 760px, 100vw" />
	{/if}

	{#if audio}
		<div class="player">
			<AudioPlayer src={audio} title={data.title} />
		</div>
	{/if}

	{#if author || narrator || presenter || producer}
		<div class="credits">
			{#if author}<p><strong>Written by:</strong> {author}</p>{/if}
			{#if narrator}<p><strong>Narrated by:</strong> {narrator}</p>{/if}
			{#if presenter}<p><strong>Presented by:</strong> {presenter}</p>{/if}
			{#if producer}<p><strong>Produced by:</strong> {producer}</p>{/if}
		</div>
	{/if}

	{#if description}<p class="description">{description}</p>{/if}
	{#if html}<section class="content" aria-label="Transcript and show notes">{@html html}</section>{/if}
</article>
</main>

<style>
	article { max-width: var(--content-width); margin: 3em auto; padding: 0 var(--space); line-height: var(--line-height); }
	h1 { font-size: calc(var(--font-size) * var(--font-scale) * var(--font-scale) * var(--font-scale)); line-height: 1.2; }
	.meta { display: flex; gap: 1rem; flex-wrap: wrap; color: var(--text); margin-bottom: 1.5rem; }
	.player { margin: 1.5rem 0; }
	.description { white-space: pre-line; }
	.credits { margin: 1.5rem 0; }
	.credits p { margin: .2rem 0; }
	.content :global(picture) { display: block; max-width: 100%; }
	.content :global(img) { display: block; max-width: 100%; height: auto; }
</style>
