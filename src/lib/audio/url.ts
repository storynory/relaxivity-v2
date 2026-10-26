// Full URLs remain valid for episodes hosted elsewhere or saved before R2.
export function audioUrl(value: unknown, base: unknown): string {
	if (typeof value !== 'string' || !value.trim()) return '';
	const path = value.trim();
	if (/^https?:\/\//i.test(path)) return path;
	if (typeof base !== 'string' || !/^https?:\/\//i.test(base.trim())) return '';
	try {
		const url = new URL(path.replace(/^\/+/, ''), `${base.trim().replace(/\/+$/, '')}/`);
		return /^https?:$/.test(url.protocol) ? url.href : '';
	} catch {
		return '';
	}
}
