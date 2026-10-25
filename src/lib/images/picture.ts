export type ImageEntry = {
	width: number;
	height: number;
	sizes: number[];
	formats: string[];
	fallback?: string;
};
export type ImageManifest = Record<string, ImageEntry>;
export type PictureSource = { type: string; srcset: string };

export function pictureSources(src: string, manifest: ImageManifest): {
	sources: PictureSource[];
	fallback: string;
	width?: number;
	height?: number;
} {
	const entry = manifest[src];
	if (!entry) return { sources: [], fallback: src };
	// Keep the URL's existing directory, escaped filename and original extension conventions.
	const base = src.replace(/^\/uploads\//, '/optimized/').replace(/\.[^/.]+$/, '');
	const widths = [...new Set(entry.sizes)].filter((w) => Number.isSafeInteger(w) && w > 0).sort((a, b) => a - b);
	const sources: PictureSource[] = [];
	for (const format of ['avif', 'webp']) {
		if (!entry.formats.includes(format) || !widths.length) continue;
		sources.push({
			type: `image/${format}`,
			srcset: widths.map((w) => `${base}.${w}.${format} ${w}w`).join(', ')
		});
	}
	return { sources, fallback: entry.fallback || src, width: entry.width, height: entry.height };
}
