import assert from 'node:assert/strict';
import { test } from 'node:test';
import { audioUrl } from './url.ts';

test('audio paths resolve against the configured directory and full URLs remain unchanged', () => {
	for (const base of ['https://audio.relaxivity.app/episodes', 'https://audio.relaxivity.app/episodes/']) {
		for (const path of ['story.mp3', '/story.mp3']) {
			assert.equal(audioUrl(path, base), 'https://audio.relaxivity.app/episodes/story.mp3');
		}
	}
	assert.equal(audioUrl('https://traffic.libsyn.com/show/story.mp3', undefined), 'https://traffic.libsyn.com/show/story.mp3');
	assert.equal(audioUrl('', 'https://audio.relaxivity.app/'), '');
	assert.equal(audioUrl('story.mp3', undefined), '');
	assert.equal(audioUrl('javascript:alert(1)', 'https://audio.relaxivity.app/'), '');
});
