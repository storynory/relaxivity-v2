<script lang="ts">
	// Adapted from the New247 player; uses the starter's CSS variables.
	let { src, title = 'Audio' }: { src: string; title?: string } = $props();
	let audio: HTMLAudioElement;
	let playing = $state(false);
	let current = $state(0);
	let duration = $state(0);
	let status = $state('');

	const progress = $derived(duration > 0 ? (current / duration) * 100 : 0);

	function formatTime(seconds: number): string {
		if (!Number.isFinite(seconds)) return '0:00';
		const minutes = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
		return minutes >= 60
			? `${Math.floor(minutes / 60)}:${(minutes % 60).toString().padStart(2, '0')}:${secs}`
			: `${minutes}:${secs}`;
	}

	async function toggle() {
		if (audio.paused) {
			try {
				await audio.play();
				status = '';
			} catch {
				status = 'Unable to play audio';
			}
		} else {
			audio.pause();
		}
	}

	function jump(seconds: number) {
		if (!Number.isFinite(audio.duration)) return;
		audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
		current = audio.currentTime;
	}

	function seek(event: Event) {
		if (!Number.isFinite(audio.duration)) return;
		const value = Number((event.currentTarget as HTMLInputElement).value);
		const targetTime = (value / 100) * audio.duration;
		current = targetTime; // Update the visible clock immediately while dragging.
		audio.currentTime = targetTime;
	}
</script>

<div class="audio-player" role="group" aria-label={title}>
	<audio
		bind:this={audio}
		{src}
		preload="none"
		onloadedmetadata={() => (duration = audio.duration)}
		ondurationchange={() => (duration = audio.duration)}
		ontimeupdate={() => (current = audio.currentTime)}
		onplay={() => (playing = true)}
		onpause={() => (playing = false)}
		onended={() => (playing = false)}
		onerror={() => (status = 'Audio unavailable')}
	></audio>

	<div class="buttons">
		<button type="button" onclick={() => jump(-10)} aria-label="Go back 10 seconds" title="Back 10 seconds">↶ 10</button>
		<button type="button" class="play" onclick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
			{playing ? '❚❚' : '▶'}
		</button>
		<button type="button" onclick={() => jump(10)} aria-label="Go forward 10 seconds" title="Forward 10 seconds">10 ↷</button>
	</div>

	<input aria-label="Playback position" type="range" min="0" max="100" step="0.1" value={progress} oninput={seek} aria-valuetext={`${formatTime(current)} of ${formatTime(duration)}`} disabled={!Number.isFinite(duration) || duration <= 0} />
	<div class="time"><span>{formatTime(current)}</span><span>{formatTime(duration)}</span></div>
	<p role="status">{status}</p>
	<a class="download" href={src} download>Download audio</a>
</div>

<style>
	.audio-player {
		background: var(--second);
		color: var(--text);
		padding: .75rem 1rem;
		border: 1px solid var(--prime);
		border-radius: var(--radius);
	}
	.buttons { display: flex; align-items: center; justify-content: center; gap: .5rem; }
	button { font: inherit; cursor: pointer; border: 0; border-radius: var(--radius); padding: .5rem; background: transparent; color: inherit; }
	button:hover { background: var(--gray); }
	button:focus-visible, input:focus-visible, a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
	.play { font-size: 2.5rem; min-width: 4rem; min-height: 4rem; color: var(--accent); }
	input[type="range"] { display: block; width: 100%; accent-color: var(--accent); margin: .3rem 0 .1rem; }
	.time { display: flex; justify-content: space-between; font-variant-numeric: tabular-nums; }
	.download { display: inline-block; margin-top: .35rem; color: var(--accent); }
	p { margin: .5rem 0; }
	p:empty { margin: 0; }
</style>
