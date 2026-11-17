<script module lang="ts">
	export const templateFor = 'pages';
</script>

<script lang="ts">
	import Page from './Page.svelte';
	import type { DetailTemplateData } from './types';
	let { data }: { data: DetailTemplateData } = $props();
</script>

<div class="landing">
	<Page {data} />
</div>

<style>
	.landing { display: flow-root; }
	.landing :global(main > div > header) {
		text-align: center;
	}
	.landing :global(main > div > header .excerpt) {
		max-width: 45ch;
		margin-inline: auto;
	}
</style>
