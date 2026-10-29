<script lang="ts">
  import type { ArchiveItem } from '#lib/server/taxonomy.ts';
  import StoryListing from './StoryListing.svelte';
  let { title, description = '', image, items }: { title: string; description?: string; image?: unknown; items: ArchiveItem[] } = $props();
</script>

<StoryListing {title} {description} image={typeof image === 'string' ? image.trim() : ''} {items} />
