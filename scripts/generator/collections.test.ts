import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateCollections } from './collections';

test('only explicitly opted-in folder collections have public routes', () => {
	const output = generateCollections([
		{ name: 'posts', folder: 'content/posts', public_route: true },
		{ name: 'navigation', folder: 'content/navigation' },
		{ name: 'settings', files: [{ name: 'general', file: 'content/settings/general.yml' }] }
	]);
	assert.match(output, /"posts": \{[\s\S]*?"publicRoute": true/);
	assert.match(output, /"navigation": \{[\s\S]*?"publicRoute": false/);
	assert.doesNotMatch(output, /"settings": \{[\s\S]*?"publicRoute": true/);
});

test('generates independently configurable listing and detail templates', () => {
	const output = generateCollections([
		{ name: 'audio', folder: 'content/audio', public_route: true, template: 'podcast', list_template: 'episodes' },
		{ name: 'posts', folder: 'content/posts', public_route: true, template: 'post' }
	]);
	assert.match(output, /"audio": \{[\s\S]*?"template": "podcast",[\s\S]*?"listTemplate": "episodes"/);
	assert.match(output, /"posts": \{[\s\S]*?"listTemplate": "default"/);
});

test('generates RSS settings for opted-in and disabled collections', () => {
	const output = generateCollections([
		{ name: 'posts', folder: 'content/posts', public_route: true, rss: 'standard' },
		{ name: 'audio', folder: 'content/audio', public_route: true, rss: 'podcast' },
		{ name: 'pages', folder: 'content/pages', public_route: true, rss: false },
		{ name: 'other', folder: 'content/other' }
	]);
	assert.match(output, /"rss": "standard"/);
	assert.match(output, /"rss": "podcast"/);
	assert.equal((output.match(/"rss": false/g) ?? []).length, 2);
});

test('archive defaults come from labels, with optional YAML overrides', () => {
	const output = generateCollections([
		{ name: 'notes', label: 'Field Notes', label_singular: 'Note', folder: 'content/notes' },
		{ name: 'plain', folder: 'content/plain' },
		{ name: 'custom', label: 'Custom', folder: 'content/custom', archive: {
			title: 'Our collection', introduction: 'An introduction.',
			seo: { title: 'Explore our collection', description: 'A search description.', image: '/cover.jpg' }
		} }
	]);
	// Read the generated literal rather than duplicating the normalisation logic.
	const definitions = JSON.parse(output.split('export const collections = ')[1].split(' as const;')[0]);
	assert.equal(definitions.notes.labelSingular, 'Note');
	assert.deepEqual(definitions.notes.archive, {
		title: 'Field Notes', introduction: '', seo: { title: 'Field Notes', description: '', image: '' }
	});
	assert.equal(definitions.plain.archive.title, 'plain');
	assert.deepEqual(definitions.custom.archive, {
		title: 'Our collection', introduction: 'An introduction.',
		seo: { title: 'Explore our collection', description: 'A search description.', image: '/cover.jpg' }
	});
	const intro = generateCollections([{ name: 'intro', folder: 'content/intro', archive: { introduction: 'About these records.' } }]);
	assert.match(intro, /"description": "About these records\."/);
});
