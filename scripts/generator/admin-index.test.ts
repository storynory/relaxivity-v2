import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateAdminIndex } from './admin-index';

const initial = `<head>
<link href="/admin/config.yml" rel="cms-config-url" />
<!-- CMS_COLLECTIONS_START -->
<!-- CMS_COLLECTIONS_END -->
</head>
<script src="cms.js"></script>`;

test('registers every YAML collection in sorted order and preserves other HTML', () => {
	const output = generateAdminIndex(initial, ['stories.yml', 'posts.yaml', 'readme.txt', 'authors.yml']);
	assert.match(output, /admin\/config.yml/);
	assert.match(output, /script src="cms.js"/);
	assert.ok(output.indexOf('authors.yml') < output.indexOf('posts.yaml'));
	assert.ok(output.indexOf('posts.yaml') < output.indexOf('stories.yml'));
	assert.doesNotMatch(output, /readme.txt/);
	assert.equal((output.match(/rel="cms-config-url"/g) ?? []).length, 4);
	assert.equal(generateAdminIndex(output, ['stories.yml', 'posts.yaml', 'readme.txt', 'authors.yml']), output);
});

test('refuses to overwrite unmarked or malformed HTML', () => {
	assert.throws(() => generateAdminIndex('<head></head>', ['posts.yml']), /markers/);
	assert.throws(() => generateAdminIndex('<!-- CMS_COLLECTIONS_END --><!-- CMS_COLLECTIONS_START -->', []), /markers/);
});
