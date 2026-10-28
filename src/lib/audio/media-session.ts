import type { Playback } from './playback.ts';

/** Connect system media controls to the existing player for its mounted lifetime. */
export function attachMediaSession(playback: Playback, audio: HTMLAudioElement, publisher: string) {
	if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return () => {};
	const session = navigator.mediaSession;
	if (!session) return () => {};
	const attempt = (operation: () => void) => {
		try { operation(); } catch { /* Media Session actions and methods vary by browser. */ }
	};
	const setAction = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) =>
		attempt(() => session.setActionHandler(action, handler));
	const actions: Partial<Record<MediaSessionAction, MediaSessionActionHandler>> = {
		play: () => { void playback.play(); },
		pause: () => playback.pause(),
		seekbackward: () => playback.jump(-10),
		seekforward: () => playback.jump(10),
		seekto: ({ seekTime }) => { if (seekTime !== undefined) playback.seek(seekTime); }
	};
	for (const action of Object.keys(actions) as MediaSessionAction[]) setAction(action, actions[action]!);

	let metadataKey = '';
	let trackSource = '';
	let previousEnabled: boolean | undefined;
	let nextEnabled: boolean | undefined;
	const unsubscribe = playback.subscribe((state) => {
		const track = state.visible ? state.track : null;
		const key = track ? JSON.stringify([track.src, track.title, track.artwork, publisher]) : '';
		if (key !== metadataKey) {
			metadataKey = key;
			trackSource = '';
			let metadata: MediaMetadata | null = null;
			if (track) {
				attempt(() => { trackSource = new URL(track.src, document.baseURI).href; });
				const artwork: MediaImage[] = [];
				if (track.artwork) attempt(() => { artwork.push({ src: new URL(track.artwork!, document.baseURI).href }); });
				if (typeof MediaMetadata !== 'undefined') attempt(() => {
					metadata = new MediaMetadata({ title: track.title, artist: publisher, artwork });
				});
			}
			attempt(() => { session.metadata = metadata; });
		}
		attempt(() => { session.playbackState = track ? state.playing ? 'playing' : 'paused' : 'none'; });
		attempt(() => {
			if (track && trackSource && trackSource === audio.currentSrc && Number.isFinite(audio.duration) && audio.duration > 0
				&& Number.isFinite(audio.currentTime) && Number.isFinite(audio.playbackRate) && audio.playbackRate > 0) {
				session.setPositionState?.({
					duration: audio.duration,
					position: Math.max(0, Math.min(audio.duration, audio.currentTime)),
					playbackRate: audio.playbackRate
				});
			} else session.setPositionState?.();
		});

		const previous = !!track && state.queueIndex > 0;
		const next = !!track && state.queueIndex >= 0 && state.queueIndex < state.queue.length - 1;
		if (previous !== previousEnabled) {
			previousEnabled = previous;
			setAction('previoustrack', previous ? () => { void playback.previous(); } : null);
		}
		if (next !== nextEnabled) {
			nextEnabled = next;
			setAction('nexttrack', next ? () => { void playback.next(); } : null);
		}
	});

	return () => {
		unsubscribe();
		for (const action of [...Object.keys(actions), 'previoustrack', 'nexttrack'] as MediaSessionAction[]) setAction(action, null);
		attempt(() => { session.metadata = null; session.playbackState = 'none'; });
		attempt(() => session.setPositionState?.());
	};
}
