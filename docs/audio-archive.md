# Audio collection and archive

Audio episodes live in `content/audio/`, with the CMS schema in
`static/admin/collections/audio.yml`. The collection name is `audio`; the existing
`podcast` detail template and podcast RSS format remain unchanged. Episode slugs
and the `relaxivity:favourites:v1` saved-recording format are unchanged.

The archive starts at `/audio/`, followed by `/audio/page/2/`, and so on. It lists
ten published episodes per page, newest first, with deterministic slug ordering
for matching dates. Draft and future episodes are excluded before pagination.
Empty collections retain a first page; invalid or out-of-range pages return 404.

Each archive page is prerendered and has normal numbered, Previous and Next
links, its own canonical URL, and a sitemap entry. Pagination works without
JavaScript or query parameters. The order selector and automatic-next playback
apply to the recordings on the current archive page. My Playlist continues to
offer a saved list independent of archive pagination.

Feed discovery, episode links, search results and navigation use `/audio/`.
The collection moved before deployment, so no old podcast URL aliases are kept.

The utility bar appears only in the mobile layout (up to 48rem) and uses the
sprite's headphones, heart and search icons. Labels
are visually hidden below 32rem while remaining accessible to screen readers.
All toolbar links have at least 44px touch targets. A fourth such target fits
on phone screens; Login is not implemented. The main menu also includes Audio,
Playlist and Search with icons and visible text at all widths.
