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
		{ name: 'podcasts', folder: 'content/podcasts', public_route: true, template: 'podcast', list_template: 'episodes' },
		{ name: 'posts', folder: 'content/posts', public_route: true, template: 'post' }
	]);
	assert.match(output, /"podcasts": \{[\s\S]*?"template": "podcast",[\s\S]*?"listTemplate": "episodes"/);
	assert.match(output, /"posts": \{[\s\S]*?"listTemplate": "default"/);
});

test('generates RSS settings for opted-in and disabled collections', () => {
	const output = generateCollections([
		{ name: 'posts', folder: 'content/posts', public_route: true, rss: 'standard' },
		{ name: 'podcasts', folder: 'content/podcasts', public_route: true, rss: 'podcast' },
		{ name: 'pages', folder: 'content/pages', public_route: true, rss: false },
		{ name: 'other', folder: 'content/other' }
	]);
	assert.match(output, /"rss": "standard"/);
	assert.match(output, /"rss": "podcast"/);
	assert.equal((output.match(/"rss": false/g) ?? []).length, 2);
});
