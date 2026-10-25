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
	<h1>{data.collection}</h1>
	{#if !sorted.length}
		<p>No published content yet.</p>
	{:else}
		{#each sorted as item (String(item.slug))}
			<article>
				<h2><a href={`/${data.collection}/${encodeURIComponent(String(item.slug))}/`}>{textField(item, 'title') || textField(item, 'name') || String(item.slug)}</a></h2>
				{#if textField(item, 'excerpt')}<p>{textField(item, 'excerpt')}</p>{/if}
				{#if textField(item, 'date')}<small>{textField(item, 'date')}</small>{/if}
			</article>
		{/each}
	{/if}
</main>

<style>
	main { max-width: var(--wide-width); margin: 3em auto; padding: 0 var(--space); }
	article { padding-bottom: 1.5em; margin-bottom: 2em; border-bottom: 1px solid var(--prime); }
	a { color: var(--accent); }
</style>
