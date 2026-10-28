<script lang="ts">
	import { getContext } from 'svelte';
	import { playbackKey, type Playback } from '#lib/audio/playback.ts';
	const playback = getContext<Playback>(playbackKey);
</script>

<label>
	<input type="checkbox" role="switch" checked={$playback.autoAdvance}
		onchange={(event) => playback.setAutoAdvance(event.currentTarget.checked)} />
	<span>Play next story automatically</span>
</label>

<style>
	label { display: inline-flex; align-items: center; gap: 0.6em; min-height: 44px; cursor: pointer; font-size: 0.9em; }
	input { appearance: none; flex-shrink: 0; width: 2.5em; height: 1.4em; margin: 0; padding: 0.15em; border: 1px solid currentColor; border-radius: 1em; background: transparent; color: inherit; cursor: pointer; }
	input::before { content: ''; display: block; width: 0.95em; height: 0.95em; border-radius: 50%; background: currentColor; }
	input:checked { background: var(--accent); color: var(--prime); border-color: var(--accent); }
	input:checked::before { margin-left: auto; }
</style>
