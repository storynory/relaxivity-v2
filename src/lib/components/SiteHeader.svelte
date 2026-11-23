<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import SiteNavigation from '#lib/components/SiteNavigation.svelte';
	import Picture from '#lib/components/Picture.svelte';
	import type { NavigationContent } from '#lib/generated/types.ts';

	let {
		siteName,
		siteLogo = '',
		items = []
	}: {
		siteName: string;
		siteLogo?: string;
		items?: NavigationContent['items'];
	} = $props();

	let header: HTMLElement;
	let scrolled = $state(false);
	onMount(() => {
		const observer = new IntersectionObserver(([entry]) => {
			scrolled = !entry.isIntersecting && entry.boundingClientRect.bottom <= 0;
		});
		observer.observe(header);
		return () => observer.disconnect();
	});

	const utilityLinks = [
		{ href: '/', label: 'Home', icon: 'home' },
		{ href: '/pages/about/', label: 'About', icon: 'info' },
		{ href: '/audio/', label: 'Stories', icon: 'headphones' },
		{ href: '/playlist/', label: 'Playlist', icon: 'heart' },
		{ href: '/search/', label: 'Search', icon: 'search' }
	];
	const navigationIcons: Record<string, string> = {
		'/pages/contact/': 'mail',
		...Object.fromEntries(utilityLinks.map((link) => [link.href, link.icon]))
	};

	function current(href?: string) {
		if (!href?.startsWith('/') || href.startsWith('//')) return undefined;
		const target = href.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
		const pathname = page.url.pathname.replace(/\/+$/, '') || '/';
		if (pathname === target) return 'page';
		if (target !== '/' && pathname.startsWith(target + '/')) return 'location';
		return undefined;
	}
</script>

<header bind:this={header}>
	<div class="utility-bar" class:scrolled>
		<nav class="container utility-links" aria-label="Utility">
			{#each utilityLinks as link}
				<a href={link.href} title={link.label} aria-current={current(link.href)}>
					<svg aria-hidden="true" class="icon nav-icon"
						><use href={`/icons.svg#${link.icon}`} /></svg
					>
					<span class="utility-label">{link.label}</span>
				</a>
			{/each}
		</nav>
	</div>
	<div class="container header-inner">
		<a class="brand" href="/">
			{#if siteLogo}
				<span class="logo-box">
					<Picture
						src={siteLogo}
						alt=""
						sizes="(max-width: 22rem) 3rem, (max-width: 30rem) 3.5rem, 5rem"
						width={80}
						height={80}
						loading="eager"
						class="brand-logo"
					/>
				</span>
			{/if}
			<span class="brand-name">{siteName}</span>
		</a>

		<!-- Set collapsible to true to restore the mobile hamburger menu. -->
		<SiteNavigation {items} {current} icons={navigationIcons} collapsible={false} />
	</div>
</header>

<style>
	header {
		padding-top: env(safe-area-inset-top);
		border-bottom: 1px solid var(--prime);
	}

	:global(html) {
		scroll-padding-top: calc(45px + env(safe-area-inset-top) + 0.5rem);
	}

	.utility-bar {
		display: none;
		position: fixed;
		inset: 0 0 auto;
		z-index: 30;
		padding-top: env(safe-area-inset-top);
		background: color-mix(in srgb, var(--text) 5%, var(--prime));
		border-bottom: 1px solid color-mix(in srgb, var(--text) 12%, var(--prime));
	}

	.scrolled {
		display: block;
	}

	.utility-links {
		display: flex;
		justify-content: flex-end;
		gap: 0 0.35rem;
		font-size: 1rem;
		line-height: 1.25;
	}

	.utility-links a {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		min-width: 44px;
		min-height: 44px;
		padding: 0.5rem;
		color: var(--text);
		text-decoration: none;
	}

	.utility-links a:hover {
		color: var(--accent);
	}

	.utility-links a[aria-current] {
		color: var(--accent);
		font-weight: 700;
		text-decoration: underline;
		text-decoration-thickness: 0.15em;
		text-underline-offset: 0.25em;
	}

	.header-inner {
		--logo-size: 5rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: clamp(0.75rem, 2vw, var(--space));
		padding-block: 1rem;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: calc(var(--space) / 2);
		min-width: 0;
		color: var(--text);
		font-family: var(--font-heading);
		font-size: clamp(1rem, 3vw, 2.125rem);
		font-style: italic;
		font-weight: 600;
		line-height: 1.15;
		text-decoration: none;
		overflow-wrap: anywhere;
	}

	/* Reserve space for the logo before it loads */
	.brand:hover,
	.brand:focus-visible {
		color: var(--accent);
	}

	.logo-box {
		display: block;
		flex: 0 0 var(--logo-size);
		width: var(--logo-size);
		height: var(--logo-size);
	}

	.brand-name {
		max-width: 100%;
	}

	.logo-box :global(picture) {
		display: block;
		width: 100%;
		height: 100%;
	}

	.logo-box :global(img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.icon {
		display: inline-block;
		width: 1.35rem;
		height: 1.35rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
		flex-shrink: 0;
	}

	.nav-icon {
		width: 1.1rem;
		height: 1.1rem;
	}

	a:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 4px;
	}

	/* Mobile navigation */

	@media (max-width: 72rem) {
		header {
			/* Reserve the mobile shortcuts, including any device safe area. */
			padding-top: calc(45px + env(safe-area-inset-top));
		}

		.utility-bar {
			display: block;
		}

		.header-inner {
			/* Leave room for the optional collapsible navigation. */
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto;
			padding-block: 0.75rem;
		}

		.brand {
			grid-column: 1;
			grid-row: 1;
			flex-wrap: wrap;
			gap: 0.25rem 0.5rem;
		}
	}

	@media (max-width: 30rem) {
		.header-inner {
			--logo-size: 3.5rem;
		}
	}

	@media (max-width: 22rem) {
		.header-inner {
			--logo-size: 3rem;
		}
	}

	@media (max-width: 48rem) {
		/* Mark the current section when the text labels are hidden. */
		.utility-links a[aria-current] {
			box-shadow: inset 0 -3px 0 currentColor;
		}

		.utility-label {
			position: absolute;
			width: 1px;
			height: 1px;
			padding: 0;
			margin: -1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
			border: 0;
		}
	}
</style>
