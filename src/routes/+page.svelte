<script lang="ts">
	import type { PageData } from './$types';
	import { templates } from '#lib/generated/templates.ts';
	import SeoMeta from '#lib/components/SeoMeta.svelte';
	let { data }: { data: PageData } = $props();
	const selected = $derived(data.template as keyof typeof templates);
	const Template = $derived(templates[selected] ?? templates.default);
</script>

<SeoMeta title={data.title} item={data.item} />
<Template {data} />
