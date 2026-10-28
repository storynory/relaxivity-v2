# Favourites and playlist playback

Listeners can save episodes from story pages, episode listings and podcast blocks.
The Favourites page at `/favourites/` lists saved stories in their chosen order.
Earlier/Later buttons change that order. Stories use the same Play/Pause/Resume
control as elsewhere on the site. When Play next story automatically is on,
starting any favourite queues that story and the favourites after it. When the
switch is off, starting a favourite plays only that story. There is no separate
playlist Play action.

Podcasts, category, tag and Favourites pages offer newest first, oldest first,
and title order. Favourites defaults to My order, which keeps the listener's
saved arrangement; Earlier/Later controls appear in that mode. Other sort
choices do not overwrite that arrangement. Order choices apply to the current
view. Changing order updates an active queue from the same list without
restarting the current story. Sorting another list leaves playback alone.

Favourites are saved as episode slugs in `relaxivity:favourites:v1` in localStorage.
They belong to the current browser and are not synced between devices. Clearing
site data removes them. Renaming a slug leaves an unavailable entry that the
listener can remove. When storage is blocked, favourites work for the current
visit and a notice explains the limitation. Storage events sync favourites
between open tabs, but tabs do not control each other's audio.

Play next story automatically appears at the top of the Favourites page and
defaults to on. The same switch and preference are used by podcast, tag and
category listings. Its setting is stored separately
in `relaxivity:auto-advance:v1`. Turning it off during an existing queue stops
playback at the end of the current story; manual previous/next buttons still
work for that queue. Playback always stops
at the end of the playlist. Reloading a page does not automatically start audio.

The existing root-layout audio element remains mounted during navigation.
`createPlayback().startQueue(tracks, index, trigger, name, contextId)` takes a
snapshot of any ordered list of playable `Track` records. Category, tag and
podcast listings use the same API. Favourites edits do not modify an active queue;
starting or resuming from the favourites list uses the updated order. The shared
`AudioPlayer` accepts an optional queue and uses it only when automatic-next is
on. Each list supplies its route as a playback context; choosing a story from a
different list replaces the queue, even if the current story appears in both.
Browsing without pressing Play leaves audio running. Individual episode pages
still play a single story.

The floating player keeps the artwork and episode name, with a full-width seek
bar and separate elapsed/total times. On smaller screens the transport buttons
have their own centred row. The automatic-next switch stays in page content,
and queue position text is omitted from the player.

The favourites route uses the same publication and full-story/sample selection
as the rest of the site. Missing audio is omitted from playback; samples remain
labelled as samples. A playback failure stops with a recoverable player message
rather than repeatedly attempting the next story.
