<script lang="ts">
	import type { RenderedBlock } from '#lib/server/blocks.ts';
	import Picture from '#lib/components/Picture.svelte';
	import StoryCard from '#lib/components/StoryCard.svelte';
	import { publicAudio } from '#lib/audio/availability.ts';
	import type { Track } from '#lib/audio/playback.ts';
	import { page } from '$app/state';
	let { block, queue = [] }: { block: RenderedBlock; queue?: Track[] } = $props();
</script>

<section class:hero={block.type === 'hero'} class:panel={block.type === 'panel'} aria-label={block.heading}>
	{#if block.type === 'panel'}
		<div class="panel-layout" class:image-left={block.imagePosition === 'left'}>
			<div class="panel-text">
				{#if block.heading}<h2>{block.heading}</h2>{/if}
				{#if block.introductionHtml}<div class="intro">{@html block.introductionHtml}</div>{/if}
				{#if block.buttonText && block.buttonUrl}
					<p><a class="button" href={block.buttonUrl}>{block.buttonText}</a></p>
				{/if}
			</div>
			{#if block.image}
				<div class="panel-image">
					<Picture src={block.image} alt={block.imageAlt} sizes="(min-width: 900px) 450px, 100vw" />
				</div>
			{/if}
		</div>
	{:else}
	{#if block.heading}<h2>{block.heading}</h2>{/if}
	{#if block.introductionHtml}<div class="intro">{@html block.introductionHtml}</div>{/if}
	{#if block.type === 'hero'}
		{#if block.image}
			<Picture src={block.image} alt={block.imageAlt} sizes="(min-width: 900px) 900px, 100vw" priority="high" />
		{/if}
		{#if block.buttonText && block.buttonUrl}
			<p><a class="button" href={block.buttonUrl}>{block.buttonText}</a></p>
		{/if}
	{/if}
	{/if}
	{#if block.items.length}
		<div class="cards">
			{#each block.items as item (`${item.collection}/${item.slug}`)}
				<StoryCard slug={item.slug} title={item.title} href={`/${item.collection}/${encodeURIComponent(item.slug)}/`}
					artwork={item.image} excerpt={item.excerpt} headingLevel={3}
					audio={item.audioRecord ? publicAudio(item.audioRecord, page.data.freeEpisodeSlugs, page.data.audioBaseUrl, page.data.audioPublicationTime) : undefined}
					{queue} contextId={page.url.pathname} />
			{/each}
		</div>
	{/if}
	{#if block.type !== 'hero' && block.type !== 'panel' && block.buttonText && block.buttonUrl}
		<p class="block-action"><a class="button" href={block.buttonUrl}>{block.buttonText}</a></p>
	{/if}
</section>

<style>
	section {
		margin: 2.5em 0;
		padding: 1.5em;
		background: var(--prime, #052025);
		color: var(--text);
		border-top: 1px solid color-mix(in srgb, var(--text) 30%, var(--prime));
	}
	.panel-layout { display: grid; gap: var(--space); align-items: center; }
	@media (min-width: 700px) {
		.panel-layout:has(.panel-image) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
		.panel-layout.image-left .panel-image { grid-column: 1; grid-row: 1; }
		.panel-layout.image-left .panel-text { grid-column: 2; grid-row: 1; }
	}
	.panel-image :global(img) { display: block; width: 100%; height: auto; }
	.panel-image :global(picture) { display: block; }
	.hero :global(picture) { display: block; margin: 1.5em 0; }
	.hero :global(img) { display: block; width: 100%; height: auto; }
	.button { display: inline-block; padding: 0.75em 1.25em; border-radius: var(--radius); background: var(--text); color: var(--prime); border: 1px solid var(--text); text-decoration: none; }
	.button:hover, .button:focus-visible { background: var(--prime); color: var(--text); }
	a:focus-visible { outline: 3px solid var(--text); outline-offset: 4px; }
	h2 { margin-top: 0; }
	.intro { margin-bottom: 1.5em; }
	.block-action { margin: 1.5rem 0 0; }
	.cards { display: grid; grid-template-columns: minmax(0, 1fr); }
	@media (max-width: 48rem) {
		section { padding: 0.5rem; margin-block: 1.5rem; }
	}
</style>
