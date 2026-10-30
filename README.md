# it's serhii

Personal blog, built with [Astro](https://astro.build) and deployed to https://sserh1.github.io.

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
```

## Writing

- **Posts:** one Markdown file per post in `src/content/posts/`. The file name becomes the URL (`tiny-kv-store.md` → `/posts/tiny-kv-store/`).

  ```md
  ---
  title: Building a tiny key-value store
  date: 2026-10-14
  tags: [go, storage]
  draft: true   # optional: visible in `npm run dev` only
  ---
  ```

- **Books:** `src/content/books.md`, one `## Title` per book followed by a paragraph or two.
- **Home (about):** `src/content/about.md` is the root page. The body is the bio; an optional `now` list in the frontmatter renders below it. `elsewhere` becomes the contact icons in the footer: a value can be a URL, an email, or an `@handle` for `tg` / `x`. The post list lives at `/blog/`.

Code blocks are highlighted at build time; the colors live in `src/code-theme.mjs`. Design tokens and the guide lines are in `src/styles/global.css`.

## Deploy

Every push to `main` builds and publishes the site via `.github/workflows/deploy.yml`. One-time setup: the repository must be named `sserh1.github.io`, and **Settings → Pages → Source** must be set to **GitHub Actions**.
