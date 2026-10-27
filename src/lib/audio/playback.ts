import { writable } from 'svelte/store';

export const playbackKey = Symbol('playback');

export type Track = { src: string; title: string; href: string; artwork?: string; duration?: string };
type PlaybackState = {
	track: Track | null;
	visible: boolean;
	playing: boolean;
	current: number;
	duration: number;
	status: string;
};

// Create one controller per layout, rather than sharing playback between SSR requests.
export function createPlayback() {
	let state: PlaybackState = {
		track: null, visible: false, playing: false, current: 0, duration: 0, status: ''
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

	return {
		subscribe: store.subscribe,
		attach(element: HTMLAudioElement) {
			audio = element;
			return () => { pause(); audio = undefined; };
		},
		start(track: Track, trigger?: HTMLElement) {
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
