<script lang="ts">
	import type { DetailTemplateData } from './types';
	import { textField } from './fields.ts';
	import ContentBlock from '#lib/blocks/ContentBlock.svelte';
	let { data }: { data: DetailTemplateData } = $props();
	const html = $derived(textField(data.item, 'html'));
	const layout = $derived(textField(data.item, 'layout'));
	const excerpt = $derived(textField(data.item, 'excerpt'));
</script>

<main class:wide={layout === 'wide'}>
	<h1>{data.title}</h1>
	{#if excerpt}<p class="excerpt">{excerpt}</p>{/if}
	<div class="content">{@html html}</div>
	{#each data.blocks ?? [] as block (block.slug)}
		<ContentBlock {block} />
	{/each}
</main>

<style>
	main.wide { max-width: var(--wide-width); }
	.excerpt { font-size: 1.15em; color: var(--text); }
	main { max-width: var(--content-width); margin: 3em auto; padding: 0 var(--space); line-height: var(--line-height); }
	.content :global(picture) { display: block; max-width: 100%; }
	.content :global(img) { display: block; max-width: 100%; height: auto; }
</style>
