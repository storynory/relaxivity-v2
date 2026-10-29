<script lang="ts">
	import type { NavigationContent } from '#lib/generated/types.ts';

	let { items = [], description = '', copyright = '' }: {
		items?: NavigationContent['items'];
		description?: string;
		copyright?: string;
	} = $props();
</script>

<footer class="site-footer">
	<div class="container footer-inner">
		{#if description || copyright}
			<div class="footer-copy">
				{#if description}<p>{description}</p>{/if}
				{#if copyright}<p>{copyright}</p>{/if}
			</div>
		{/if}
		{#if items.length}
			<nav aria-label="Footer">
				<ul class="footer-links">
					{#each items as item}
						<li>
							{#if item.url}
								<a href={item.url} target={item.newTab ? '_blank' : undefined} rel={item.newTab ? 'noopener noreferrer' : undefined}>
									{item.label}{#if item.newTab}<span class="sr-only"> (opens in a new tab)</span>{/if}
								</a>
							{:else}<span>{item.label}</span>{/if}
							{#if item.children?.length}
								<ul>
									{#each item.children as child}
										<li>
											<a href={child.url} target={child.newTab ? '_blank' : undefined} rel={child.newTab ? 'noopener noreferrer' : undefined}>
												{child.label}{#if child.newTab}<span class="sr-only"> (opens in a new tab)</span>{/if}
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
</footer>

<style>
	footer {
		flex-shrink: 0;
		background: var(--prime);
		color: var(--text);
		border-top: 1px solid color-mix(in srgb, var(--text) 25%, var(--prime));
		padding-block: 1.5rem max(1.5rem, env(safe-area-inset-bottom));
	}
	.footer-inner { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: start; gap: 1rem 2rem; }
	.footer-copy { flex: 1 1 18rem; min-width: 0; max-width: 60ch; overflow-wrap: anywhere; }
	p { margin: 0; }
	p + p { margin-top: 0.5rem; }
	nav { min-width: 0; max-width: 100%; }
	ul { margin: 0; padding: 0; list-style: none; }
	.footer-links { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; }
	li { min-width: 0; }
	a { display: inline-flex; align-items: center; min-height: 44px; max-width: 100%; overflow-wrap: anywhere; }
	.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
</style>
