import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadConfig } from './config';
import { generateCollections } from './collections';
import { generateTypes } from './types';

test('podcasts have independent templates, RSS metadata and People relationships', async () => {
	const config = await loadConfig();
	const podcasts = config.find((entry) => entry.name === 'podcasts');
	assert.ok(podcasts);
	assert.equal(podcasts.public_route, true);
	assert.equal(podcasts.template, 'podcast');
	assert.equal(podcasts.list_template, 'episodes');
	for (const name of ['audio', 'length', 'duration', 'episodeNumber', 'description', 'featuredImage']) {
		assert.ok(podcasts.fields?.some((field) => field.name === name));
	}
	for (const name of ['author', 'narrator', 'presenter', 'producer']) {
		assert.equal(podcasts.fields?.find((field) => field.name === name)?.collection, 'people');
	}
	const generated = generateCollections(config);
	assert.match(generated, /"podcasts": \{[\s\S]*?"listTemplate": "episodes"/);
	const types = generateTypes(config);
	assert.match(types, /export type PodcastsContent/);
	assert.match(types, /"length"\?: number;/);
});
