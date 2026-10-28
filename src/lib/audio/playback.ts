import { writable } from 'svelte/store';

export const playbackKey = Symbol('playback');
export const autoAdvanceStorageKey = 'relaxivity:auto-advance:v1';

export type Track = { src: string; title: string; href: string; artwork?: string; duration?: string };
type PlaybackState = {
	track: Track | null;
	visible: boolean;
	playing: boolean;
	current: number;
	duration: number;
	status: string;
	queue: Track[];
	queueIndex: number;
	queueName: string;
	autoAdvance: boolean;
};

// Create one controller per layout, rather than sharing playback between SSR requests.
export function createPlayback() {
	let state: PlaybackState = {
		track: null, visible: false, playing: false, current: 0, duration: 0, status: '',
		queue: [], queueIndex: -1, queueName: '', autoAdvance: true
	};
	const store = writable(state);
	let audio: HTMLAudioElement | undefined;
	let origin: HTMLElement | undefined;
	let request = 0;
	const update = (values: Partial<PlaybackState>) => {
		state = { ...state, ...values };
		store.set(state);
	};
	const pause = () => {
		request++;
		audio?.pause();
		update({ playing: false });
	};
	const play = async () => {
		if (!audio || !state.track) return;
		const activeRequest = ++request;
		update({ visible: true, status: '' });
		try {
			await audio.play();
		} catch {
			if (activeRequest === request) update({ playing: false, status: 'Unable to play audio. Please try again.' });
		}
	};
	const startTrack = (track: Track, trigger?: HTMLElement) => {
		if (!audio) return;
		origin = trigger;
		if (state.track?.src !== track.src) {
			pause();
			update({ track, current: 0, duration: durationSeconds(track.duration), status: '' });
			audio.src = track.src;
		} else {
			update({ track });
		}
		return play();
	};
	const moveQueue = (index: number) => {
		if (!audio || index < 0 || index >= state.queue.length) return;
		update({ queueIndex: index });
		return startTrack(state.queue[index], origin);
	};

	return {
		subscribe: store.subscribe,
		attach(element: HTMLAudioElement) {
			audio = element;
			try {
				update({ autoAdvance: localStorage.getItem(autoAdvanceStorageKey) !== 'false' });
			} catch { /* The preference can still be changed for this visit. */ }
			return () => { pause(); audio = undefined; };
		},
		start(track: Track, trigger?: HTMLElement) {
			if (!audio) return;
			update({ queue: [], queueIndex: -1, queueName: '' });
			return startTrack(track, trigger);
		},
		// Any ordered set of playable tracks can use this, including future category playlists.
		startQueue(tracks: Track[], index = 0, trigger?: HTMLElement, name = 'Playlist') {
			if (!audio || !tracks[index]?.src) return;
			const queue = tracks.filter((track) => !!track.src).map((track) => ({ ...track }));
			const queueIndex = tracks.slice(0, index).filter((track) => !!track.src).length;
			update({ queue, queueIndex, queueName: name });
			return startTrack(queue[queueIndex], trigger);
		},
		next() { return moveQueue(state.queueIndex + 1); },
		previous() { return moveQueue(state.queueIndex - 1); },
		setAutoAdvance(enabled: boolean) {
			update({ autoAdvance: enabled });
			try { localStorage.setItem(autoAdvanceStorageKey, String(enabled)); } catch { /* Use session preference. */ }
		},
		ended() {
			this.sync();
			if (state.autoAdvance && state.queueIndex >= 0) return this.next();
		},
		toggle() { if (audio?.paused) return play(); pause(); },
		pause,
		dismiss() {
			pause();
			update({ visible: false });
			return origin?.isConnected ? origin : undefined;
		},
		seek(seconds: number) {
			if (!audio || !Number.isFinite(seconds) || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
			audio.currentTime = Math.max(0, Math.min(audio.duration, seconds));
			update({ current: audio.currentTime });
		},
		jump(seconds: number) { this.seek((audio?.currentTime ?? 0) + seconds); },
		sync() {
			if (!audio) return;
			update({
				playing: !audio.paused && !audio.ended,
				current: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
				duration: Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : durationSeconds(state.track?.duration)
			});
		},
		fail() { update({ playing: false, status: 'Audio unavailable. Please try again.' }); }
	};
}

export type Playback = ReturnType<typeof createPlayback>;

export function formatTime(seconds: number) {
	if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
	const minutes = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
	return minutes >= 60
		? `${Math.floor(minutes / 60)}:${(minutes % 60).toString().padStart(2, '0')}:${secs}`
		: `${minutes}:${secs}`;
}

function durationSeconds(value?: string): number {
	if (!value || !/^\d{1,3}:\d{2}(?::\d{2})?$/.test(value)) return 0;
	return value.split(':').reduce((seconds, part) => seconds * 60 + Number(part), 0);
}
