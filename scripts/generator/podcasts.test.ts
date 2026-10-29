import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadConfig } from './config';
import { generateCollections } from './collections';
import { generateTypes } from './types';

test('audio episodes have independent templates, RSS metadata and People relationships', async () => {
	const config = await loadConfig();
	const audio = config.find((entry) => entry.name === 'audio');
	assert.ok(audio);
	assert.equal(audio.public_route, true);
	assert.equal(audio.template, 'podcast');
	assert.equal(audio.list_template, 'episodes');
	for (const name of ['audio', 'length', 'duration', 'episodeNumber', 'description', 'featuredImage']) {
		assert.ok(audio.fields?.some((field) => field.name === name));
	}
	for (const name of ['author', 'narrator', 'presenter', 'producer']) {
		assert.equal(audio.fields?.find((field) => field.name === name)?.collection, 'people');
	}
	const generated = generateCollections(config);
	assert.match(generated, /"audio": \{[\s\S]*?"listTemplate": "episodes"/);
	const types = generateTypes(config);
	assert.match(types, /export type AudioContent/);
	assert.match(types, /"length"\?: number;/);
});

test('sample audio, permanent-free and subscription fields remain optional in CMS and generated types', async () => {
	const config = await loadConfig();
	const fields = config.find((entry) => entry.name === 'audio')!.fields!;
	for (const [name, widget] of [
		['audio', 'string'], ['length', 'number'], ['duration', 'string'],
		['sampleAudio', 'string'], ['sampleLength', 'number'], ['sampleDuration', 'string'],
		['permanentlyFree', 'boolean']
	]) {
		const field = fields.find((field) => field.name === name);
		assert.ok(field);
		assert.equal(field.widget, widget);
		assert.equal(field.required, false);
	}
	const permanent = fields.find((field) => field.name === 'permanentlyFree')!;
	assert.equal((permanent as typeof permanent & { default: boolean }).default, false);
	const settings = config.find((entry) => entry.name === 'settings')!.files!
		.find((file) => file.name === 'general')!.fields!;
	const supercast = settings.find((field) => field.name === 'supercastUrl');
	assert.equal(supercast?.widget, 'string');
	assert.equal(supercast?.required, false);
	const types = generateTypes(config);
	for (const [name, type] of [['sampleAudio', 'string'], ['sampleLength', 'number'],
		['sampleDuration', 'string'], ['permanentlyFree', 'boolean'], ['supercastUrl', 'string']]) {
		assert.ok(types.includes(`"${name}"?: ${type};`));
	}
});
