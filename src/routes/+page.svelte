<script lang="ts">
	import type { PageData } from './$types';
	import Page from '#lib/templates/Page.svelte';
	import SeoMeta from '#lib/components/SeoMeta.svelte';
	let { data }: { data: PageData } = $props();
</script>

<SeoMeta title={data.title} item={data.item} />
<Page {data} />
