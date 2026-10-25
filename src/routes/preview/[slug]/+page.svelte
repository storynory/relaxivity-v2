<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

<main>
<article>
	<header>
		<h1>{data.title}</h1>

		<div class="meta">
			{#if data.date}
				<span>{data.date}</span>
			{/if}

			{#if data.author}
				<span>By {data.author}</span>
			{/if}

			{#if data.category}
				<span>Category: {data.category}</span>
			{/if}

			{#if data.tags.length > 0}
				<div class="tags">
					{#each data.tags as tag}
						<span class="tag">{tag}</span>
					{/each}
				</div>
			{/if}
		</div>
	</header>

	<div class="content">
		{@html data.html}
	</div>
</article>
</main>

<style>
	article {
		max-width: 760px;
		margin: 4rem auto;
		padding: 0 1.5rem;
		line-height: 1.7;
	}

	h1 {
		font-size: 2.5rem;
		line-height: 1.2;
		margin-bottom: 0.75rem;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.5rem;
		color: #777;
		font-size: 0.9rem;
		margin-bottom: 2rem;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 2rem;
	}

	.tag {
		background: #eee;
		color: #333;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.85rem;
	}
</style>
