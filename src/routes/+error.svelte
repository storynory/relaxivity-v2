<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status}: {page.error?.message}</title>
</svelte:head>

<main class="container-narrow">
	<h1>{page.status}</h1>
	<p>{page.error?.message}</p>
</main>

<style>
	main { padding-block: calc(var(--space) * 2); }
</style>
