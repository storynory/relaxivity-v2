<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import SiteHeader from '#lib/components/SiteHeader.svelte';
	import '../styles/base.css';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{#each data.feeds as feed (feed.href)}
		<link rel="alternate" type="application/rss+xml" title={feed.title} href={feed.href} />
	{/each}
</svelte:head>

<div
	class="site"
	style:--font-body={data.typography.bodyFont}
	style:--font-heading={data.typography.headingFont}
	style:--font-size={`${data.typography.fontSize}px`}
	style:--font-scale={data.typography.fontScale}
	style:--line-height={data.typography.lineHeight}
	style:--prime={data.colours.prime}
	style:--accent={data.colours.accent}
	style:--second={data.colours.second}
	style:--gray={data.colours.gray}
	style:--text={data.colours.text}
>
	<SiteHeader siteName={data.siteName} siteLogo={data.siteLogo} items={data.navigation} />
	{@render children()}
</div>

<style>
	.site { color: var(--text); min-height: 100vh; font: var(--font-size) / var(--line-height) var(--font-body); }
</style>
