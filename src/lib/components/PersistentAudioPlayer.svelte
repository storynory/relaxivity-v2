<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { formatTime, playbackKey, type Playback } from '#lib/audio/playback.ts';
	let { height = $bindable(0) }: { height?: number } = $props();
	const playback = getContext<Playback>(playbackKey);
	let audio: HTMLAudioElement;
	onMount(() => playback.attach(audio));
	function dismiss() {
		const origin = playback.dismiss();
		const target = origin ?? document.querySelector<HTMLElement>('main');
		if (target && !origin) target.setAttribute('tabindex', '-1');
		target?.focus({ preventScroll: true });
	}
</script>

<!-- This element stays mounted even when the bar is dismissed or the route changes. -->
<audio
	bind:this={audio}
	preload="none"
	onloadedmetadata={() => playback.sync()}
	ondurationchange={() => playback.sync()}
	ontimeupdate={() => playback.sync()}
	onplay={() => playback.sync()}
	onpause={() => playback.sync()}
	onended={() => playback.ended()}
	onerror={() => playback.fail()}
></audio>

{#if $playback.visible && $playback.track}
	<section class="player-bar" aria-label="Audio player" bind:clientHeight={height}>
		<div class="episode">
			{#if $playback.track.artwork}<img class="track-artwork" src={$playback.track.artwork} alt="" />{/if}
			<a href={$playback.track.href}>{$playback.track.title}</a>
		</div>
		<button class="close" type="button" onclick={dismiss} aria-label="Pause and close audio player">×</button>
		<div class="timeline">
			<input type="range" aria-label="Playback position" min="0" max={$playback.duration || 1} step="0.1"
				value={$playback.current} disabled={$playback.duration <= 0}
				oninput={(event) => playback.seek(Number(event.currentTarget.value))}
				aria-valuetext={`${formatTime($playback.current)} of ${formatTime($playback.duration)}`} />
			<span>{formatTime($playback.current)}</span>
			<span class="duration">{formatTime($playback.duration)}</span>
		</div>
		<div class="controls">
			{#if $playback.queue.length}
				<button type="button" onclick={() => playback.previous()} disabled={$playback.queueIndex <= 0} aria-label="Previous story">⏮</button>
			{/if}
			<button type="button" onclick={() => playback.jump(-10)} aria-label="Go back 10 seconds">↶ 10</button>
			<button class="play-toggle" type="button" onclick={() => playback.toggle()} aria-label={$playback.playing ? 'Pause' : 'Play'}>
				{$playback.playing ? '❚❚' : '▶'}
			</button>
			<button type="button" onclick={() => playback.jump(10)} aria-label="Go forward 10 seconds">10 ↷</button>
			{#if $playback.queue.length}
				<button type="button" onclick={() => playback.next()} disabled={$playback.queueIndex >= $playback.queue.length - 1} aria-label="Next story">⏭</button>
			{/if}
		</div>
		{#if $playback.status}<p class="status" role="status">{$playback.status}</p>{/if}
	</section>
{/if}

<style>
	.player-bar {
		position: fixed;
		inset: auto 0 0;
		z-index: 20;
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		align-items: center;
		gap: 0.5rem 1rem;
		padding: 0.65rem max(1rem, calc((100vw - var(--wide-width)) / 2)) calc(0.65rem + env(safe-area-inset-bottom));
		background: var(--prime);
		color: var(--text);
		border-top: 1px solid color-mix(in srgb, var(--text) 30%, var(--prime));
		box-shadow: 0 -0.25rem 1rem #0002;
		font: 1rem / 1.4 var(--font-body);
	}
	.controls { grid-column: 2; grid-row: 1; display: flex; align-items: center; justify-content: center; gap: 0.35rem; }
	button {
		min-width: 44px;
		min-height: 44px;
		padding: 0.4rem;
		border: 1px solid color-mix(in srgb, var(--text) 40%, var(--prime));
		border-radius: 0.4rem;
		background: transparent;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}
	button:hover { color: var(--prime); background: var(--text); }
	button:disabled { opacity: 0.4; cursor: default; }
	.play-toggle { width: 52px; height: 52px; border-radius: 50%; }
	.close { grid-column: 3; grid-row: 1; font-size: 1.6rem; border-color: transparent; }
	.episode { grid-column: 1; grid-row: 1; min-width: 0; display: flex; align-items: center; gap: 0.75rem; }
	.track-artwork { flex: 0 0 48px; width: 48px; height: 48px; object-fit: cover; }
	.episode a { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.timeline { grid-column: 1 / -1; grid-row: 2; display: grid; grid-template-columns: 1fr 1fr; }
	input[type="range"] { grid-column: 1 / -1; width: 100%; min-width: 0; height: 24px; margin: 0; accent-color: var(--accent); }
	.timeline span { white-space: nowrap; font-size: 0.75rem; font-variant-numeric: tabular-nums; }
	.duration { text-align: right; }
	.status { grid-column: 1 / -1; margin: 0; font-size: 0.85rem; }
	@media (max-width: 48rem) {
		.player-bar { gap: 0.4rem; grid-template-columns: minmax(0, 1fr) auto; }
		.controls { grid-column: 1 / -1; grid-row: 3; }
		.close {
			grid-column: 2;
			grid-row: 1;
			align-self: start;
			display: grid;
			place-items: center;
			width: 44px;
			height: 44px;
			padding: 0;
			border-radius: 50%;
			border-color: color-mix(in srgb, var(--text) 25%, var(--prime));
			line-height: 1;
		}
	}
</style>
