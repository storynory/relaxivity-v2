<script lang="ts">
	import type { DetailTemplateData } from './types.ts';
	import { relationLabel, textField } from './fields.ts';
	import Picture from '#lib/components/Picture.svelte';
	import EpisodeAudio from '#lib/components/EpisodeAudio.svelte';
	import { page } from '$app/state';
	import { publicAudio } from '#lib/audio/availability.ts';

	let { data }: { data: DetailTemplateData } = $props();
	const item = $derived(data.item);
	const audio = $derived(publicAudio(item, page.data.freeEpisodeSlugs, page.data.audioBaseUrl, page.data.audioPublicationTime));
	const duration = $derived(audio.duration);
	const date = $derived(textField(item, 'date'));
	const artwork = $derived(textField(item, 'featuredImage'));
	const artworkAlt = $derived(textField(item, 'featuredImageAlt'));
	const number = $derived(textField(item, 'episodeNumber'));
	const season = $derived(textField(item, 'seasonNumber'));
	const category = $derived({ title: relationLabel(item.category, 'title'), slug: relationLabel(item.category, 'slug') });
	const tags = $derived((Array.isArray(item.tags) ? item.tags : [])
		.map((tag) => ({ title: relationLabel(tag, 'title'), slug: relationLabel(tag, 'slug') }))
		.filter((tag) => tag.title && tag.slug));
	const credits = $derived(
		[
			{ role: 'Written by', person: item.author },
			{ role: 'Narrated by', person: item.narrator },
			{ role: 'Presented by', person: item.presenter },
			{ role: 'Produced by', person: item.producer }
		].map(({ role, person }) => ({
			role,
			name: relationLabel(person, 'name'),
			slug: relationLabel(person, 'slug')
		})).filter(({ name }) => name)
	);
	const description = $derived(textField(item, 'description'));
	const html = $derived(textField(item, 'html'));
	const introduction = $derived(
		description.trim().length <= 280
			? description.trim()
			: description.trim().split(/(?<=[.!?])\s+/)[0]
	);
</script>

<main>
	<article>
		<header class="episode-header">
			<div class="hero-layout" class:with-artwork={!!artwork}>
				<div class="hero-copy">
					<div class="eyebrow">
						{#if season}<span>Season {season}</span>{/if}
						{#if number}<span>Episode {number}</span>{/if}
						{#if duration}<span>{duration}</span>{/if}
					</div>
					<h1>{data.title}</h1>
					{#if introduction}<p class="introduction">{introduction}</p>{/if}
					{#if date}<time datetime={date}>{date.slice(0, 10)}</time>{/if}
					{#if (category.title && category.slug) || tags.length}
						<nav class="taxonomy" aria-label="Related stories">
							{#if category.title && category.slug}
								<div><span>Category</span><a href={`/category/${encodeURIComponent(category.slug)}/`}>{category.title}</a></div>
							{/if}
							{#if tags.length}
								<div><span>Tags</span>
									{#each tags as tag (tag.slug)}<a href={`/tag/${encodeURIComponent(tag.slug)}/`}>{tag.title}</a>{/each}
								</div>
							{/if}
						</nav>
					{/if}
				</div>
				{#if artwork}
					<div class="artwork">
						<Picture
							src={artwork}
							alt={artworkAlt || data.title}
							sizes="(min-width: 1100px) 550px, (min-width: 800px) 50vw, 100vw"
							priority="high"
						/>
					</div>
				{/if}
			</div>
			<div class="player">
				<EpisodeAudio {audio} slug={String(item.slug)} title={data.title} href={page.url.pathname} {artwork} />
			</div>
		</header>

		{#if html || description.trim() !== introduction || credits.length}
			<div class="episode-details" class:with-credits={credits.length > 0}>
				{#if credits.length}
					<aside class="credits" aria-label="Episode credits">
						<dl>
							{#each credits as credit}
								<div>
									<dt>{credit.role}</dt>
									<dd>
										{#if credit.slug}
											<a href={`/people/${encodeURIComponent(credit.slug)}/`}>{credit.name}</a>
										{:else}
											{credit.name}
										{/if}
									</dd>
								</div>
							{/each}
						</dl>
					</aside>
				{/if}
				{#if html || description.trim() !== introduction}
					<div class="reading">
						{#if description.trim() !== introduction}<p class="description">{description}</p>{/if}
						{#if html}<section class="content" aria-label="Transcript and show notes">{@html html}</section>{/if}
					</div>
				{/if}
			</div>
		{/if}
	</article>
</main>

<style>
	main {
		padding: clamp(1.5rem, 4vw, 3rem) min(var(--space), 5vw) 4rem;
	}
	article {
		max-width: var(--wide-width);
		margin-inline: auto;
	}
	.episode-header {
		background: var(--prime);
		color: var(--text);
		border-top: 1px solid color-mix(in srgb, var(--text) 30%, var(--prime));
		padding-top: clamp(1.5rem, 4vw, 3rem);
	}
	.hero-layout {
		display: grid;
		gap: clamp(2rem, 4vw, 3.5rem);
		align-items: center;
	}
	.hero-copy { min-width: 0; }
	.eyebrow {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5em 1.25em;
		font-size: 0.85em;
		letter-spacing: 0.06em;
	}
	h1 {
		max-width: 14ch;
		margin-block: 0.3em 0.5em;
		font-size: clamp(2.4rem, 5vw, 4.5rem);
		line-height: 1.15;
		font-weight: 500;
		letter-spacing: -0.025em;
		text-wrap: balance;
		overflow-wrap: anywhere;
	}
	.introduction {
		max-width: 42ch;
		font-size: 1.1em;
		line-height: var(--line-height);
		margin-block: 0 1.25em;
	}
	time { font-size: 0.85em; }
	.taxonomy, .taxonomy > div { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
	.taxonomy { margin-top: 1.25rem; gap: 0.75rem 1.25rem; }
	.taxonomy span { font-size: 0.8em; }
	.taxonomy a { font-size: 0.85em; padding: 0.25em 0.65em; border: 1px solid currentColor; border-radius: var(--radius); }
	.artwork {
		min-width: 0;
		padding: clamp(0.5rem, 1.5vw, 0.9rem);
		border: 1px solid color-mix(in srgb, var(--text) 30%, var(--prime));
		box-shadow: 0 1rem 2rem #0003;
	}
	.artwork :global(picture), .artwork :global(img) { display: block; width: 100%; }
	.artwork :global(img) { height: auto; }
	.player { margin-block: clamp(2rem, 4vw, 3rem); }
	.episode-details {
		display: grid;
		gap: clamp(1.75rem, 3vw, 2.5rem);
		align-items: start;
		margin-top: clamp(2rem, 4vw, 3rem);
	}
	.reading {
		min-width: 0;
		margin-inline: auto;
		/* Fine paper grain and a warm wash over the configured reading colour. */
		background-image:
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Cpath fill='%23000' opacity='.12' filter='url(%23grain)' d='M0 0h180v180H0z'/%3E%3C/svg%3E"),
			radial-gradient(ellipse at top left, #fff8e64d, transparent 65%),
			linear-gradient(115deg, #92704414, transparent 25%, transparent 75%, #9270441a);
		background-size: 180px 180px, 100% 100%, 100% 100%;
		background-repeat: repeat, no-repeat, no-repeat;
	}
	.description { white-space: pre-line; margin-block: 0 2em; }
	.credits {
		color: var(--text);
		border-top: 1px solid color-mix(in srgb, var(--text) 30%, var(--prime));
		padding-top: 1.25rem;
	}
	.credits dl {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
		gap: 1.5rem;
		margin: 0;
	}
	.credits dt {
		font-size: 0.8em;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		line-height: 1.5;
		margin-bottom: 0.5rem;
	}
	.credits dd { margin: 0; line-height: 1.5; overflow-wrap: anywhere; }
	.credits a { color: var(--accent); text-decoration-thickness: 1px; text-underline-offset: 0.25em; }
	.credits a:hover { text-decoration-thickness: 2px; }
	@media (max-width: 48rem) {
		h1 {
			max-width: none;
			font-size: clamp(1.75rem, 5vw, 2.4rem);
			overflow-wrap: normal;
			word-break: normal;
		}
	}
	@media (min-width: 1100px) {
		.episode-details.with-credits { grid-template-columns: 11rem minmax(0, 1fr); }
		.credits dl { grid-template-columns: 1fr; gap: 2rem; }
	}
	.content :global(picture) { display: block; max-width: 100%; }
	.content :global(img) { display: block; max-width: 100%; height: auto; }
	@media (min-width: 800px) {
		.hero-layout.with-artwork { grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); }
	}
</style>
