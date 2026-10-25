<script lang="ts">
  import { page } from '$app/state';

  let {
    title,
    item = {}
  }: {
    title: string;
    item?: Record<string, unknown>;
  } = $props();

  const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
  const seo = $derived(item.seo && typeof item.seo === 'object'
    ? item.seo as Record<string, unknown>
    : {});
  const site = $derived(page.data as Record<string, unknown>);
  const heading = $derived(text(title));
  const metaTitle = $derived(text(seo.title) || heading);
  const description = $derived(text(seo.description) || text(item.excerpt) || text(site.siteDescription));
  const imagePath = $derived(text(seo.image) || text(item.featuredImage) || text(site.defaultImage));
  const base = $derived(text(site.siteUrl).replace(/\/$/, ''));
  const canonical = $derived(base ? base + (page.url.pathname.endsWith('/') ? page.url.pathname : page.url.pathname + '/') : '');
  const image = $derived(imagePath && base
    ? new URL(imagePath, base + '/').href
    : /^https?:\/\//.test(imagePath) ? imagePath : '');
</script>

<svelte:head>
  <title>{metaTitle}</title>
  {#if description}<meta name="description" content={description} />{/if}
  {#if canonical}<link rel="canonical" href={canonical} />{/if}
  <meta property="og:type" content="website" />
  <meta property="og:title" content={metaTitle} />
  {#if description}<meta property="og:description" content={description} />{/if}
  {#if canonical}<meta property="og:url" content={canonical} />{/if}
  {#if image}<meta property="og:image" content={image} />{/if}
  <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
  <meta name="twitter:title" content={metaTitle} />
  {#if description}<meta name="twitter:description" content={description} />{/if}
  {#if image}<meta name="twitter:image" content={image} />{/if}
</svelte:head>
