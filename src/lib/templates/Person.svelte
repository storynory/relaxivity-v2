<script lang="ts">
	import type { DetailTemplateData } from './types';
	import { textField } from './fields.ts';
	import Picture from '#lib/components/Picture.svelte';

	let { data }: { data: DetailTemplateData } = $props();
	const roles = $derived(Array.isArray(data.item.roles) ? data.item.roles.filter((role): role is string => typeof role === 'string') : []);
	const bio = $derived(textField(data.item, 'bio'));
	const photo = $derived(textField(data.item, 'photo'));
	const website = $derived(textField(data.item, 'website'));
</script>

<main>
	<article class="reading">
		<header>
			<h1>{data.title}</h1>
			{#if roles.length}<p>{roles.join(', ')}</p>{/if}
		</header>
		{#if photo}
			<div class="portrait"><Picture src={photo} alt={data.title} sizes="(min-width: 480px) 320px, 100vw" /></div>
		{/if}
		{#if bio}<div class="content"><p class="bio">{bio}</p></div>{/if}
		{#if website}<footer><a href={website}>Website</a></footer>{/if}
	</article>
</main>

<style>
	main { padding: clamp(1.5rem, 4vw, 3rem) min(var(--space), 5vw) clamp(3rem, 6vw, 5rem); }
	article { margin-inline: auto; }
	.portrait { max-width: 20rem; margin-block: 1.5rem; }
	.bio { white-space: pre-line; }
</style>
