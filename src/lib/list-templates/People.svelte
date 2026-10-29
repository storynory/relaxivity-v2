<script lang="ts">
	import type { ListingData } from './types.ts';
	import { textField } from '#lib/templates/fields.ts';
	import Picture from '#lib/components/Picture.svelte';

	let { data }: { data: ListingData } = $props();
</script>

<main>
	<h1>People</h1>
	{#if !data.items.length}
		<p>No published content yet.</p>
	{:else}
		{#each data.items as item (String(item.slug))}
			{@const name = textField(item, 'name') || String(item.slug)}
			{@const photo = textField(item, 'photo')}
			{@const roles = Array.isArray(item.roles) ? item.roles.filter((role): role is string => typeof role === 'string') : []}
			<article>
				{#if photo}<div class="portrait"><Picture src={photo} alt={name} sizes="128px" /></div>{/if}
				<div>
					<h2><a href={`/${data.collection}/${encodeURIComponent(String(item.slug))}/`}>{name}</a></h2>
					{#if roles.length}<p>{roles.join(', ')}</p>{/if}
				</div>
			</article>
		{/each}
	{/if}
</main>

<style>
	main { max-width: var(--wide-width); margin: 3em auto; padding: 0 var(--space); }
	article { display: flex; align-items: center; gap: 1.5rem; padding-block: 1.5rem; border-bottom: 1px solid var(--accent); }
	.portrait { width: clamp(4rem, 20vw, 8rem); flex-shrink: 0; }
	h2 { margin: 0 0 0.35rem; }
	p { margin: 0; }
</style>
