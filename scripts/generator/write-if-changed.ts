import fs from 'node:fs/promises';

export async function writeIfChanged(filename: string, contents: string): Promise<void> {
	const existing = await fs.readFile(filename, 'utf8').catch((error: NodeJS.ErrnoException) => {
		if (error.code === 'ENOENT') return null;
		throw error;
	});
	if (existing !== contents) await fs.writeFile(filename, contents);
}
