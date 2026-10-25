import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateTypes } from './types';
import type { CmsCollection } from './config';

test('generates primitive fields, optional properties, nested objects and relations', () => {
	const input: CmsCollection[] = [{
		name: 'posts',
		folder: 'content/posts',
		fields: [
			{ name: 'title', widget: 'string' },
			{ name: 'draft', widget: 'boolean' },
			{ name: 'excerpt', widget: 'text', required: false },
			{ name: 'tags', widget: 'relation', collection: 'tags', multiple: true, required: false },
			{ name: 'seo', widget: 'object', required: false, fields: [
				{ name: 'description', widget: 'text', required: false }
			] }
		]
	}];
	const output = generateTypes(input);
	assert.match(output, /"title": string;/);
	assert.match(output, /"draft": boolean;/);
	assert.match(output, /"excerpt"\?: string;/);
	assert.match(output, /"tags"\?: string\[\];/);
	assert.match(output, /"seo"\?: \{/);
	assert.match(output, /"description"\?: string;/);
});

test('generates file collection types and nested navigation lists', () => {
	const input: CmsCollection[] = [
		{ name: 'settings', files: [{ name: 'general', file: 'general.yml', fields: [
			{ name: 'siteName', widget: 'string' }
		] }] },
		{ name: 'navigation', folder: 'content/navigation', fields: [
			{ name: 'items', widget: 'list', fields: [
				{ name: 'label', widget: 'string' },
				{ name: 'children', widget: 'list', required: false, fields: [
					{ name: 'url', widget: 'string' }
				] }
			] }
		] }
	];
	const output = generateTypes(input);
	assert.match(output, /export type SettingsGeneralContent/);
	assert.match(output, /"general": SettingsGeneralContent;/);
	assert.match(output, /"children"\?: \{/);
	assert.match(output, /"url": string;/);
	assert.match(output, /\}\[\];/);
});
