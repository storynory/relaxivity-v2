<script lang="ts">
	import { getContext } from 'svelte';
	import { page } from '$app/state';
	import { formatTime, playbackKey, type Playback } from '#lib/audio/playback.ts';
	let { src, title = 'Audio' }: { src: string; title?: string } = $props();
	const playback = getContext<Playback>(playbackKey);
	const active = $derived($playback.track?.src === src);
	function toggle(event: MouseEvent) {
		if (active && $playback.playing) playback.pause();
		else playback.start({ src, title, href: page.url.pathname }, event.currentTarget as HTMLButtonElement);
	}
</script>

<div class="audio-player" role="group" aria-label={title}>
	<button type="button" onclick={toggle} aria-label={active && $playback.playing ? `Pause ${title}` : `Play ${title}`}>
		{active && $playback.playing ? '❚❚ Pause' : active && $playback.current > 0 ? '▶ Resume' : '▶ Play'}
	</button>
	{#if active}
		<span>{formatTime($playback.current)} / {formatTime($playback.duration)}</span>
	{/if}
	<p role="status">{active ? $playback.status : ''}</p>
</div>

<style>
	.audio-player { display: flex; align-items: center; flex-wrap: wrap; gap: 0.75rem 1rem; }
	button {
		min-height: 48px;
		padding: 0.65em 1.25em;
		border: 1px solid var(--text);
		border-radius: var(--radius);
		background: var(--text);
		color: var(--prime);
		font: inherit;
		cursor: pointer;
	}
	button:hover { background: var(--prime); color: var(--text); }
	span { font-size: 0.85em; font-variant-numeric: tabular-nums; }
	p { flex-basis: 100%; margin: 0; }
	p:empty { display: none; }
</style>
