<script lang="ts">
  import SeoMeta from '#lib/components/SeoMeta.svelte';
  let { data } = $props();
</script>
<SeoMeta title="Tags" />
<main class="container-narrow">
  <h1>Tags</h1>
  <ul>
    {#each data.terms as term (term.slug)}
      <li><a href={`/tag/${encodeURIComponent(term.slug)}/`}>{term.title}</a></li>
    {/each}
  </ul>
</main>
<style>main { padding-block: calc(var(--space) * 2); }</style>
