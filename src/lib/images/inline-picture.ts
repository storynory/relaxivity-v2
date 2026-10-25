import { pictureSources, type ImageManifest } from './picture.ts';

function escapeAttribute(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Render Markdown images using the same manifest as Picture.svelte. */
export function inlinePicture(
	src: string,
	alt: string,
	title: string | null | undefined,
	manifest: ImageManifest
): string {
	// Editors can mark an important inline image with the Markdown title "priority=high".
	// Other titles retain their normal visible tooltip.
	const highPriority = title?.trim() === 'priority=high';
	const visibleTitle = highPriority ? null : title;
	const image = pictureSources(src, manifest);
	const attrs = [
		`src="${escapeAttribute(image.fallback)}"`,
		`alt="${escapeAttribute(alt)}"`,
		'title="' + escapeAttribute(visibleTitle ?? '') + '"'
	];
	if (!visibleTitle) attrs.pop();
	if (image.width) attrs.push(`width="${image.width}"`);
	if (image.height) attrs.push(`height="${image.height}"`);
	attrs.push(highPriority ? 'loading="eager"' : 'loading="lazy"');
	if (highPriority) attrs.push('fetchpriority="high"');
	attrs.push('decoding="async"');
	const img = `<img ${attrs.join(' ')}>`;
	if (!image.sources.length) return img;
	// Post/Default templates: 760px content width, plus 24px padding on each side.
	// Keep this configurable when we add templates with different content widths.
	const sizes = '(min-width: 808px) 760px, calc(100vw - 48px)';
	const sources = image.sources.map((source) =>
		`<source type="${source.type}" srcset="${escapeAttribute(source.srcset)}" sizes="${sizes}">`
	).join('');
	return `<picture>${sources}${img}</picture>`;
}
