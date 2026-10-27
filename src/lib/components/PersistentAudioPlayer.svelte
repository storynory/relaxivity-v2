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
	onended={() => playback.sync()}
	onerror={() => playback.fail()}
></audio>

{#if $playback.visible && $playback.track}
	<section class="player-bar" aria-label="Audio player" bind:clientHeight={height}>
		<div class="controls">
			<button type="button" onclick={() => playback.jump(-10)} aria-label="Go back 10 seconds">↶ 10</button>
			<button type="button" onclick={() => playback.toggle()} aria-label={$playback.playing ? 'Pause' : 'Play'}>
				{$playback.playing ? '❚❚' : '▶'}
			</button>
			<button type="button" onclick={() => playback.jump(10)} aria-label="Go forward 10 seconds">10 ↷</button>
		</div>
		<div class="episode">
			{#if $playback.track.artwork}<img class="track-artwork" src={$playback.track.artwork} alt="" />{/if}
			<a href={$playback.track.href}>{$playback.track.title}</a>
			<div class="timeline">
				<input type="range" aria-label="Playback position" min="0" max={$playback.duration || 1} step="0.1"
					value={$playback.current} disabled={$playback.duration <= 0}
					oninput={(event) => playback.seek(Number(event.currentTarget.value))}
					aria-valuetext={`${formatTime($playback.current)} of ${formatTime($playback.duration)}`} />
				<span>{formatTime($playback.current)} / {formatTime($playback.duration)}</span>
			</div>
			{#if $playback.status}<p role="status">{$playback.status}</p>{/if}
		</div>
		<button class="close" type="button" onclick={dismiss} aria-label="Pause and close audio player">×</button>
	</section>
{/if}

<style>
	.player-bar {
		position: fixed;
		inset: auto 0 0;
		z-index: 20;
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 1rem;
		padding: 0.65rem max(1rem, calc((100vw - var(--wide-width)) / 2)) calc(0.65rem + env(safe-area-inset-bottom));
		background: var(--prime);
		color: var(--text);
		border-top: 1px solid color-mix(in srgb, var(--text) 30%, var(--prime));
		box-shadow: 0 -0.25rem 1rem #0002;
		font: 1rem / 1.4 var(--font-body);
	}
	.controls { display: flex; gap: 0.35rem; }
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
	.close { font-size: 1.6rem; border-color: transparent; }
	.episode { min-width: 0; }
	.track-artwork { float: left; width: 48px; height: 48px; object-fit: cover; margin-right: 0.75rem; }
	.episode a { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.timeline { display: flex; align-items: center; gap: 0.75rem; }
	input { flex: 1; min-width: 0; height: 24px; margin: 0; accent-color: var(--accent); }
	.timeline span { white-space: nowrap; font-size: 0.8rem; font-variant-numeric: tabular-nums; }
	p { margin: 0.25rem 0 0; }
	@media (max-width: 520px) {
		.player-bar { gap: 0.4rem; grid-template-columns: minmax(0, 1fr) auto; }
		.controls { grid-column: 1; grid-row: 2; }
		.episode { grid-column: 1; grid-row: 1; }
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
