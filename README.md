# Sveltia Starter Project

## Simple API

Gives use three get functions:

getAll('posts') — retrieve every post.

getOne('posts', slug) — retrieve one post, including its author, category and tags.

getSettings() — retrieve site settings, including the selected colour scheme.

## Collection archives

A folder collection with `public_route: true` automatically gets its archive,
individual pages, sitemap entries and search-index records. Choose existing
`template` and `list_template` values, or omit them to use the default templates.
Draft records are excluded from public listings, pages and search.

Archive copy belongs in the collection's existing YAML configuration:

```yaml
collections:
  - name: notes
    label: Field Notes
    label_singular: Note
    public_route: true
    folder: content/notes
    template: post
    archive:
      title: Our Field Notes
      introduction: Discover notes from our travels.
      seo:
        title: Explore Our Field Notes
        description: Read notes from our travels around the world.
        image: /uploads/field-notes.jpg
    fields:
      - { name: title, widget: string }
      - { name: body, widget: richtext }
```

The entire `archive` section is optional. The heading defaults to `label`, then
`name`. The SEO title defaults to the heading; its description defaults to the
plain-text introduction, then the site description. Its image falls back to the
site's default image. `archive.title` lets the public heading differ from the CMS
label. Individual records retain their existing SEO fields and fallbacks.

Run `npm run dev` or `npm run build` after editing configuration to regenerate
the definitions. Existing audio pagination and playback remain specialised;
later audio pages append `Page N` to the configured archive title and retain
their automatic story-example descriptions. No general pagination system is added.

`npm test` includes an isolated production-build acceptance test that adds only
YAML definitions and content, checks archive/detail HTML and SEO, and verifies
that public records appear in search while drafts and private collections do not.

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@1.1.1 create --template minimal --types ts --add eslint prettier --install npm .
```

## Adding features

Add features to your project with `sv add`:

```sh
npx sv add
```

For example, to add Tailwind CSS:

```sh
npx sv add tailwindcss
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
