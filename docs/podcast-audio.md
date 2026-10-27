# Podcast audio on R2

Set **Site Settings → General Settings → Podcast Feed → Audio base URL** to
`https://audio.relaxivity.app/`. Save episode audio as a relative URL path, such
as `episodes/story.mp3`. Existing full HTTP(S) URLs still work; RSS continues
to require HTTPS. No existing episode paths are migrated automatically.

The player and RSS use the same URL resolver. The existing Sveltia `preSave`
hook resolves relative paths using `/admin/podcast-settings.json`, prerendered
from the podcast settings. Rebuild/deploy after changing the base URL, then
save episodes. This endpoint contains only the public audio base URL.

The complete recording retains `audio`, `length` and `duration`. The optional
short preview uses independent `sampleAudio`, `sampleLength` and
`sampleDuration` fields. Both paths accept relative R2 paths or full HTTP(S)
URLs and use the same base URL. Existing episodes need no migration.

Saving detects missing or invalid durations automatically using the existing
browser audio element and retry. Valid MM:SS or HH:MM:SS values are preserved.
When either file size is empty or invalid, the hook requests HEAD and uses the
positive safe integer `Content-Length` as that recording's exact byte count.
Valid metadata causes no media requests; relative paths share one settings
request per save when metadata is needed.

Clear the corresponding **Full Story File Size / Full Story Duration** or
**Sample File Size / Sample Duration** when replacing a recording. Positive
byte counts and valid durations, including manual corrections, are preserved
until cleared. Missing files, failed settings requests, unavailable headers,
CORS errors and duration failures leave existing values unchanged and do not
block saving or metadata retrieval for the other recording. No size is estimated.
Duration still depends on browser media support and the remote host, and can
be edited manually if detection fails. Each failed duration attempt can take
25 seconds (two attempts); HEAD and settings requests each time out after
10 seconds, as in the existing integration.

**Keep Full Story Permanently Free** (`permanentlyFree`) is optional and defaults
to false in the CMS. **Site Settings → General Settings → Supercast Subscription
URL** (`supercastUrl`) is also optional. These fields only store editorial
configuration in this change; availability rules and subscription buttons are
not implemented. The persistent player and RSS continue to use the full audio.

## Cloudflare CORS

In the R2 bucket's **Settings → CORS policy**, allow the origins where the CMS
runs and allow GET and HEAD. For example:

```json
[
  {
    "AllowedOrigins": ["https://relaxivity.app", "http://localhost:5173"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["Range"],
    "ExposeHeaders": ["Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

Add any actual www, preview or admin origins (origins contain no URL path).
`Content-Length` is normally a CORS safelisted response header; explicitly
exposing it is harmless, but does not fix a missing allowed origin. The public
custom domain must return successful HEAD responses with `Content-Length`
and the appropriate `Access-Control-Allow-Origin` header. After changing CORS,
purge cached objects on `audio.relaxivity.app` so old responses do not mask the
new headers. Browser playback alone does not prove HEAD is accessible.

Check a real object with an Origin header:

```sh
curl -I -H 'Origin: https://relaxivity.app' https://audio.relaxivity.app/episodes/story.mp3
```

See [Cloudflare's R2 CORS documentation](https://developers.cloudflare.com/r2/buckets/cors/).
