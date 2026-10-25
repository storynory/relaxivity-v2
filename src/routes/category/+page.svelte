<script lang="ts">
  import SeoMeta from '#lib/components/SeoMeta.svelte';
  let { data } = $props();
  const roots = $derived(data.terms.filter((t) => !t.parent || !data.terms.some((p) => p.slug === t.parent)));
</script>
<SeoMeta title="Categories" />
<main class="container-narrow">
  <h1>Categories</h1>
  {#each roots as root (root.slug)}
    <section>
      <h2><a href={`/category/${encodeURIComponent(root.slug)}/`}>{root.title}</a></h2>
      {#if root.description}<p>{root.description}</p>{/if}
      {#if data.terms.some((t) => t.parent === root.slug)}
        <ul>
          {#each data.terms.filter((t) => t.parent === root.slug) as child (child.slug)}
            <li><a href={`/category/${encodeURIComponent(child.slug)}/`}>{child.title}</a></li>
          {/each}
        </ul>
      {/if}
    </section>
  {/each}
</main>
<style>main { padding-block: calc(var(--space) * 2); } section { margin-block: 2rem; }</style>
