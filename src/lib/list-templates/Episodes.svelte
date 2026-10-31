<script lang="ts">
	import type { ListingData } from './types.ts';
	import { compareEpisodes } from '#lib/audio/availability.ts';
	import StoryListing from '#lib/components/StoryListing.svelte';

	let { data }: { data: ListingData } = $props();
	const items = $derived([...data.items].sort(compareEpisodes).map((item) => ({
		...item, collection: data.collection, slug: String(item.slug)
	})));
</script>

<StoryListing title={data.title ?? 'Stories'} {items} pagination={data.pagination} />
