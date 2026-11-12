# Abhishek’s portfolio

A personal portfolio for [abhishekmishra.dev](https://abhishekmishra.dev): engineering, writing, community, and a little of life away from the editor. Jekyll renders every link and page on the server. Small, dependency-free JavaScript adds filtering and a small, replayable AeroPress animation.

## Run

The hosting runtime is pinned to Ruby 3.3.13 in `.ruby-version` and `netlify.toml`. Use Bundler 4.0.11 and Node 22+ for tests. The site was also built locally with Ruby 4.0.5.

```sh
bundle config set --local path vendor/bundle
bundle install
bundle exec jekyll serve
```

The site is at `http://127.0.0.1:4000`. For a static build, run `bundle exec jekyll build`; output is `_site/`. The production URL remains in `_config.yml`. A deploy can use the existing static hosting pipeline; no application server or API keys are required.

## Add something to the index

Edit `_data/work.json`. Each entry has a unique `id`, a `kind` (`project`, `writing`, `event`, `community`, or `social`), `title`, `description`, `url`, `source`, and `context`. Optional `date` uses `YYYY-MM-DD`; use `year` when only the year is verified. `featured: true` selects projects and writing for the homepage, plus the first three featured events. Community and social entries remain in the full index; the homepage links to their profiles in prose. Ordering is curated, not automatically chronological.

Use original destinations and verify identity and attribution. See [content provenance](docs/content-sources.md). The owner-confirmed Instagram profile is configured through `instagram_url` in `_config.yml` and appears in both profile lists.

## Layout and behaviour

- `_layouts/home.html`: homepage sections.
- `_includes/desk.html`: articulated SVG AeroPress scene and its accessible brew button.
- `assets/css/portfolio.css`: responsive design, reduced-motion and print styles. Self-hosted Geist for reading and Caveat for handwritten notes (SIL Open Font licenses in `assets/fonts/`), with system fallbacks. No gradients.
- `assets/js/portfolio.js`: progressively enhanced controls. Without JS all index entries and navigation remain available.
- `assets/js/portfolio-core.mjs`: shared search logic.
- `assets/js/coffee-motion.mjs`: continuous brewing poses and the accessible animation controller.
- `_includes/name-lettering.html`: original pen-path name lettering.
- `about.md`, `archive.html`: biography and complete index.
- `_posts/`: original article content, with local permalinks and explicit external source links.

Search state is reflected in `?type=writing&q=python`. Nothing is stored in a browser database. The coffee illustration plays once on request, then offers replay. Reduced-motion users get the finished cup immediately, with a separate “Play full animation” opt-in; changing that preference during a brew completes it. The illustration stays visible without JavaScript. Social posts are regular links, with no tracking embeds or live-feed promises.

## Verify

```sh
node --test tests/*.test.mjs
node --check assets/js/portfolio.js
JEKYLL_ENV=production bundle exec jekyll build --trace
python3 scripts/verify_site.py
```

Netlify runs `sh scripts/ci.sh` before publishing: focused tests, production build, site verification, and a separate subpath build. The ready-to-install GitHub Actions workflow in `docs/verify-workflow.yml` also builds at `/preview` to catch broken subpath URLs. GitHub rejected installation because the connected credentials lack workflow-writing permission; it is not active CI. To enable it, copy that file to `.github/workflows/verify.yml` using credentials with that permission. Both root and subpath checks were run locally. Browser QA covers desktop/mobile layouts, index deep links and empty states, coffee completion/replay/keyboard use and reduced-motion behavior, navigation, and image loading. Public social destinations may require login; automated checks deliberately validate local routes rather than treating third-party access restrictions as broken content.

## Deployment

This branch is a reviewable rebuild. It does not change DNS or auto-deploy the custom domain. Netlify uses the checked-in build configuration. Other static hosts should select Ruby 3.3.13, install the locked gems, run `bundle exec jekyll build`, and publish `_site`. An explicit `RUBY_VERSION` in a hosting dashboard may override `.ruby-version` and must agree with the repository pin. A separate owner-private Sites preview is built from the same source; its hosting identity is kept outside this public repository.

The original Klisé source and its MIT license are retained. The new layout is a coffee journal with restrained handwritten annotations. The brewing scene is an original articulated SVG drawing with continuous joint motion. The name is custom SVG pen lettering, with accessible text retained. The previous generated flipbook is retained only as source history; provenance is in `docs/illustration-notes.md`.

## Personal photos

Add approved images to `assets/portfolio/photos/` and add entries to `_data/photos.json`: `src`, descriptive `alt`, a short factual `caption`, and the image’s intrinsic `width` and `height`. The About page renders those as staggered, tilted prints. It currently contains only the existing portrait; further personal photographs await the owner’s upload. No stock photos are presented as personal memories.
