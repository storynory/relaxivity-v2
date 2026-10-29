import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { createPlayback } from './playback.ts';
import { attachMediaSession } from './media-session.ts';

const base = 'https://example.test/audio/one/';
const globals = ['navigator', 'document', 'MediaMetadata'] as const;
const descriptors = globals.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
afterEach(() => {
	for (const [key, descriptor] of descriptors) {
		if (descriptor) Object.defineProperty(globalThis, key, descriptor);
		else Reflect.deleteProperty(globalThis, key);
	}
});
const define = (key: string, value: unknown) => Object.defineProperty(globalThis, key, { configurable: true, value });

function setup(unsupported: MediaSessionAction[] = []) {
	const handlers = new Map<MediaSessionAction, MediaSessionActionHandler | null>();
	const registrations: MediaSessionAction[] = [];
	const positions: (MediaPositionState | undefined)[] = [];
	let metadataCreations = 0;
	const session = {
		metadata: null as MediaMetadata | null,
		playbackState: 'none' as MediaSessionPlaybackState,
		setActionHandler(action: MediaSessionAction, handler: MediaSessionActionHandler | null) {
			registrations.push(action);
			if (unsupported.includes(action)) throw new Error('Unsupported action');
			handlers.set(action, handler);
		},
		setPositionState(position?: MediaPositionState) { positions.push(position); }
	};
	define('navigator', { mediaSession: session });
	define('document', { baseURI: base });
	define('MediaMetadata', class {
		title: string; artist: string; artwork: MediaImage[];
		constructor(init: MediaMetadataInit) {
			metadataCreations++;
			this.title = init.title!; this.artist = init.artist!; this.artwork = init.artwork!;
		}
	});
	const playback = createPlayback();
	let source = '';
	let sourceChanges = 0;
	const audio = {
		get src() { return source; },
		set src(value: string) { source = value; sourceChanges++; this.currentTime = 0; },
		get currentSrc() { return this.loaded && source ? new URL(source, base).href : ''; },
		loaded: true, currentTime: 0, duration: 120, playbackRate: 1, paused: true, ended: false,
		async play() { this.paused = false; this.ended = false; playback.sync(); },
		pause() { this.paused = true; playback.sync(); }
	};
	playback.attach(audio as unknown as HTMLAudioElement);
	const dispose = attachMediaSession(playback, audio as unknown as HTMLAudioElement, 'Relaxivity');
	const action = (action: MediaSessionAction, details: Partial<MediaSessionActionDetails> = {}) => handlers.get(action)?.({ action, ...details });
	return { playback, audio, session, handlers, registrations, positions, action, dispose,
		metadataCreations: () => metadataCreations, sourceChanges: () => sourceChanges };
}

const first = { src: '/one.mp3', title: 'One', href: '/audio/one/', artwork: '/uploads/one.webp' };
const second = { src: '/two.mp3', title: 'Two — Audio Sample', href: '/audio/two/', artwork: '/uploads/two.jpg' };

test('metadata follows selected and automatically advanced tracks without being recreated on time updates', async () => {
	const { playback, audio, session, metadataCreations } = setup();
	await playback.startQueue([first, second]);
	assert.equal(session.metadata?.title, 'One');
	assert.equal(session.metadata?.artist, 'Relaxivity');
	assert.deepEqual(session.metadata?.artwork, [{ src: 'https://example.test/uploads/one.webp' }]);
	playback.seek(25); playback.sync();
	assert.equal(metadataCreations(), 1);
	audio.ended = true; audio.paused = true;
	await playback.ended();
	assert.equal(session.metadata?.title, second.title);
	assert.deepEqual(session.metadata?.artwork, [{ src: 'https://example.test/uploads/two.jpg' }]);
	assert.equal(metadataCreations(), 2);
	await playback.start({ ...second, title: 'Updated title', artwork: '' });
	assert.equal(session.metadata?.title, 'Updated title');
	assert.deepEqual(session.metadata?.artwork, []);
});

test('system play is idempotent; pause and fixed ten-second seeks reuse the existing player', async () => {
	const { playback, audio, session, action, sourceChanges } = setup();
	await playback.start(first);
	action('pause');
	assert.equal(audio.paused, true);
	assert.equal(session.playbackState, 'paused');
	action('play'); action('play');
	assert.equal(audio.paused, false);
	assert.equal(session.playbackState, 'playing');
	playback.seek(30);
	action('seekbackward', { seekOffset: 30 });
	assert.equal(audio.currentTime, 20);
	action('seekforward', { seekOffset: 30 });
	assert.equal(audio.currentTime, 30);
	action('seekto', { seekTime: 115 }); action('seekforward');
	assert.equal(audio.currentTime, 120);
	action('seekto', { seekTime: -5 });
	assert.equal(audio.currentTime, 0);
	assert.equal(sourceChanges(), 1);
});

test('next/previous handlers follow queue boundaries and are not registered on every playback update', async () => {
	const { playback, handlers, registrations, action, session } = setup();
	await playback.start(first);
	assert.equal(handlers.get('nexttrack'), null);
	assert.equal(handlers.get('previoustrack'), null);
	await playback.startQueue([first, second]);
	assert.equal(typeof handlers.get('nexttrack'), 'function');
	assert.equal(handlers.get('previoustrack'), null);
	const count = registrations.length;
	for (let time = 1; time < 10; time++) playback.seek(time);
	assert.equal(registrations.length, count);
	action('nexttrack');
	assert.equal(session.metadata?.title, second.title);
	assert.equal(handlers.get('nexttrack'), null);
	assert.equal(typeof handlers.get('previoustrack'), 'function');
	action('previoustrack');
	assert.equal(session.metadata?.title, first.title);
	await playback.start(second);
	assert.equal(handlers.get('nexttrack'), null);
	assert.equal(handlers.get('previoustrack'), null);
	for (const action of ['play', 'pause', 'seekbackward', 'seekforward', 'seekto']) {
		assert.equal(registrations.filter((registered) => registered === action).length, 1);
	}
});

test('position uses actual audio duration, time and rate, and clears unknown or stale source positions', async () => {
	const { playback, audio, positions } = setup();
	await playback.start({ ...first, duration: '01:00:00' });
	playback.seek(42);
	assert.deepEqual(positions.at(-1), { duration: 120, position: 42, playbackRate: 1 });
	audio.playbackRate = 1.5; audio.currentTime = 150; playback.sync();
	assert.deepEqual(positions.at(-1), { duration: 120, position: 120, playbackRate: 1.5 });
	for (const duration of [NaN, Infinity, 0]) {
		audio.duration = duration; playback.sync();
		assert.equal(positions.at(-1), undefined);
	}
	audio.duration = 120; audio.playbackRate = 0; playback.sync();
	assert.equal(positions.at(-1), undefined);
	audio.playbackRate = 1; audio.loaded = false;
	await playback.start(second);
	assert.equal(positions.at(-1), undefined);
});

test('dismissal and unmount clear system state and cleanup removes handlers and the subscription', async () => {
	const { playback, session, handlers, positions, dispose } = setup();
	await playback.startQueue([first, second]);
	playback.dismiss();
	assert.equal(session.metadata, null);
	assert.equal(session.playbackState, 'none');
	assert.equal(positions.at(-1), undefined);
	assert.equal(handlers.get('nexttrack'), null);
	await playback.play();
	assert.equal((session.metadata as MediaMetadata | null)?.title, first.title);
	dispose();
	assert.ok([...handlers.values()].every((handler) => handler === null));
	assert.equal(session.metadata, null);
	assert.equal(session.playbackState, 'none');
	const count = positions.length;
	playback.sync();
	assert.equal(positions.length, count);
});

test('unsupported actions and missing metadata/position APIs do not interfere with playback', async () => {
	const { playback, session, action, audio } = setup(['seekto', 'previoustrack', 'nexttrack']);
	define('MediaMetadata', undefined);
	Reflect.deleteProperty(session, 'setPositionState');
	await playback.startQueue([first, second]);
	action('pause'); action('play');
	assert.equal(audio.paused, false);
	assert.equal(session.playbackState, 'playing');
	await playback.next();
	assert.equal(audio.src, second.src);
});

test('failed playback reports paused state instead of claiming that system playback is running', async () => {
	const { playback, audio, session } = setup();
	audio.play = async () => { throw new Error('Playback blocked'); };
	await playback.start(first);
	assert.equal(session.playbackState, 'paused');
});

test('invalid artwork keeps story metadata, while an invalid source never publishes a stale position', async () => {
	const { playback, audio, session, positions } = setup();
	audio.loaded = false;
	await playback.start({ ...first, src: 'http://[', artwork: 'http://[' });
	assert.equal(session.metadata?.title, first.title);
	assert.deepEqual(session.metadata?.artwork, []);
	assert.equal(positions.at(-1), undefined);
});

test('import and attachment are harmless without browser globals or Media Session support', () => {
	for (const key of globals) Reflect.deleteProperty(globalThis, key);
	const playback = createPlayback();
	assert.doesNotThrow(() => attachMediaSession(playback, {} as HTMLAudioElement, 'Relaxivity')());
	define('navigator', {});
	assert.doesNotThrow(() => attachMediaSession(playback, {} as HTMLAudioElement, 'Relaxivity')());
});
