import assert from 'node:assert/strict';
import { test } from 'node:test';
import { storyDescription } from './story-description.ts';

test('page descriptions prefer audio titles and normalise whitespace', () => {
	const items = [
		{ collection: 'posts', title: 'A related post' },
		{ collection: 'audio', title: '  First\n Story  ' },
		{ collection: 'audio', title: 'Second Story' },
		{ collection: 'audio', title: 'Third Story' }
	];
	assert.equal(storyDescription(items, 'Myths Page 2'),
		'Audio Stories including First Story and Second Story. Myths Page 2.');
});

test('short and empty pages have meaningful descriptions without missing examples', () => {
	assert.equal(storyDescription([{ title: 'Only Story' }], 'Audio Page 2'),
		'Audio Stories including Only Story. Audio Page 2.');
	assert.equal(storyDescription([], 'Audio Page 3'), 'Audio Stories. Audio Page 3.');
});
