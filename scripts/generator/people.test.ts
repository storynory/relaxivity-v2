import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs/promises';
import YAML from 'yaml';
import { loadConfig } from './config';

test('People replaces Authors and existing author relations still resolve', async () => {
	const collections = await loadConfig();
	assert.ok(collections.some((entry) => entry.name === 'people'));
	assert.ok(!collections.some((entry) => entry.name === 'authors'));
	for (const name of ['posts']) {
		const collection = collections.find((entry) => entry.name === name);
		const author = collection?.fields?.find((field) => field.name === 'author');
		assert.equal(author?.collection, 'people');
	}
	const person = YAML.parse(await fs.readFile('content/people/bertie.yml', 'utf8'));
	assert.equal(person.name, 'Bertie');
	assert.ok(person.roles.includes('Author'));
});
