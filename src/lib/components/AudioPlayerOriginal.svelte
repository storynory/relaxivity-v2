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
		const secs = Math.floor(seconds % 60)
			.toString()
			.padStart(2, '0');
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
		<button
			type="button"
			onclick={() => jump(-10)}
			aria-label="Go back 10 seconds"
			title="Back 10 seconds">↶ 10</button
		>
		<button type="button" class="play" onclick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
			{playing ? '❚❚' : '▶'}
		</button>
		<button
			type="button"
			onclick={() => jump(10)}
			aria-label="Go forward 10 seconds"
			title="Forward 10 seconds">10 ↷</button
		>
	</div>

	<input
		aria-label="Playback position"
		type="range"
		min="0"
		max="100"
		step="0.1"
		value={progress}
		oninput={seek}
		aria-valuetext={`${formatTime(current)} of ${formatTime(duration)}`}
		disabled={!Number.isFinite(duration) || duration <= 0}
	/>
	<div class="time"><span>{formatTime(current)}</span><span>{formatTime(duration)}</span></div>
	<p role="status">{status}</p>
</div>

<style>
	.audio-player {
		--player-ink: var(--text, #d5d4c5);
		--player-background: var(--prime, #052025);
		background: var(--player-background);
		color: var(--player-ink);
		padding: 1rem;
		border: 1px solid color-mix(in srgb, var(--player-ink) 30%, var(--player-background));
		border-radius: var(--radius);
		color-scheme: dark;
	}
	.buttons {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
	}
	button {
		min-width: 2.75rem;
		min-height: 2.75rem;
		padding: 0.5rem;
		border: 1px solid currentColor;
		border-radius: var(--radius);
		background: transparent;
		color: var(--player-ink);
		font: inherit;
		cursor: pointer;
	}
	button:hover {
		background: var(--player-ink);
		color: var(--player-background);
	}
	button:focus-visible,
	input:focus-visible {
		outline: 3px solid var(--player-ink);
		outline-offset: 4px;
	}
	.play {
		min-width: 4rem;
		min-height: 4rem;
		font-size: 2rem;
		line-height: 1;
	}
	input[type='range'] {
		appearance: none;
		display: block;
		width: 100%;
		height: 2.75rem;
		margin: 0.5rem 0 0;
		background: transparent;
		cursor: pointer;
	}
	input[type='range']::-webkit-slider-runnable-track {
		height: 0.375rem;
		border-radius: 1rem;
		background: var(--player-ink);
	}
	input[type='range']::-moz-range-track {
		height: 0.375rem;
		border-radius: 1rem;
		background: var(--player-ink);
	}
	input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 1.5rem;
		height: 1.5rem;
		margin-top: -0.5625rem;
		border: 3px solid var(--player-background);
		border-radius: 50%;
		background: var(--player-ink);
		box-shadow: 0 0 0 2px var(--player-ink);
	}
	input[type='range']::-moz-range-thumb {
		box-sizing: border-box;
		width: 1.5rem;
		height: 1.5rem;
		border: 3px solid var(--player-background);
		border-radius: 50%;
		background: var(--player-ink);
		box-shadow: 0 0 0 2px var(--player-ink);
	}
	input[type='range']:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.time {
		display: flex;
		justify-content: space-between;
		font-variant-numeric: tabular-nums;
	}
	p {
		margin: 0.5rem 0;
	}
	p:empty {
		margin: 0;
	}
</style>
