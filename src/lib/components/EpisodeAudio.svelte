<script lang="ts">
	import { page } from '$app/state';
	import type { publicAudio } from '#lib/audio/availability.ts';
	import AudioPlayer from './AudioPlayer.svelte';
	import FavouriteButton from './FavouriteButton.svelte';
	import type { Track } from '#lib/audio/playback.ts';

	let { audio, title, href, slug, artwork = '', queue = [], contextId = '' }: {
		audio: ReturnType<typeof publicAudio>; title: string; href: string; slug: string; artwork?: string; queue?: Track[]; contextId?: string;
	} = $props();
</script>

<div class="episode-audio">
	<FavouriteButton {slug} {title} />
	<p><strong>{audio.canPlayFullAudio ? 'Full Story · Free' : 'Audio Sample'}</strong></p>
	{#if audio.src}
		<AudioPlayer src={audio.src} title={audio.playbackType === 'sample' ? `${title} — Audio Sample` : title}
			{href} {artwork} {queue} {contextId} duration={audio.duration} />
	{:else}
		<p>{audio.canPlayFullAudio ? 'Audio is unavailable for this story.' : "An audio sample isn't available for this story yet."}</p>
	{/if}
	{#if !audio.canPlayFullAudio}
		<p>Listen to a short sample. The complete story is available with a Relaxivity subscription.</p>
		{#if page.data.supercastUrl}
			<p><a href={page.data.supercastUrl}>Listen to the full story on Supercast</a></p>
		{:else}
			<p>Full access to the Relaxivity archive is coming soon.</p>
		{/if}
	{/if}
</div>

<style>
	.episode-audio { margin-block: 1.25rem; }
	p { margin-block: 0.75rem; }
	a { color: var(--accent); text-underline-offset: 0.2em; }
</style>
