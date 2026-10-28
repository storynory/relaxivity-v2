<script lang="ts">
  import type { ArchiveItem } from '#lib/server/taxonomy.ts';
  import StoryListing from './StoryListing.svelte';
  let { title, description = '', items }: { title: string; description?: string; items: ArchiveItem[] } = $props();
</script>

<StoryListing {title} {description} {items} />
