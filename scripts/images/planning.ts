import path from 'node:path';

export function plannedWidths(intrinsicWidth: number, requestedWidths: number[]): number[] {
	if (!Number.isSafeInteger(intrinsicWidth) || intrinsicWidth <= 0) {
		throw new Error('Image width must be a positive integer');
	}
	const valid = requestedWidths.filter((width) => Number.isSafeInteger(width) && width > 0);
	if (valid.length !== requestedWidths.length) throw new Error('Image widths must be positive integers');
	return [...new Set(valid.filter((width) => width <= intrinsicWidth))].sort((a, b) => a - b).length
		? [...new Set(valid.filter((width) => width <= intrinsicWidth))].sort((a, b) => a - b)
		: [intrinsicWidth];
}

export function isOriginalImage(filename: string, extensions: string[]): boolean {
	const ext = path.posix.extname(filename).toLowerCase();
	return extensions.includes(ext) && !/\.\d+\.(?:avif|webp|jpe?g|png)$/i.test(filename);
}

export function variantRelativePath(relativePath: string, width: number, format: string): string {
	const unixPath = relativePath.replaceAll('\\', '/');
	if (unixPath.startsWith('/') || unixPath.split('/').some((part) => part === '..' || part === '.') || !unixPath) {
		throw new Error('Expected a relative image path without traversal');
	}
	if (!Number.isSafeInteger(width) || width <= 0) throw new Error('Invalid image width');
	if (!['webp', 'avif', 'jpg', 'png'].includes(format)) throw new Error('Unsupported output format');
	return unixPath.replace(/\.[^/.]+$/, '') + `.${width}.${format}`;
}
