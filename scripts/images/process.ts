import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { isOriginalImage, plannedWidths, variantRelativePath } from './planning';

type Format = 'webp' | 'avif';
type Config = {
	provider?: 'sharp' | 'original';
	sourceDir: string; outputDir: string; publicBase: string; generatedBase: string;
	inputExts: string[]; widths: number[];
	formats: Record<Format, { enabled: boolean; quality: number }>;
	fallback: { enabled: boolean; format: 'jpg' | 'png'; width: number; quality: number };
	manifestFile: string; cacheFile?: string;
};
type Entry = { width: number; height: number; sizes: number[]; formats: Format[]; fallback?: string };
type CacheEntry = { hash: string; image: Entry; files: string[] };
const hash = (value: string | Buffer) => crypto.createHash('sha256').update(value).digest('hex');

export function cacheIsValid(cached: CacheEntry | undefined, digest: string): boolean {
	return !!cached && cached.hash === digest && Array.isArray(cached.files) && !!cached.image;
}
export async function processImages(config: Config): Promise<Record<string, Entry>> {
	const manifest: Record<string, Entry> = {};
	if (config.provider && !['sharp', 'original'].includes(config.provider)) throw new Error(`Unsupported image provider: ${config.provider}`);
	if (config.provider === 'original') {
		await fs.mkdir(path.dirname(config.manifestFile), { recursive: true });
		await fs.writeFile(config.manifestFile, '{}\n');
		console.log('Images: original mode (Sharp skipped)');
		return manifest;
	}
	const cachePath = config.cacheFile ?? '.image-cache.json';
	let cache: Record<string, CacheEntry> = {};
	try { cache = JSON.parse(await fs.readFile(cachePath, 'utf8')); } catch (err) {
		if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
	}
	const nextCache: Record<string, CacheEntry> = {};
	const settingsHash = hash(JSON.stringify({ widths: config.widths, formats: config.formats, fallback: config.fallback, generatedBase: config.generatedBase, sharp: sharp.versions }));
	let processed = 0;
	let skipped = 0;
	const source = path.resolve(config.sourceDir);
	const output = path.resolve(config.outputDir);
	if (source === output || output.startsWith(source + path.sep)) {
		throw new Error('Image output directory must be outside the image source directory');
	}
	async function walk(dir: string): Promise<void> {
		let entries;
		try { entries = await fs.readdir(dir, { withFileTypes: true }); }
		catch (err) {
			if ((err as NodeJS.ErrnoException).code === 'ENOENT') return;
			throw err;
		}
		for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
			const file = path.join(dir, entry.name);
			if (entry.isDirectory()) { await walk(file); continue; }
			if (!entry.isFile()) continue;
			const rel = path.relative(source, file).replaceAll(path.sep, '/');
			if (!isOriginalImage(rel, config.inputExts)) continue;
			const key = config.publicBase.replace(/\/$/, '') + '/' + rel.split('/').map(encodeURIComponent).join('/');
			const digest = hash(settingsHash + ':' + hash(await fs.readFile(file)));
			const cached = cache[rel];
			if (cacheIsValid(cached, digest) && (await Promise.all(cached.files.map(async (filename) => {
				try { return (await fs.stat(path.join(output, filename))).isFile(); } catch { return false; }
			}))).every(Boolean)) {
				manifest[key] = cached.image;
				nextCache[rel] = cached;
				skipped++;
				continue;
			}
			const generatedFiles: string[] = [];
			const original = sharp(file).rotate();
			const meta = await original.metadata();
			if (!meta.width || !meta.height) throw new Error(`Missing image dimensions: ${rel}`);
			const width = meta.autoOrient?.width ?? (meta.orientation && meta.orientation >= 5 ? meta.height : meta.width);
			const height = meta.autoOrient?.height ?? (meta.orientation && meta.orientation >= 5 ? meta.width : meta.height);
			const sizes = plannedWidths(width, config.widths);
			const image: Entry = { width, height, sizes, formats: [] };
			manifest[key] = image;
			for (const format of ['webp', 'avif'] as const) {
				const opts = config.formats[format];
				if (!opts?.enabled) continue;
				for (const size of sizes) {
					const destination = path.join(output, variantRelativePath(rel, size, format));
					await fs.mkdir(path.dirname(destination), { recursive: true });
					await original.clone().resize({ width: size, withoutEnlargement: true })[format]({ quality: opts.quality }).toFile(destination);
					generatedFiles.push(variantRelativePath(rel, size, format));
				}
				image.formats.push(format);
			}
			if (config.fallback.enabled) {
				const fbFormat = config.fallback.format === 'jpg' && meta.hasAlpha ? 'png' : config.fallback.format;
				const fbWidth = Math.min(width, config.fallback.width);
				const fallbackRel = variantRelativePath(rel, fbWidth, fbFormat);
				const dest = path.join(output, fallbackRel);
				await fs.mkdir(path.dirname(dest), { recursive: true });
				const pipeline = original.clone().resize({ width: fbWidth, withoutEnlargement: true });
				if (fbFormat === 'png') await pipeline.png().toFile(dest);
				else await pipeline.jpeg({ quality: config.fallback.quality, mozjpeg: true }).toFile(dest);
				generatedFiles.push(fallbackRel);
				image.fallback = config.generatedBase.replace(/\/$/, '') + '/' + fallbackRel.split('/').map(encodeURIComponent).join('/');
			}
			nextCache[rel] = { hash: digest, image, files: generatedFiles };
			processed++;
		}
	}
	await walk(source);
	await fs.mkdir(path.dirname(config.manifestFile), { recursive: true });
	await fs.writeFile(config.manifestFile, JSON.stringify(manifest, null, 2) + '\n');
	await fs.mkdir(path.dirname(cachePath), { recursive: true });
	await fs.writeFile(cachePath, JSON.stringify(nextCache, null, 2) + '\n');
	console.log(`Images: processed ${processed}, skipped ${skipped}`);
	return manifest;
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/scripts/images/process.ts')) {
	const config = JSON.parse(await fs.readFile('scripts/images/config.json', 'utf8')) as Config;
	const manifest = await processImages(config);
	console.log(`Processed ${Object.keys(manifest).length} images`);
}
