<script lang="ts">
	import SiteSearch from '#lib/components/SiteSearch.svelte';
</script>

<svelte:head>
	<title>Search</title>
	<meta name="description" content="Search audio stories, pages and posts." />
</svelte:head>

<main>
	<SiteSearch />
</main>

<style>
	main {
		max-width: var(--content-width);
		margin: var(--section-space) auto;
		padding: 0 var(--space);
	}
</style>
