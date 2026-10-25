<script lang="ts">
  import type { ArchiveItem } from '#lib/server/taxonomy.ts';
  let { title, description = '', items }: { title: string; description?: string; items: ArchiveItem[] } = $props();
</script>

<main class="container-narrow">
  <h1>{title}</h1>
  {#if description}<p>{description}</p>{/if}
  {#if items.length === 0}<p>No published content yet.</p>{/if}
  {#each items as item (item.collection + ':' + item.slug)}
    <article>
      <h2><a href={`/${item.collection}/${encodeURIComponent(item.slug)}/`}>{item.title}</a></h2>
      {#if item.excerpt}<p>{item.excerpt}</p>{/if}
    </article>
  {/each}
</main>
<style>
  main { padding-block: calc(var(--space) * 2); }
  article { margin-block: var(--space); padding-block: var(--space); border-bottom: 1px solid var(--gray); }
</style>
