import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import YAML from 'yaml';
import { collections, type CollectionName } from '#lib/generated/collections.ts';
const ROOT = path.resolve(process.cwd());

export type ReadResult = {
	meta: {
		collection: string;
		slug?: string;
		name?: string;
		sourcePath: string;
	};
	data: Record<string, unknown>;
	body: string;
};

function fileSlug(filename: string): string {
	return filename.replace(/\.[^.]+$/, '');
}

// Parse Markdown, JSON or YAML using one shared function.
function parseContent(
	raw: string,
	format: string
): { data: Record<string, unknown>; body: string } {
	if (format === 'json') {
		const data = JSON.parse(raw);

		return {
			data,
			body: typeof data?.body === 'string' ? data.body : ''
		};
	}

	if (format === 'yaml' || format === 'yml') {
		const data = YAML.parse(raw) ?? {};

		return {
			data,
			body: typeof data?.body === 'string' ? data.body : ''
		};
	}

	// Markdown with YAML frontmatter
	const parsed = matter(raw);

	return {
		data: parsed.data as Record<string, unknown>,
		body: String(parsed.content ?? '')
	};
}

// Read every entry in a folder collection.
export async function readAll(name: CollectionName): Promise<ReadResult[]> {
	const def = collections[name];

	if (def.kind !== 'folder') {
		throw new Error(`readAll() only supports folder collections. "${name}" is files-based.`);
	}

	const dir = path.join(ROOT, def.folder);
	const entries = await fs.readdir(dir, { withFileTypes: true });

	const results: ReadResult[] = [];

	for (const entry of entries) {
		if (!entry.isFile()) continue;
		if (!entry.name.endsWith(`.${def.extension}`)) continue;

		const fullPath = path.join(dir, entry.name);
		const raw = await fs.readFile(fullPath, 'utf8');
		const parsed = parseContent(raw, def.format);

		results.push({
			meta: {
				collection: name,
				slug: fileSlug(entry.name),
				sourcePath: fullPath
			},
			...parsed
		});
	}

	return results;
}

// Read one entry from a folder collection.
export async function readOne(name: CollectionName, slug: string): Promise<ReadResult | null> {
	const def = collections[name];

	if (def.kind !== 'folder') {
		throw new Error(`readOne() only supports folder collections.`);
	}

	const fullPath = path.join(ROOT, def.folder, `${slug}.${def.extension}`);

	const raw = await fs.readFile(fullPath, 'utf8').catch((err: NodeJS.ErrnoException) => {
		if (err.code === 'ENOENT') return null;
		throw err;
	});

	if (raw === null) return null;

	const parsed = parseContent(raw, def.format);

	return {
		meta: {
			collection: name,
			slug,
			sourcePath: fullPath
		},
		...parsed
	};
}

// Read a document from a files-based collection.
export async function readDoc(
	collectionName: CollectionName,
	docName: string
): Promise<ReadResult> {
	const def = collections[collectionName];

	if (def.kind !== 'files') {
		throw new Error(`readDoc() only supports files collections.`);
	}

	const item = def.files.find((f) => f.name === docName);

	if (!item) {
		throw new Error(`Doc "${docName}" not found in files collection "${collectionName}".`);
	}

	const fullPath = path.join(ROOT, item.file);
	const raw = await fs.readFile(fullPath, 'utf8');
	const parsed = parseContent(raw, item.format);

	return {
		meta: {
			collection: collectionName,
			name: docName,
			sourcePath: fullPath
		},
		...parsed
	};
}
