import assert from 'node:assert/strict';
import { test } from 'node:test';
import { relationLabel, relationLabels, textField } from './fields.ts';

test('templates may read arbitrary scalar fields without changing the route', () => {
	const podcast = { title: 'Episode one', duration: 23, audio: '/audio/one.mp3' };
	assert.equal(textField(podcast, 'audio'), '/audio/one.mp3');
	assert.equal(textField(podcast, 'duration'), '23');
	assert.equal(textField(podcast, 'missing'), '');
});

test('Post template relation helpers handle resolved and absent relations', () => {
	assert.equal(relationLabel({ name: 'Bertie' }, 'name'), 'Bertie');
	assert.equal(relationLabel(null, 'name'), '');
	assert.deepEqual(relationLabels([{ title: 'Music' }, null, { title: 'Stories' }], 'title'), ['Music', 'Stories']);
});
