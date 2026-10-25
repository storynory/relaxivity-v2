# Image pipeline choices

Edit `scripts/images/config.json` and set `provider`:

- `"sharp"` (default): produce responsive WebP files, optional AVIF and fallbacks; use the generated image manifest.
- `"original"`: skip Sharp, clear the generated manifest, and use the original image URLs. This works with hand-optimised static files, **Sveltia's browser-side WebP upload conversion**, or **Cloudflare Polish**, which optimises existing URLs at the edge.

Both featured and Markdown images use the manifest, so no template changes are required when switching these two modes. After changing the provider, rerun `npm run images` or restart the dev server. The image source files remain untouched.

For Sveltia upload-time WebP conversion, add this to `static/admin/config.yml` (optional; this changes uploads before they enter Git):

```yaml
media_libraries:
  all:
    transformations:
      raster_image:
        format: webp
        quality: 85
        width: 2048
        height: 2048
```

Cloudflare Polish does not require markup or URL rewriting, but must be enabled on a compatible Cloudflare plan. It compresses images without creating responsive sizes. Cloudflare **Images transformations** are a distinct service that can resize via URLs; that would need a dedicated provider implementation. Avoid running multiple lossy compressors unnecessarily.

## Loading priority

The `Picture.svelte` component accepts `priority="high"` for a critical above-the-fold image; otherwise it defaults to lazy loading. It also supports explicit `loading` and `fetchpriority` props.

In Markdown, use the image title `"priority=high"` to request eager loading and high fetch priority:

```md
![An important picture](/uploads/hero.jpg "priority=high")
```

Other Markdown images remain lazy, and ordinary Markdown image titles remain intact. Use high priority sparingly, ideally for a single likely LCP image. Future custom templates can decide their own priorities and responsive `sizes` settings.
