# Persistent audio player

`AudioPlayerOriginal.svelte` is an exact copy of the standalone player before persistent playback was added (with the download link already removed).

The current `AudioPlayer.svelte` supplies episode-page controls. `PersistentAudioPlayer.svelte` owns the single audio element in the root layout. A controller created in the layout and passed through Svelte context keeps each rendered app independent. Navigation does not select or replace a track; only pressing Play does.

Closing the bar pauses playback and keeps the current position in memory. Returning to the episode and pressing Resume reopens it. Refreshing the browser or leaving the site ends this session.

To restore the standalone player:

1. In `src/lib/templates/Podcast.svelte`, change the AudioPlayer import to `#lib/components/AudioPlayerOriginal.svelte`.
2. In `src/routes/+layout.svelte`, remove the PersistentAudioPlayer import and component, playback/context imports and setup, playerHeight declaration and dynamic padding-bottom style.

The shared controller, replacement components and their tests can remain unused until you decide to remove them.
