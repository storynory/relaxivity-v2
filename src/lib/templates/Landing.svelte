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
		padding-block: clamp(1rem, 4vw, 3rem);
	}
	.landing :global(main > div > header h1) {
		font-size: clamp(2rem, 6vw, 4rem);
	}
	.landing :global(main > div > header .excerpt) {
		max-width: 45ch;
		margin-inline: auto;
	}
</style>
