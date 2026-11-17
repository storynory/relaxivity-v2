<script lang="ts">
	import type { ListingData } from './types.ts';
	import { textField } from '#lib/templates/fields.ts';

	let { data }: { data: ListingData } = $props();
	// Default presentation retains newest-first ordering when dates are present.
	const sorted = $derived([...data.items].sort((a, b) =>
		textField(b, 'date').localeCompare(textField(a, 'date'))
	));
</script>

<main>
	<h1>{data.title}</h1>
	{#if data.description}<p>{data.description}</p>{/if}
	{#if !sorted.length}
		<p>No published content yet.</p>
	{:else}
		{#each sorted as item (String(item.slug))}
			<article>
				<h2><a href={`/${data.collection}/${encodeURIComponent(String(item.slug))}/`}>{textField(item, 'title') || textField(item, 'name') || String(item.slug)}</a></h2>
				{#if textField(item, 'excerpt')}<p>{textField(item, 'excerpt')}</p>{/if}
			</article>
		{/each}
	{/if}
</main>

<style>
	main { max-width: var(--wide-width); margin: var(--section-space) auto; padding: 0 var(--space); }
	article { padding-block: 1rem; border-bottom: 1px solid var(--prime); }
	article h2 { margin-top: 0; }
	article > :last-child { margin-bottom: 0; }
	a { color: var(--accent); }
</style>
