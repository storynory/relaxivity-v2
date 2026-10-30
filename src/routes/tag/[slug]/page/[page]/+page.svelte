<script lang="ts">
	import SeoMeta from '#lib/components/SeoMeta.svelte';
	import TaxonomyListing from '#lib/components/TaxonomyListing.svelte';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<SeoMeta title={data.title} item={data.term} />
<TaxonomyListing title={data.title} description={data.description} image={data.term.image} items={data.items} pagination={data.pagination} />
