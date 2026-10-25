<script lang="ts">
	import type { ListingData } from './types.ts';
	import { relationLabel, textField } from '#lib/templates/fields.ts';
	import Picture from '#lib/components/Picture.svelte';

	let { data }: { data: ListingData } = $props();
	const episodes = $derived([...data.items].sort((a, b) =>
		textField(b, 'date').localeCompare(textField(a, 'date'))
	));
</script>

<main>
	<h1>Podcasts</h1>
	{#if !episodes.length}
		<p>No published episodes yet.</p>
	{:else}
		{#each episodes as episode (String(episode.slug))}
			<article>
				{#if textField(episode, 'featuredImage')}
					<Picture src={textField(episode, 'featuredImage')} alt={textField(episode, 'featuredImageAlt') || textField(episode, 'title')} sizes="(min-width: 760px) 200px, 100vw" />
				{/if}
				<div>
					<h2><a href={`/${data.collection}/${encodeURIComponent(String(episode.slug))}/`}>{textField(episode, 'title') || String(episode.slug)}</a></h2>
					<p class="meta">
						{#if textField(episode, 'date')}<time datetime={textField(episode, 'date')}>{textField(episode, 'date').slice(0, 10)}</time>{/if}
						{#if textField(episode, 'duration')}<span>{textField(episode, 'duration')}</span>{/if}
						{#if relationLabel(episode.narrator, 'name')}<span>Narrated by {relationLabel(episode.narrator, 'name')}</span>{/if}
					</p>
					{#if textField(episode, 'excerpt') || textField(episode, 'description')}<p>{textField(episode, 'excerpt') || textField(episode, 'description')}</p>{/if}
				</div>
			</article>
		{/each}
	{/if}
</main>

<style>
	main { max-width: 900px; margin: 4rem auto; padding: 0 1.5rem; }
	article { display: grid; grid-template-columns: minmax(0, 200px) minmax(0, 1fr); gap: 1.25rem; padding-bottom: 1.5rem; margin-bottom: 2rem; border-bottom: 1px solid #ddd; }
	article :global(picture) { display: block; max-width: 100%; }
	article :global(img) { width: 100%; height: auto; }
	h2 { margin: 0; }
	.meta { display: flex; flex-wrap: wrap; gap: 1rem; color: #666; }
	a { color: inherit; }
	@media (max-width: 560px) { article { grid-template-columns: minmax(0, 1fr); } }
</style>
