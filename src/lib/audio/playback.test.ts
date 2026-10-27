import assert from 'node:assert/strict';
import { test } from 'node:test';
import { get } from 'svelte/store';
import { createPlayback } from './playback.ts';

function setup() {
	const playback = createPlayback();
	let source = '';
	let sourceChanges = 0;
	const audio = {
		get src() { return source; },
		set src(value: string) { source = value; sourceChanges++; this.currentTime = 0; },
		currentTime: 0, duration: 120, paused: true, ended: false,
		async play() { this.paused = false; playback.sync(); },
		pause() { this.paused = true; playback.sync(); }
	};
	playback.attach(audio as unknown as HTMLAudioElement);
	return { playback, audio, sourceChanges: () => sourceChanges };
}

const first = { src: '/one.mp3', title: 'One', href: '/podcasts/one/' };
const second = { src: '/two.mp3', title: 'Two', href: '/podcasts/two/' };

test('dismiss pauses and preserves position; resuming the same episode keeps its audio source', async () => {
	const { playback, audio, sourceChanges } = setup();
	await playback.start(first);
	playback.seek(42);
	playback.dismiss();
	assert.equal(audio.paused, true);
	assert.equal(get(playback).visible, false);
	assert.equal(get(playback).current, 42);
	await playback.start(first);
	assert.equal(sourceChanges(), 1);
	assert.equal(audio.currentTime, 42);
	assert.equal(get(playback).visible, true);
	assert.equal(get(playback).playing, true);
});

test('an explicit new episode replaces the track and resets its position', async () => {
	const { playback, audio } = setup();
	await playback.start(first);
	playback.seek(55);
	await playback.start(second);
	assert.equal(audio.src, second.src);
	assert.equal(get(playback).track?.href, second.href);
	assert.equal(get(playback).current, 0);
});

test('seek clamps to the track bounds and ignores unavailable duration', async () => {
	const { playback, audio } = setup();
	await playback.start(first);
	playback.seek(150);
	assert.equal(audio.currentTime, 120);
	playback.jump(-150);
	assert.equal(audio.currentTime, 0);
	audio.duration = Infinity;
	playback.seek(30);
	assert.equal(audio.currentTime, 0);
});

test('failed playback shows a recoverable error and controllers have independent state', async () => {
	const { playback, audio } = setup();
	audio.play = async () => { throw new Error('Unavailable'); };
	await playback.start(first);
	assert.equal(get(playback).playing, false);
	assert.match(get(playback).status, /Unable to play/);
	assert.equal(get(createPlayback()).track, null);
	assert.equal(get(createPlayback()).visible, false);
});

test('full and sample switches use their own source and metadata; navigation does not reset playback', async () => {
	const { playback, audio, sourceChanges } = setup();
	audio.duration = NaN;
	const full = { ...first, duration: '01:00:00', artwork: '/story.webp' };
	const sample = { ...full, src: '/samples/one.mp3', title: 'One — Audio Sample', duration: '00:01:30' };
	await playback.start(full);
	assert.equal(get(playback).duration, 3600);
	await playback.start(sample);
	assert.equal(audio.src, sample.src);
	assert.equal(get(playback).duration, 90);
	assert.equal(get(playback).track?.title, 'One — Audio Sample');
	assert.equal(get(playback).track?.artwork, '/story.webp');
	// A route consumer subscribes/unsubscribes while the layout controller stays mounted.
	audio.duration = 90;
	playback.seek(25);
	const unsubscribe = playback.subscribe(() => {});
	unsubscribe();
	assert.equal(get(playback).playing, true);
	assert.equal(get(playback).current, 25);
	await playback.start(sample);
	assert.equal(audio.currentTime, 25);
	assert.equal(sourceChanges(), 2);
	await playback.start(full);
	assert.equal(audio.src, full.src);
	assert.equal(get(playback).current, 0);
});
