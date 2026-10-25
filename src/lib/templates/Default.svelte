<script lang="ts">
	import type { DetailTemplateData } from './types';
	import { textField } from './fields.ts';
	let { data }: { data: DetailTemplateData } = $props();
	const html = $derived(textField(data.item, 'html'));
</script>

<main>
<article>
	<h1>{data.title}</h1>
	<div class="content">{@html html}</div>
</article>
</main>

<style>
	article { max-width: var(--content-width); margin: 3em auto; padding: 0 var(--space); line-height: var(--line-height); }
	.content :global(picture) { display: block; max-width: 100%; }
	.content :global(img) { display: block; max-width: 100%; height: auto; }
</style>
