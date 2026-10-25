<script lang="ts">
  import SeoMeta from '#lib/components/SeoMeta.svelte';
  import TaxonomyListing from '#lib/components/TaxonomyListing.svelte';
  let { data } = $props();
</script>
<SeoMeta title={data.title} item={{ ...data.term, excerpt: data.description, featuredImage: data.term.image }} />
<TaxonomyListing title={data.title} description={data.description} items={data.items} />
