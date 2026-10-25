import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadConfig } from './config';
import { generateCollections } from './collections';

test('blocks stay reusable and private, with a homepage record ordering them', async () => {
	const config = await loadConfig();
	const blocks = config.find((entry) => entry.name === 'blocks');
	for (const field of ['type', 'heading', 'introduction', 'collection', 'category', 'tags', 'tagMatch', 'limit', 'items', 'image', 'imageAlt', 'imagePosition', 'buttonText', 'buttonUrl']) {
		assert.ok(blocks?.fields?.some((entry) => entry.name === field), field);
	}
	const type = blocks?.fields?.find((entry) => entry.name === 'type');
	assert.ok(type?.options?.includes('hero'));
	assert.ok(type?.options?.includes('panel'));
	const generated = generateCollections(config);
	assert.match(generated, /"blocks": \{[\s\S]*?"publicRoute": false/);
});

test('Selected items offer searchable relations for each public content type', async () => {
	const config = await loadConfig();
	const blocks = config.find((entry) => entry.name === 'blocks');
	const items = blocks?.fields?.find((field) => field.name === 'items');
	assert.equal(items?.widget, 'list');
	assert.ok(!config.some((entry) => entry.name === 'stories'));
	for (const collection of ['posts', 'podcasts']) {
		const variants = items as unknown as {
			types?: { name: string; fields: { name: string; widget: string; collection: string }[] }[];
		} | undefined;
		const option = variants?.types?.find((entry) => entry.name === collection);
		assert.ok(option, collection);
		assert.equal(option.fields[0]?.widget, 'relation');
		assert.equal(option.fields[0]?.collection, collection);
	}
});
