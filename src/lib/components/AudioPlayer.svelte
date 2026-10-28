<script lang="ts">
	import { getContext } from 'svelte';
	import { page } from '$app/state';
	import { formatTime, playbackKey, type Playback, type Track } from '#lib/audio/playback.ts';
	let { src, title = 'Audio', href, artwork = '', duration = '', queue = [], contextId = '' }: {
		src: string; title?: string; href?: string; artwork?: string; duration?: string; queue?: Track[]; contextId?: string;
	} = $props();
	const playback = getContext<Playback>(playbackKey);
	const active = $derived($playback.track?.src === src && $playback.contextId === contextId);
	function toggle(event: MouseEvent) {
		if (active && $playback.playing) playback.pause();
		else {
			const track = { src, title, href: href ?? page.url.pathname, artwork, duration };
			const index = queue.findIndex((item) => item.src === src && item.href === track.href);
			const trigger = event.currentTarget as HTMLButtonElement;
			if ($playback.autoAdvance && index >= 0) playback.startQueue(queue, index, trigger, 'Playlist', contextId);
			else playback.start(track, trigger, contextId);
		}
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
