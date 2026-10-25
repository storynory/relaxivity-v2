<script lang="ts">
	import type { RenderedBlock } from '#lib/server/blocks.ts';
	import Picture from '#lib/components/Picture.svelte';
	let { block }: { block: RenderedBlock } = $props();
</script>

<section class:hero={block.type === 'hero'} class:panel={block.type === 'panel'} aria-label={block.heading}>
	{#if block.type === 'panel'}
		<div class="panel-layout" class:image-left={block.imagePosition === 'left'}>
			<div class="panel-text">
				{#if block.heading}<h2>{block.heading}</h2>{/if}
				{#if block.introduction}<p class="intro">{block.introduction}</p>{/if}
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
	{#if block.introduction}<p class="intro">{block.introduction}</p>{/if}
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
				<article>
					{#if item.image}
						<a href={`/${item.collection}/${encodeURIComponent(item.slug)}/`}>
							<Picture src={item.image} alt={item.title} sizes="(min-width: 900px) 280px, 100vw" />
						</a>
					{/if}
					<h3><a href={`/${item.collection}/${encodeURIComponent(item.slug)}/`}>{item.title}</a></h3>
					{#if item.excerpt}<p>{item.excerpt}</p>{/if}
				</article>
			{/each}
		</div>
	{/if}
</section>

<style>
	section { margin: 2.5em 0; }
	.panel { padding: 1.5em; background: var(--second); border-radius: var(--radius); }
	.panel-layout { display: grid; gap: var(--space); align-items: center; }
	@media (min-width: 700px) {
		.panel-layout:has(.panel-image) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
		.panel-layout.image-left .panel-image { grid-column: 1; grid-row: 1; }
		.panel-layout.image-left .panel-text { grid-column: 2; grid-row: 1; }
	}
	.panel-image :global(img) { display: block; width: 100%; height: auto; }
	.panel-image :global(picture) { display: block; }
	.hero { padding: 1.5em; background: var(--gray); border: 1px solid var(--prime); border-radius: var(--radius); }
	.hero :global(picture) { display: block; margin: 1.5em 0; }
	.hero :global(img) { display: block; width: 100%; height: auto; }
	.button { display: inline-block; padding: 0.75em 1.25em; border-radius: var(--radius); background: var(--accent); color: white; text-decoration: none; }
	.button:hover { filter: brightness(0.85); }
	h2 { margin-top: 0; }
	.intro { margin-bottom: 1.5em; }
	.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 230px), 1fr)); gap: var(--space); }
	article { min-width: 0; padding: 1em; background: var(--second); border-radius: var(--radius); }
	article h3 { margin-block: 0.5em; }
	article :global(img) { max-width: 100%; height: auto; }
	article :global(picture) { display: block; }
	article a { color: var(--accent); }
	.button { color: white; }
</style>
