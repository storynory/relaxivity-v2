# Image pipeline choices

## Site logo, favicons and web app manifest

Select a local image in **Settings → Site Logo** (currently `/uploads/site-logo-relaxivity.jpg`), then run:

```sh
npm run manifest
```

This generates `static/site.webmanifest` and these PNG files in `static/app-icons/`:

- Favicons: 16, 32 and 48 pixels square.
- Apple touch icon: 180 pixels square.
- App icons: 192 and 512 pixels square, with separate padded maskable versions.

The manifest uses the site name, description and language from Site Settings, and the active colour scheme's primary colour for its background and theme. These files are linked automatically in the page head. Maskable icons keep the complete image within the circular safe zone; non-square logos are contained rather than cropped. See the [manifest specification](https://www.w3.org/TR/appmanifest/#icon-masks) and [Apple touch icon documentation](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html).

The command also runs the existing responsive image pipeline. The header displays its logo in a **3rem (normally 48px) square**, and advertises that size to the browser. Small **96px and 192px WebP variants** support retina/high-density screens without fetching the 2048px source. Dimensions reserve space before loading; the logo loads eagerly. These small widths are also available to other responsive images. Browsers choose a variant using screen density and zoom; the JPEG fallback remains available.

To replace the logo, upload the replacement, select it in Site Settings, and rerun `npm run manifest`. Replacing the file at the same path also works. Use a square source of at least **512 × 512** pixels, ideally 1024 × 1024 or larger. PNG, JPEG and WebP work with both pipelines. Sources stay untouched.

`npm run dev` and `npm run build` run this automatically, so generated icons and the web manifest are ignored by Git. Restart the dev server or rerun the command after changing a logo or the related settings. Browser and installed-app icon caches can take time to refresh. The manifest enables standalone presentation where supported; it does not add offline functionality or a service worker.

## General image processing

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
