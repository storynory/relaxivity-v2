import assert from 'node:assert/strict';
import { test } from 'node:test';
import { get } from 'svelte/store';
import { autoAdvanceStorageKey, createPlayback } from './playback.ts';

function setup() {
	const playback = createPlayback();
	let source = '';
	let sourceChanges = 0;
	const audio = {
		get src() { return source; },
		set src(value: string) { source = value; sourceChanges++; this.currentTime = 0; },
		currentTime: 0, duration: 120, paused: true, ended: false,
		async play() { this.paused = false; this.ended = false; playback.sync(); },
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

test('queues advance in order on end, stop at the last track, and never loop', async () => {
	const { playback, audio, sourceChanges } = setup();
	await playback.startQueue([first, second], 0, undefined, 'Favourites');
	assert.equal(get(playback).autoAdvance, true);
	assert.equal(get(playback).queueName, 'Favourites');
	audio.ended = true; audio.paused = true;
	await playback.ended();
	assert.equal(audio.src, second.src);
	assert.equal(get(playback).queueIndex, 1);
	assert.equal(get(playback).playing, true);
	audio.ended = true; audio.paused = true;
	await playback.ended();
	assert.equal(get(playback).playing, false);
	assert.equal(sourceChanges(), 2);
});

test('automatic next can be disabled while manual next and previous still work', async () => {
	const { playback, audio } = setup();
	await playback.startQueue([first, second]);
	playback.setAutoAdvance(false);
	audio.ended = true; audio.paused = true;
	await playback.ended();
	assert.equal(get(playback).track?.src, first.src);
	assert.equal(get(playback).playing, false);
	await playback.next();
	assert.equal(get(playback).track?.src, second.src);
	await playback.previous();
	assert.equal(get(playback).queueIndex, 0);
	await playback.previous();
	assert.equal(get(playback).queueIndex, 0);
});

test('queue snapshots ignore later playlist edits, skip missing audio and support starting partway through', async () => {
	const { playback, audio } = setup();
	const playlist = [{ ...first }, { ...second }, { ...first, src: '' }];
	await playback.startQueue(playlist);
	playlist[1].title = 'Changed';
	playlist.reverse();
	assert.equal(get(playback).queue[1].title, 'Two');
	await playback.next();
	assert.equal(audio.src, second.src);
	assert.equal(get(playback).queue.length, 2);
	await playback.startQueue([{ ...first, src: '' }, first, second], 2);
	assert.equal(get(playback).queueIndex, 1);
	assert.equal(get(playback).track?.src, second.src);
	await playback.startQueue([]);
	assert.equal(get(playback).track?.src, second.src);
});

test('single-story playback clears the queue; dismissing never advances it', async () => {
	const { playback, audio } = setup();
	await playback.startQueue([first, second]);
	playback.seek(30);
	playback.dismiss();
	assert.equal(audio.paused, true);
	assert.equal(get(playback).queueIndex, 0);
	assert.equal(audio.currentTime, 30);
	await playback.start(first);
	assert.equal(get(playback).queue.length, 0);
	audio.ended = true; audio.paused = true;
	await playback.ended();
	assert.equal(audio.src, first.src);
});

test('selecting the same story from another list replaces the queue and retains playback position', async () => {
	const { playback, audio, sourceChanges } = setup();
	const third = { src: '/three.mp3', title: 'Three', href: '/podcasts/three/' };
	await playback.startQueue([first, second], 0, undefined, 'Playlist', '/category/one/');
	playback.seek(30);
	await playback.startQueue([first, third], 0, undefined, 'Playlist', '/tag/two/');
	assert.equal(get(playback).contextId, '/tag/two/');
	assert.equal(sourceChanges(), 1);
	assert.equal(audio.currentTime, 30);
	audio.ended = true; audio.paused = true;
	await playback.ended();
	assert.equal(audio.src, third.src);
	assert.equal(get(playback).contextId, '/tag/two/');
	await playback.start(first, undefined, '/category/three/');
	assert.equal(get(playback).queue.length, 0);
	assert.equal(get(playback).contextId, '/category/three/');
});

test('changing list order updates what plays next without restarting the current story or touching another list', async () => {
	const { playback, audio, sourceChanges } = setup();
	const third = { src: '/three.mp3', title: 'Three', href: '/podcasts/three/' };
	await playback.startQueue([first, second, third], 1, undefined, 'Playlist', '/podcasts/');
	playback.seek(42);
	playback.reorderQueue([third, second, first], '/favourites/');
	assert.equal(get(playback).queue[2].src, third.src);
	playback.reorderQueue([third, second, first], '/podcasts/');
	assert.equal(sourceChanges(), 1);
	assert.equal(audio.currentTime, 42);
	assert.equal(audio.paused, false);
	assert.equal(get(playback).queueIndex, 1);
	audio.ended = true; audio.paused = true;
	await playback.ended();
	assert.equal(audio.src, first.src);
});

test('sorting never enables a queue for single-story playback, and a removed favourite can finish first', async () => {
	const { playback, audio } = setup();
	await playback.start(first, undefined, '/favourites/');
	playback.reorderQueue([second, first], '/favourites/');
	assert.equal(get(playback).queue.length, 0);
	await playback.startQueue([first, second], 0, undefined, 'Playlist', '/favourites/');
	playback.reorderQueue([second], '/favourites/');
	assert.equal(audio.src, first.src);
	assert.equal(get(playback).queueIndex, 0);
	audio.ended = true; audio.paused = true;
	await playback.ended();
	assert.equal(audio.src, second.src);
});

test('a failed automatic next stops with a recoverable status instead of looping', async () => {
	const { playback, audio } = setup();
	await playback.startQueue([first, second]);
	audio.play = async () => { throw new Error('Playback blocked'); };
	audio.ended = true; audio.paused = true;
	await playback.ended();
	assert.equal(get(playback).queueIndex, 1);
	assert.equal(get(playback).playing, false);
	assert.match(get(playback).status, /Unable to play/);
});

test('automatic next preference persists, without restoring playback on reload', () => {
	const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
	const values = new Map<string, string>();
	Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
		getItem: (key: string) => values.get(key) ?? null,
		setItem: (key: string, value: string) => values.set(key, value)
	} });
	try {
		const { playback } = setup();
		playback.setAutoAdvance(false);
		assert.equal(values.get(autoAdvanceStorageKey), 'false');
		const reloaded = setup().playback;
		assert.equal(get(reloaded).autoAdvance, false);
		assert.equal(get(reloaded).track, null);
		assert.equal(get(reloaded).queue.length, 0);
	} finally {
		if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
		else Reflect.deleteProperty(globalThis, 'localStorage');
	}
});
