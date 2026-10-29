<script lang="ts">
	import SeoMeta from '#lib/components/SeoMeta.svelte';
	import Episodes from '#lib/list-templates/Episodes.svelte';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<SeoMeta title={`Audio — Page ${data.pagination.page}`} />
<Episodes {data} />
