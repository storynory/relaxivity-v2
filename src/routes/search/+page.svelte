<script lang="ts">
	import SiteSearch from '#lib/components/SiteSearch.svelte';
</script>

<svelte:head>
	<title>Search</title>
	<meta name="description" content="Search published pages, posts and podcasts." />
</svelte:head>

<main>
	<h1>Search</h1>
	<SiteSearch />
</main>

<style>
	main { max-width: var(--content-width); margin: 3rem auto; padding: 0 var(--space); }
</style>
