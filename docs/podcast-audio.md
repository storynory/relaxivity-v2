# Podcast audio on R2

Set **Site Settings → General Settings → Podcast Feed → Audio base URL** to
`https://audio.relaxivity.app/`. Save episode audio as a relative URL path, such
as `episodes/story.mp3`. Existing full HTTP(S) URLs still work; RSS continues
to require HTTPS. No existing episode paths are migrated automatically.

The player and RSS use the same URL resolver. The existing Sveltia `preSave`
hook resolves relative paths using `/admin/podcast-settings.json`, prerendered
from the podcast settings. Rebuild/deploy after changing the base URL, then
save episodes. This endpoint contains only the public audio base URL.

Saving still detects duration automatically, including the existing retry.
When Audio File Length is empty or invalid, the hook requests HEAD and uses
the positive integer `Content-Length` as the byte count. If unavailable, the
length is left unchanged and can be entered manually; no size is estimated.
Existing positive byte counts are preserved, including manual corrections.
Clear Audio File Length when replacing an audio file or to replace an old
estimate with the exact R2 size. Duration failures preserve the previous value.

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
