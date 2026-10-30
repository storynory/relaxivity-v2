import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import YAML from 'yaml';
import { writeIfChanged } from '../generator/write-if-changed';

type Icon = { src: string; sizes: string; type: string; purpose: 'any' | 'maskable' };

export async function generateManifest(root = process.cwd()) {
	const settings = YAML.parse(await fs.readFile(path.join(root, 'content/settings/general.yml'), 'utf8'));
	const scheme = YAML.parse(await fs.readFile(
		path.join(root, 'content/colour-schemes', `${settings.activeScheme || 'default'}.yml`), 'utf8'));
	const background = scheme.prime || '#ffffff';
	const icons: Icon[] = [];
	const logo = typeof settings.siteLogo === 'string' ? settings.siteLogo : '';

	if (logo) {
		// Use the same local public URL selected in the CMS, never a network download.
		if (!logo.startsWith('/') || logo.startsWith('//') || /[?#]/.test(logo)) {
			throw new Error('Manifest generation requires a local Site Logo URL, for example /uploads/logo.png');
		}
		const staticDir = path.join(root, 'static');
		const source = path.resolve(staticDir, `.${decodeURIComponent(logo)}`);
		if (!source.startsWith(staticDir + path.sep)) throw new Error('Site Logo must be inside static/');
		const original = sharp(source).rotate();
		const metadata = await original.metadata();
		if (Math.min(metadata.width ?? 0, metadata.height ?? 0) < 512) {
			console.warn('Site Logo: use a source of at least 512 × 512 pixels for sharp app icons.');
		}
		const output = path.join(staticDir, 'app-icons');
		await fs.mkdir(output, { recursive: true });

		async function icon(filename: string, size: number, maskable = false) {
			// A centred square at 56% fits entirely inside the circular maskable safe zone.
			const inner = maskable ? Math.floor(size * 0.56) : size;
			const image = await original.clone()
				.resize(inner, inner, { fit: 'contain', background })
				.flatten({ background }).png().toBuffer();
			const png = maskable
				? await sharp({ create: { width: size, height: size, channels: 3, background } })
					.composite([{ input: image, gravity: 'centre' }]).png().toBuffer()
				: image;
			// Composite can introduce an alpha channel even on an opaque canvas.
			await sharp(png).flatten({ background }).png().toFile(path.join(output, filename));
			return { src: `/app-icons/${filename}`, sizes: `${size}x${size}`, type: 'image/png',
				purpose: maskable ? 'maskable' as const : 'any' as const };
		}

		for (const size of [16, 32, 48]) await icon(`favicon-${size}.png`, size);
		await icon('apple-touch-icon.png', 180);
		for (const size of [192, 512]) {
			icons.push(await icon(`icon-${size}.png`, size));
			icons.push(await icon(`icon-maskable-${size}.png`, size, true));
		}
	}

	const manifest = {
		id: '/', name: settings.siteName || 'Website', short_name: settings.siteName || 'Website',
		description: settings.description || '', lang: settings.language || 'en',
		start_url: '/', scope: '/', display: 'standalone',
		background_color: background, theme_color: background, icons
	};
	await writeIfChanged(path.join(root, 'static/site.webmanifest'), JSON.stringify(manifest, null, 2) + '\n');
	return manifest;
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/scripts/images/manifest.ts')) {
	const manifest = await generateManifest();
	console.log(`Web app manifest: ${manifest.name}, ${manifest.icons.length} app icons`);
}
