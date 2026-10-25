import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { processImages } from './process';

test('skips unchanged images and rebuilds missing derivatives or changed settings', async () => {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'starter-images-'));
	try {
		const sourceDir = path.join(root, 'uploads');
		const outputDir = path.join(root, 'optimised');
		await fs.mkdir(sourceDir);
		const photo = path.join(sourceDir, 'sample.png');
		await sharp({ create: { width: 400, height: 200, channels: 3, background: '#447799' } }).png().toFile(photo);
		const config = {
			sourceDir, outputDir, publicBase: '/uploads', generatedBase: '/optimised',
			inputExts: ['.png'], widths: [200, 400],
			formats: { webp: { enabled: true, quality: 80 }, avif: { enabled: false, quality: 50 } },
			fallback: { enabled: true, format: 'jpg' as const, width: 200, quality: 80 },
			cacheFile: path.join(root, 'cache.json'),
			manifestFile: path.join(root, 'manifest.json')
		};
		await processImages(config);
		const derivative = path.join(outputDir, 'sample.200.webp');
		const first = (await fs.stat(derivative)).mtimeMs;
		await processImages(config);
		assert.equal((await fs.stat(derivative)).mtimeMs, first, 'unchanged variant should not be rewritten');
		assert.deepEqual(JSON.parse(await fs.readFile(config.manifestFile, 'utf8'))['/uploads/sample.png'].sizes, [200, 400]);
		await fs.rm(derivative);
		await processImages(config);
		assert.ok((await fs.stat(derivative)).isFile(), 'missing derivative must be rebuilt');
		const updated = { ...config, formats: { ...config.formats, webp: { enabled: true, quality: 70 } } };
		await processImages(updated);
		const cached = JSON.parse(await fs.readFile(config.cacheFile, 'utf8'));
		assert.ok(cached['sample.png'].hash);
	} finally {
		await fs.rm(root, { recursive: true, force: true });
	}
});

test('original provider skips transforms and clears stale manifest', async () => {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'starter-original-'));
	try {
		const manifestFile = path.join(root, 'manifest.json');
		await fs.writeFile(manifestFile, '{"old":{}}');
		const result = await processImages({
			provider: 'original',
			sourceDir: path.join(root, 'missing'), outputDir: path.join(root, 'optimized'),
			publicBase: '/uploads', generatedBase: '/optimized',
			inputExts: ['.jpg'], widths: [320],
			formats: { webp: { enabled: true, quality: 80 }, avif: { enabled: false, quality: 50 } },
			fallback: { enabled: true, format: 'jpg', width: 640, quality: 82 },
			manifestFile
		});
		assert.deepEqual(result, {});
		assert.deepEqual(JSON.parse(await fs.readFile(manifestFile, 'utf8')), {});
	} finally { await fs.rm(root, { recursive: true, force: true }); }
});
