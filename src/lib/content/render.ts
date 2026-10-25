import { Marked } from 'marked';
import manifest from '#lib/generated/image-manifest.json';
import { inlinePicture } from '#lib/images/inline-picture.ts';
import type { ImageManifest } from '#lib/images/picture.ts';

const renderer = new Marked({
	renderer: {
		image({ href, title, text }) {
			return inlinePicture(href, text, title, manifest as ImageManifest);
		}
	}
});

export async function renderMarkdown(body: string): Promise<string> {
	return await renderer.parse(body);
}
