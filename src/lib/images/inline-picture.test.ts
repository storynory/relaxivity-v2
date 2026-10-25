import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Marked } from 'marked';
import { inlinePicture } from './inline-picture.ts';

const manifest = {
	'/uploads/mattise.jpg': {
		width: 1920, height: 1080, sizes: [320, 640, 960], formats: ['webp'],
		fallback: '/optimized/mattise.640.jpg'
	}
};

test('Markdown images use WebP sources and preserve meaningful alt text', async () => {
	const marked = new Marked({
		renderer: { image({ href, text, title }) { return inlinePicture(href, text, title, manifest); } }
	});
	const html = await marked.parse('Look: ![A painting](/uploads/mattise.jpg "Gallery")');
	assert.match(html, /<picture>/);
	assert.match(html, /sizes="\(min-width: 808px\) 760px, calc\(100vw - 48px\)"/);
	assert.match(html, /mattise\.320\.webp 320w/);
	assert.match(html, /src="\/optimized\/mattise\.640\.jpg"/);
	assert.match(html, /alt="A painting"/);
	assert.match(html, /title="Gallery"/);
	assert.match(html, /width="1920" height="1080"/);
});

test('external images and manually optimised static images remain plain img tags', () => {
	assert.match(inlinePicture('https://example.com/photo.jpg', 'Outside', null, manifest), /^<img /);
	assert.match(inlinePicture('/photos/cover.avif', 'Cover', null, manifest), /src="\/photos\/cover\.avif"/);
});

test('alt and title attributes are safely escaped', () => {
	const html = inlinePicture('/uploads/mattise.jpg', 'A "painting" <test>', '" onerror="alert(1)', manifest);
	assert.match(html, /alt="A &quot;painting&quot; &lt;test&gt;"/);
	assert.doesNotMatch(html, /" onerror="/);
});

test('editor can request high priority for an inline image', () => {
	const html = inlinePicture('/uploads/mattise.jpg', 'Hero', 'priority=high', manifest);
	assert.match(html, /loading="eager"/);
	assert.match(html, /fetchpriority="high"/);
	assert.doesNotMatch(html, /title="priority=high"/);
});
