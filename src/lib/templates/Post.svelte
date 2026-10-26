<script lang="ts">
	import type { DetailTemplateData } from './types';
	import { relationLabel, relationLabels, textField } from './fields.ts';
	import Picture from '#lib/components/Picture.svelte';

	let { data }: { data: DetailTemplateData } = $props();
	const item = $derived(data.item);
	const title = $derived(data.title);
	const date = $derived(textField(item, 'date'));
	const author = $derived(relationLabel(item.author, 'name'));
	const categoryLabel = $derived(relationLabel(item.category, 'title'));
	const tags = $derived(relationLabels(item.tags, 'title'));
	const featuredImage = $derived(textField(item, 'featuredImage'));
	const featuredImageAlt = $derived(textField(item, 'featuredImageAlt'));
	const html = $derived(textField(item, 'html'));
</script>

<main>
	<article class="reading">
		<header>
			<h1>{title}</h1>
			<div class="meta">
				{#if date}<time>{date}</time>{/if}
				{#if author}<span>By {author}</span>{/if}
				{#if categoryLabel}<span>{categoryLabel}</span>{/if}
			</div>
		</header>
		{#if featuredImage}
			<Picture
				src={featuredImage}
				alt={featuredImageAlt || title}
				sizes="(min-width: 760px) 760px, 100vw"
			/>
		{/if}
		<div class="content">{@html html}</div>
		{#if tags.length}
			<footer>
				{#each tags as tag}<span class="tag">{tag}</span>{/each}
			</footer>
		{/if}
	</article>
</main>

<style>
	main {
		padding: clamp(1.5rem, 4vw, 3rem) min(var(--space), 5vw) clamp(3rem, 6vw, 5rem);
	}
	article { margin-inline: auto; }
	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
		font-size: 0.8em;
		line-height: 1.6;
		color: var(--text);
		margin-bottom: 2rem;
	}
	footer {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 2rem;
	}
	.tag {
		background: var(--gray);
		border-radius: 1rem;
		padding: 0.25rem 0.75rem;
	}
	.content :global(picture) {
		display: block;
		max-width: 100%;
	}
	.content :global(img) {
		display: block;
		max-width: 100%;
		height: auto;
	}
</style>
