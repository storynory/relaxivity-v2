import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs/promises';
import YAML from 'yaml';
import matter from 'gray-matter';
import { loadConfig } from './config';

test('homepage is an ordinary Page selected in Site Settings', async () => {
	const config = await loadConfig();

	// The homepage is selected from Pages, not a separate collection.
	assert.ok(!config.some((entry) => entry.name === 'homepage'));

	const settings = config.find((entry) => entry.name === 'settings');
	const general = settings?.files?.find((entry) => entry.name === 'general');
	const selector = general?.fields?.find((field) => field.name === 'homePage');

	assert.equal(selector?.collection, 'pages');

	const values = YAML.parse(await fs.readFile('content/settings/general.yml', 'utf8'));

	const slug = values.homePage;
	assert.equal(typeof slug, 'string');
	assert.ok(slug);

	const page = matter(await fs.readFile(`content/pages/${slug}.md`, 'utf8'));

	assert.equal(typeof page.data.title, 'string');

	// Blocks are an editable, ordered list — not a fixed arrangement.
	assert.ok(Array.isArray(page.data.blocks));

	for (const block of page.data.blocks) {
		assert.equal(typeof block, 'string');
		assert.ok(block.length > 0);
	}
});
