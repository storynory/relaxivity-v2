<script lang="ts">
	import { page } from '$app/state';
	import { getContext, tick } from 'svelte';
	import { publicAudio } from '#lib/audio/availability.ts';
	import { playbackKey, type Playback, type Track } from '#lib/audio/playback.ts';
	import { orderStories, type StoryOrder } from '#lib/audio/story-order.ts';
	import { relationLabel, textField } from '#lib/templates/fields.ts';
	import AutoAdvanceSwitch from './AutoAdvanceSwitch.svelte';
	import EpisodeAudio from './EpisodeAudio.svelte';
	import Picture from './Picture.svelte';
	import StoryOrderSelect from './StoryOrderSelect.svelte';
	import type { ListingData } from '#lib/list-templates/types.ts';

	let { title, description = '', image = '', items, pagination }: {
		title: string; description?: string; image?: string; items: (Record<string, unknown> & { collection: string; slug: string })[];
		pagination?: ListingData['pagination'];
	} = $props();
	const playback = getContext<Playback>(playbackKey);
	let order = $state<StoryOrder>('newest');
	const ordered = $derived(orderStories(items, order));
	const hasEpisodes = $derived(items.some((item) => item.collection === 'audio'));
	const tracks: Track[] = $derived(ordered.flatMap((item) => {
		if (item.collection !== 'audio') return [];
		const audio = publicAudio(item, page.data.freeEpisodeSlugs, page.data.audioBaseUrl, page.data.audioPublicationTime);
		const title = textField(item, 'title') || item.slug;
		return audio.src ? [{
			src: audio.src,
			title: audio.playbackType === 'sample' ? `${title} — Audio Sample` : title,
			href: `/${item.collection}/${encodeURIComponent(item.slug)}/`,
			artwork: textField(item, 'featuredImage'), duration: audio.duration
		}] : [];
	}));
	async function changeOrder() {
		await tick();
		playback.reorderQueue(tracks, page.url.pathname);
	}
</script>

<main>
	<h1>{title}</h1>
	{#if description}<p>{description}</p>{/if}
	{#if image}
		<div class="archive-image">
			<Picture src={image} alt={title} sizes="(min-width: 900px) 852px, 100vw" priority="high" />
		</div>
	{/if}
	{#if items.length}
		<div class="playlist-settings">
			<StoryOrderSelect bind:value={order} label={pagination ? 'Sort this page' : 'Order'} onchange={changeOrder} />
			{#if hasEpisodes}<AutoAdvanceSwitch />{/if}
		</div>
	{/if}
	{#if !items.length}<p>No published content yet.</p>{/if}
	{#each ordered as item (`${item.collection}/${item.slug}`)}
		{@const href = `/${item.collection}/${encodeURIComponent(item.slug)}/`}
		{@const itemTitle = textField(item, 'title') || item.slug}
		<article class:with-artwork={!!textField(item, 'featuredImage')}>
			{#if textField(item, 'featuredImage')}
				<a class="artwork" {href} tabindex="-1" aria-hidden="true">
					<Picture src={textField(item, 'featuredImage')} alt="" sizes="(min-width: 760px) 200px, 100vw" />
				</a>
			{/if}
			<div class="story-copy">
				<h2><a {href}>{itemTitle}</a></h2>
				{#if item.collection === 'audio'}
					{@const audio = publicAudio(item, page.data.freeEpisodeSlugs, page.data.audioBaseUrl, page.data.audioPublicationTime)}
					<p class="meta">
						{#if audio.duration}<span>{audio.duration}</span>{/if}
						{#if relationLabel(item.narrator, 'name')}<span>Narrated by {relationLabel(item.narrator, 'name')}</span>{/if}
					</p>
					{#if textField(item, 'excerpt') || textField(item, 'description')}<p>{textField(item, 'excerpt') || textField(item, 'description')}</p>{/if}
					<EpisodeAudio {audio} slug={item.slug} title={itemTitle} {href} artwork={textField(item, 'featuredImage')} queue={tracks} contextId={page.url.pathname} />
				{:else}
					{#if textField(item, 'excerpt') || textField(item, 'description')}<p>{textField(item, 'excerpt') || textField(item, 'description')}</p>{/if}
				{/if}
			</div>
		</article>
	{/each}
	{#if pagination && pagination.totalPages > 1}
		<nav class="pagination" aria-label="Archive pages">
			{#if pagination.page > 1}
				<a href={pagination.pages[pagination.page - 2].href} rel="prev">Previous</a>
			{/if}
			{#each pagination.pages as entry}
				<a href={entry.href} aria-label={`Page ${entry.number}`} aria-current={entry.number === pagination.page ? 'page' : undefined}>{entry.number}</a>
			{/each}
			{#if pagination.page < pagination.totalPages}
				<a href={pagination.pages[pagination.page].href} rel="next">Next</a>
			{/if}
		</nav>
	{/if}
</main>

<style>
	main { max-width: 900px; margin: 4rem auto; padding: 0 1.5rem; }
	.pagination { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
	.pagination a { display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; padding: 0.35em 0.65em; border: 1px solid currentColor; border-radius: var(--radius); }
	.pagination [aria-current="page"] { font-weight: 700; background: var(--text); color: var(--prime); text-decoration: none; }
	.archive-image { margin-block: 1.5rem; }
	.archive-image :global(img) { width: 100%; }
	.playlist-settings { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem 1.5rem; margin-block: 1.5rem; }
	article { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1.25rem; padding-bottom: 1.5rem; margin-bottom: 2rem; border-bottom: 1px solid color-mix(in srgb, var(--text) 30%, var(--prime)); }
	article.with-artwork { grid-template-columns: minmax(0, 200px) minmax(0, 1fr); }
	.artwork :global(picture) { display: block; max-width: 100%; }
	.artwork :global(img) { width: 100%; height: auto; }
	.story-copy { min-width: 0; overflow-wrap: anywhere; }
	h2 { margin: 0; }
	.meta { display: flex; flex-wrap: wrap; gap: 1rem; color: var(--text); }
	a { color: inherit; }
	@media (max-width: 48rem) {
		.story-copy { font-size: max(1rem, 0.9em); line-height: 1.5; }
		h2 { font-size: calc(var(--font-size) * var(--font-scale) * var(--font-scale) * 0.9); }
		.meta { font-size: 0.85em; gap: 0.5rem; }
		article { padding-bottom: 1.25rem; margin-bottom: 1.5rem; }
	}
	@media (max-width: 560px) { article.with-artwork { grid-template-columns: minmax(0, 1fr); } }
</style>
