import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { generateManifest } from './manifest';

test('generates app icons, favicons and an Apple icon from the configured logo, including replacements', async () => {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'starter-manifest-'));
	try {
		for (const dir of ['content/settings', 'content/colour-schemes', 'static/uploads']) {
			await fs.mkdir(path.join(root, dir), { recursive: true });
		}
		const settings = path.join(root, 'content/settings/general.yml');
		await fs.writeFile(settings, 'siteName: Test Site\nlanguage: en-GB\nsiteLogo: /uploads/logo.png\n');
		await fs.writeFile(path.join(root, 'content/colour-schemes/default.yml'), 'prime: "#123456"\n');
		const source = path.join(root, 'static/uploads/logo.png');
		await sharp({ create: { width: 800, height: 600, channels: 4, background: '#ff000080' } }).png().toFile(source);
		const original = await fs.readFile(source);
		const manifest = await generateManifest(root);
		assert.equal(manifest.name, 'Test Site');
		assert.equal(manifest.lang, 'en-GB');
		assert.equal(manifest.theme_color, '#123456');
		assert.equal(manifest.start_url, '/');
		assert.equal(manifest.display, 'standalone');
		assert.deepEqual(manifest.icons.map(({ sizes, purpose }) => [sizes, purpose]), [
			['192x192', 'any'], ['192x192', 'maskable'], ['512x512', 'any'], ['512x512', 'maskable']
		]);
		for (const [filename, size] of [
			['favicon-16.png', 16], ['favicon-32.png', 32], ['favicon-48.png', 48],
			['apple-touch-icon.png', 180],
			...manifest.icons.map(({ src, sizes }) => [path.basename(src), Number(sizes.split('x')[0])] as const)
		] as const) {
			const metadata = await sharp(path.join(root, 'static/app-icons', filename)).metadata();
			assert.equal(metadata.width, size);
			assert.equal(metadata.height, size);
			assert.equal(metadata.format, 'png');
			assert.equal(metadata.hasAlpha, false);
		}
		const maskable = await sharp(path.join(root, 'static/app-icons/icon-maskable-512.png')).raw().toBuffer();
		assert.deepEqual([...maskable.subarray(0, 3)], [0x12, 0x34, 0x56]);
		assert.deepEqual(await fs.readFile(source), original, 'source is never modified');
		const oldIcon = await fs.readFile(path.join(root, 'static/app-icons/icon-192.png'));
		await sharp({ create: { width: 600, height: 600, channels: 3, background: '#00ff00' } }).png().toFile(source);
		await generateManifest(root);
		assert.notDeepEqual(await fs.readFile(path.join(root, 'static/app-icons/icon-192.png')), oldIcon);
		assert.deepEqual(JSON.parse(await fs.readFile(path.join(root, 'static/site.webmanifest'), 'utf8')), manifest);

		await fs.writeFile(settings, 'siteName: No Logo\n');
		assert.deepEqual((await generateManifest(root)).icons, []);
		await fs.writeFile(settings, 'siteLogo: https://example.com/logo.png\n');
		await assert.rejects(() => generateManifest(root), /local Site Logo/);
	} finally {
		await fs.rm(root, { recursive: true, force: true });
	}
});
