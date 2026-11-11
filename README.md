# Abhishek’s workbench

A personal portfolio for [abhishekmishra.dev](https://abhishekmishra.dev): engineering, writing, community, and a little of life away from the editor. Jekyll renders every link and page on the server. Small, dependency-free JavaScript adds filtering, a coffee-break timer, and a playful brick stack.

## Run

Use Ruby 3.3 or newer, Bundler 4.0.11, and Node 22+ for tests.

```sh
bundle config set --local path vendor/bundle
bundle install
bundle exec jekyll serve
```

The site is at `http://127.0.0.1:4000`. For a static build, run `bundle exec jekyll build`; output is `_site/`. The production URL remains in `_config.yml`. A deploy can use the existing static hosting pipeline; no application server or API keys are required.

## Add something to the index

Edit `_data/work.json`. Each entry has a unique `id`, a `kind` (`project`, `writing`, `event`, `community`, or `social`), `title`, `description`, `url`, `source`, and `context`. Optional `date` uses `YYYY-MM-DD`; use `year` when only the year is verified. `featured: true` includes an entry in its homepage section. Featured projects also have an `icon` (`wave`, `link`, `terminal`). Ordering is curated, not automatically chronological.

Use original destinations and verify identity and attribution. See [content provenance](docs/content-sources.md). For Instagram, set `instagram_url` in `_config.yml` after the account is confirmed; it appears in both profile lists. No handle is guessed.

## Layout and behaviour

- `_layouts/home.html`: homepage sections.
- `_includes/desk.html`: original vector desk drawing and timer dialog.
- `assets/css/portfolio.css`: responsive design, reduced-motion and print styles. No external fonts or gradients.
- `assets/js/portfolio.js`: progressively enhanced controls. Without JS all index entries and navigation remain available.
- `assets/js/portfolio-core.mjs`: shared search and timer logic.
- `about.md`, `archive.html`: biography and complete index.
- `_posts/`: original article content, with local permalinks and explicit external source links.

Search state is reflected in `?type=writing&q=python`. Nothing is stored in a browser database. The timer is a local, silent two-minute countdown. Closing its dialog pauses it; hidden-tab timing uses a wall-clock deadline. Social posts are regular links, with no tracking embeds or live-feed promises.

## Verify

```sh
node --test tests/portfolio.test.mjs
node --check assets/js/portfolio.js
JEKYLL_ENV=production bundle exec jekyll build --trace
python3 scripts/verify_site.py
```

The ready-to-install workflow in `docs/verify-workflow.yml` also builds at `/preview` to catch broken subpath URLs. GitHub rejected installation because the connected credentials lack workflow-writing permission; it is not active CI. To enable it, copy that file to `.github/workflows/verify.yml` using credentials with that permission. Both root and subpath checks were run locally. Browser QA covers desktop/mobile layouts, index deep links and empty states, timer start/pause/reset/close/completion, brick controls, navigation, and image loading. Public social destinations may require login; automated checks deliberately validate local routes rather than treating third-party access restrictions as broken content.

## Deployment

This branch is a reviewable rebuild. It does not change DNS or auto-deploy the custom domain. Existing static hosting should build with the locked gems, run `bundle exec jekyll build`, and publish `_site`. A separate owner-private Sites preview is built from the same source; its hosting identity is kept outside this public repository.

The original Klisé source and its MIT license are retained. The new layout and illustration are custom to this portfolio.
