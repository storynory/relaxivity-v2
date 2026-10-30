<script lang="ts">
  import type { ArchiveItem } from '#lib/server/taxonomy.ts';
  import StoryListing from './StoryListing.svelte';
  import type { ListingData } from '#lib/list-templates/types.ts';
  let { title, description = '', image, items, pagination }: { title: string; description?: string; image?: unknown; items: ArchiveItem[]; pagination?: ListingData['pagination'] } = $props();
</script>

<StoryListing {title} {description} image={typeof image === 'string' ? image.trim() : ''} {items} {pagination} />
