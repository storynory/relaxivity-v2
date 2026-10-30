<script lang="ts">
	import { page } from '$app/state';
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

	let menuOpen = $state(false);
	let openDropdown = $state<number | null>(null);
	let menuButton = $state<HTMLButtonElement>();
	const utilityLinks = [
		{ href: '/audio/', label: 'Audio', icon: 'headphones' },
		{ href: '/playlist/', label: 'Playlist', icon: 'heart' },
		{ href: '/search/', label: 'Search', icon: 'search' }
	];
	const navigationIcons: Record<string, string> = {
		'/': 'home',
		'/pages/about/': 'info',
		'/contact/': 'mail'
	};

	function current(href?: string) {
		if (!href?.startsWith('/') || href.startsWith('//')) return undefined;
		const target = href.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
		const pathname = page.url.pathname.replace(/\/+$/, '') || '/';
		if (pathname === target) return 'page';
		if (target !== '/' && pathname.startsWith(target + '/')) return 'location';
		return undefined;
	}

	function closeMenu() {
		menuOpen = false;
		openDropdown = null;
	}

	function toggleMenu() {
		menuOpen = !menuOpen;
		openDropdown = null;
	}

	function toggleDropdown(index: number) {
		openDropdown = openDropdown === index ? null : index;
	}

	function dismiss(event: KeyboardEvent) {
		if (event.key !== 'Escape') return;

		if (openDropdown !== null) {
			const button = document.getElementById(`dropdown-trigger-${openDropdown}`);
			openDropdown = null;
			button?.focus();
		} else if (menuOpen) {
			closeMenu();
			menuButton?.focus();
		}
	}
</script>

<svelte:window onkeydown={dismiss} />

<header>
	<div class="utility-bar">
		<nav class="container utility-links" aria-label="Utility">
			{#each utilityLinks as link}
				<a href={link.href} aria-current={current(link.href)} onclick={closeMenu}>
					<svg aria-hidden="true" class="icon nav-icon"><use href={`/icons.svg#${link.icon}`} /></svg>
					<span class="sr-only">{link.label}</span>
				</a>
			{/each}
		</nav>
	</div>
	<div class="container header-inner">
		<a class="brand" href="/" onclick={closeMenu}>
			{#if siteLogo}
				<span class="logo-box">
					<Picture
						src={siteLogo}
						alt=""
						sizes="(max-width: 30rem) 4rem, 5rem"
						width={80}
						height={80}
						loading="eager"
						class="brand-logo"
					/>
				</span>
			{/if}
			<span>{siteName}</span>
		</a>

		{#if items.length}
			<button
				class="menu-toggle"
				bind:this={menuButton}
				type="button"
				aria-controls="main-navigation"
				aria-expanded={menuOpen}
				aria-label={menuOpen ? 'Close menu' : 'Open menu'}
				onclick={toggleMenu}
			>
				<svg aria-hidden="true" class="icon">
					<use href={menuOpen ? '/icons.svg#close' : '/icons.svg#menu'} />
				</svg>
			</button>

			<nav id="main-navigation" aria-label="Main" class:open={menuOpen}>
				<ul class="primary">
					{#each items as item, index}
						{@const icon = utilityLinks.find((link) => link.href === item.url)?.icon ?? navigationIcons[item.url ?? '']}
						<li
							class:expanded={openDropdown === index}
							class:disclosure={!item.url && !!item.children?.length}
							onfocusout={(event) => {
								if (!event.currentTarget.contains(event.relatedTarget as Node)) {
									if (openDropdown === index) {
										openDropdown = null;
									}
								}
							}}
						>
							{#if item.url}
								<a
									href={item.url}
									aria-current={current(item.url)}
									target={item.newTab ? '_blank' : undefined}
									rel={item.newTab ? 'noopener noreferrer' : undefined}
									onclick={closeMenu}
								>
									{#if icon}
										<svg aria-hidden="true" class="icon nav-icon"><use href={`/icons.svg#${icon}`} /></svg>
									{/if}
									{item.label}

									{#if item.newTab}
										<span class="sr-only"> (opens in a new tab) </span>
									{/if}
								</a>
							{:else if item.children?.length}
								<button
									id={`dropdown-trigger-${index}`}
									type="button"
									class="nav-label dropdown-toggle"
									aria-controls={`submenu-${index}`}
									aria-expanded={openDropdown === index}
									onclick={() => toggleDropdown(index)}
								>
									{item.label}
								</button>
							{:else}
								<span class="nav-label">{item.label}</span>
							{/if}

							{#if item.children?.length}
								<ul class="submenu" id={`submenu-${index}`}>
									{#each item.children as child}
										<li>
											<a
												href={child.url}
												aria-current={current(child.url)}
												target={child.newTab ? '_blank' : undefined}
												rel={child.newTab ? 'noopener noreferrer' : undefined}
												onclick={closeMenu}
											>
												{child.label}

												{#if child.newTab}
													<span class="sr-only"> (opens in a new tab) </span>
												{/if}
											</a>
										</li>
									{/each}
								</ul>
							{/if}
						</li>
					{/each}
				</ul>
			</nav>
		{/if}
	</div>
</header>

<style>
	.submenu {
		--text: var(--surface-text);
		--accent: var(--surface-text);
		--link-hover: color-mix(in srgb, var(--surface-text) 90%, var(--second));
		color: var(--text);
	}
	header {
		border-bottom: 1px solid var(--prime);
	}

	.utility-bar {
		display: none;
		background: color-mix(in srgb, var(--text) 5%, var(--prime));
		border-bottom: 1px solid color-mix(in srgb, var(--text) 12%, var(--prime));
	}

	.utility-links {
		display: flex;
		justify-content: flex-end;
		flex-wrap: wrap;
		gap: 0 0.35rem;
		font-size: 1rem;
		line-height: 1.25;
	}

	.utility-links a {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 44px;
		min-height: 44px;
		padding: 0.5rem;
		color: var(--text);
		text-decoration: none;
	}

	.utility-links a:hover { text-decoration: underline; }

	.utility-links a[aria-current],
	.primary a[aria-current] {
		font-weight: 700;
		text-decoration: underline;
		text-decoration-thickness: 0.15em;
		text-underline-offset: 0.25em;
	}

	/* Mark the current section even without a visible text label. */
	.utility-links a[aria-current] { box-shadow: inset 0 -3px 0 currentColor; }

	.header-inner {
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
		font-size: clamp(1.5rem, 3vw, 2.125rem);
		font-style: italic;
		font-weight: 600;
		line-height: 1.15;
		text-decoration: none;
		overflow-wrap: anywhere;
	}

	/* Reserve space for the logo before it loads */
	.brand:hover, .brand:focus-visible { color: var(--accent); }

	.logo-box {
		display: block;
		flex: 0 0 5rem;
		width: 5rem;
		height: 5rem;
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

	nav {
		min-width: 0;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.primary {
		display: flex;
		align-items: center;
		flex-wrap: nowrap;
		gap: calc(var(--space) / 2) var(--space);
	}

	.primary > li {
		position: relative;
		flex-shrink: 0;
	}

	.primary a {
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
	}

	.nav-label {
		display: inline-block;
	}

	.dropdown-toggle {
		padding: 0;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}

	/* Desktop dropdowns */

	.submenu {
		display: none;
		position: absolute;
		z-index: 5;
		top: 100%;
		left: 0;
		min-width: 12rem;
		padding: 0.5rem;
		background: var(--second);
		border: 1px solid var(--gray);
		border-radius: var(--radius, 0.5rem);
		box-shadow: 0 6px 20px #0002;
	}

	.submenu a {
		display: block;
		padding: 0.35rem 0.5rem;
	}

	.primary > li:hover > .submenu,
	.primary > li:focus-within > .submenu,
	.primary > li.expanded > .submenu {
		display: block;
	}

	/* Hamburger is hidden on desktop */

	.menu-toggle {
		display: none;
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

	a:focus-visible,
	button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 4px;
	}

	/* Mobile navigation */

	@media (max-width: 72rem) {
		.utility-bar { display: block; }

		.header-inner {
			flex-wrap: wrap;
			padding-block: 0.75rem;
		}

		.menu-toggle {
			display: inline-flex;
			flex-shrink: 0;
			align-items: center;
			justify-content: center;
			min-width: 44px;
			min-height: 44px;
			padding: 0.5rem;
			border: 1px solid var(--gray);
			border-radius: var(--radius, 0.5rem);
			background: transparent;
			color: var(--text);
			cursor: pointer;
		}

		/* Hidden from first render: no hydration layout jump */

		#main-navigation {
			display: none;
			flex-basis: 100%;
		}

		#main-navigation.open {
			display: block;
		}

		.primary {
			display: block;
			border-top: 1px solid var(--gray);
			padding-top: 0.5rem;
		}

		.primary > li {
			margin: 0;
		}

		.primary > li > a,
		.nav-label {
			display: flex;
			padding: 0.65rem 0.25rem;
		}

		/* Mobile submenus are controlled by Svelte state */

		.submenu,
		.primary > li:hover > .submenu,
		.primary > li:focus-within > .submenu {
			display: none;
		}

		.primary > li.expanded > .submenu {
			display: block;
		}

		.submenu {
			position: static;
			--text: inherit;
			--accent: inherit;
			--link-hover: var(--text);
			min-width: 0;
			padding: 0 0 0 1rem;
			border: 0;
			border-radius: 0;
			background: transparent;
			box-shadow: none;
		}

		.submenu a {
			padding: 0.5rem 0.25rem;
		}
	}

	@media (max-width: 30rem) {
		.logo-box { flex-basis: 4rem; width: 4rem; height: 4rem; }
	}

	.sr-only {
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
</style>
