<script lang="ts">
	import manifest from '#lib/generated/image-manifest.json';
	import { pictureSources, type ImageManifest } from '#lib/images/picture.ts';

	type Props = {
		src: string;
		alt: string;
		sizes?: string;
		width?: number;
		height?: number;
		loading?: 'lazy' | 'eager';
		priority?: 'high' | 'auto';
		fetchpriority?: 'high' | 'low' | 'auto';
		class?: string;
	};

	let {
		src,
		alt,
		sizes = '100vw',
		width,
		height,
		loading,
		priority = 'auto',
		fetchpriority,
		class: className
	}: Props = $props();

	const image = $derived(pictureSources(src, manifest as ImageManifest));
	const imageWidth = $derived(image.width ?? width);
	const imageHeight = $derived(image.height ?? height);
	const imageLoading = $derived(loading ?? (priority === 'high' ? 'eager' : 'lazy'));
	const imagePriority = $derived(fetchpriority ?? (priority === 'high' ? 'high' : undefined));
</script>

<picture>
	{#each image.sources as source (source.type)}
		<source type={source.type} srcset={source.srcset} {sizes} />
	{/each}
	<img
		src={image.fallback}
		{alt}
		loading={imageLoading}
		fetchpriority={imagePriority}
		class={className}
		width={imageWidth}
		height={imageHeight}
		style:aspect-ratio={imageWidth && imageHeight ? `${imageWidth} / ${imageHeight}` : undefined}
	/>
</picture>

<style>
	img { display: block; max-width: 100%; height: auto; }
</style>
