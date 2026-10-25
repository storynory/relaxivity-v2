const START = '<!-- CMS_COLLECTIONS_START -->';
const END = '<!-- CMS_COLLECTIONS_END -->';

export function generateAdminIndex(html: string, filenames: string[]): string {
	const start = html.indexOf(START);
	const end = html.indexOf(END);
	if (start < 0 || end < 0 || end < start || html.indexOf(START, start + 1) >= 0 || html.indexOf(END, end + 1) >= 0) {
		throw new Error('Expected exactly one ordered pair of CMS collection markers in static/admin/index.html');
	}
	const names = filenames.filter((filename) => /\.ya?ml$/.test(filename)).sort();
	const links = names.map((filename) => {
		if (!/^[A-Za-z0-9_-]+\.ya?ml$/.test(filename)) throw new Error(`Invalid CMS collection filename: ${filename}`);
		return `\t\t<link href="/admin/collections/${filename}" type="application/yaml" rel="cms-config-url" />`;
	}).join('\n');
	return html.slice(0, start + START.length) + '\n' + links + '\n\t\t' + html.slice(end);
}
