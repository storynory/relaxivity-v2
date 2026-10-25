import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadConfig } from './config';

test('pages offer per-page layouts and ordered reusable Blocks', async () => {
	const collections = await loadConfig();
	const pages = collections.find((collection) => collection.name === 'pages');
	assert.ok(pages?.folder);
	for (const field of ['title', 'excerpt', 'body', 'layout', 'blocks']) {
		assert.ok(pages.fields?.some((item) => item.name === field), field);
	}
	const blocks = pages.fields?.find((item) => item.name === 'blocks');
	assert.equal(blocks?.widget, 'relation');
	assert.equal(blocks?.collection, 'blocks');
	assert.equal(blocks?.multiple, true);
});
