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

- `_layouts/home.html`: homepage sections and accessible name heading.
- `_includes/name-lettering.html`: original pen-path name lettering, the only handwritten treatment.
- `_includes/desk.html`: approved personalized four-frame server-and-pour illustration and accessible brew button.
- `assets/css/portfolio.css`: white background, black/gray type, responsive layouts, reduced-motion and print styles. Self-hosted Geist for reading; no gradients. Artwork and photos are presented in grayscale with original source files preserved.
- `assets/js/portfolio.js`: progressively enhanced index and finite server-and-pour coffee sequence.
- `assets/js/portfolio-core.mjs`: shared search logic.

Search state is reflected in `?type=writing&q=python`. Nothing is stored in a browser database. The coffee illustration plays once on request, then offers replay. Reduced-motion users advance through still poses on each click; “Another cup?” returns to the first pose. Enabling reduced motion during playback cancels timers and preserves the current pose. The illustration stays visible without JavaScript. Social posts are regular links, with no tracking embeds or live-feed promises.

## Verify

```sh
node --test tests/*.test.mjs
node --check assets/js/portfolio.js
node --check assets/js/photo-viewer.js
JEKYLL_ENV=production bundle exec jekyll build --trace
python3 scripts/verify_site.py
```

Netlify runs `sh scripts/ci.sh` before publishing: focused tests, production build, site verification, and a separate subpath build. The ready-to-install GitHub Actions workflow in `docs/verify-workflow.yml` also builds at `/preview` to catch broken subpath URLs. GitHub rejected installation because the connected credentials lack workflow-writing permission; it is not active CI. To enable it, copy that file to `.github/workflows/verify.yml` using credentials with that permission. Both root and subpath checks were run locally. Browser QA covers desktop/mobile layouts, index deep links and empty states, coffee completion/replay/keyboard use and reduced-motion behavior, navigation, and image loading. Public social destinations may require login; automated checks deliberately validate local routes rather than treating third-party access restrictions as broken content.

## Deployment

This branch is a reviewable rebuild. It does not change DNS or auto-deploy the custom domain. Netlify uses the checked-in build configuration. Other static hosts should select Ruby 3.3.13, install the locked gems, run `bundle exec jekyll build`, and publish `_site`. An explicit `RUBY_VERSION` in a hosting dashboard may override `.ruby-version` and must agree with the repository pin. A separate owner-private Sites preview is built from the same source; its hosting identity is kept outside this public repository.

The original Klisé source and its MIT license are retained. The current design uses the owner-approved personalized B illustration: press into a server, pour into a mug, then sip. Custom name lettering, “Hello from” and its curved arrow are unchanged. LinkedIn is the primary contact; the alternative address is obfuscated plain text. The articulated-character experiment and stray-bean Easter egg remain local and are not included. Illustration provenance is in `docs/illustration-notes.md`.

## Personal photos

The About page has eleven selected owner-supplied photographs in three groups: `intro`, `community`, and `life`. Tilted, monochrome prints open a keyboard-accessible viewer with original-colour enlarged copies. Without JavaScript, each print remains a normal link to its image. The viewer supports previous/next, arrow keys, Escape, focus return, and an image-load fallback.

Add web-sized images to `assets/portfolio/photos/` and entries to `_data/photos.json`: unique `id`, `group`, thumbnail `src`, enlarged `full`, descriptive `alt`, factual `caption`, and thumbnail `width`/`height`. Keep the intro group to one image. Auto-orient, proportionally resize, and strip metadata before publishing; do not add raw originals or reference-only images. The initial selection and source filenames are documented in `docs/photo-sources.md`. Gallery images are lazy-loaded; larger copies load on demand. No automatic marquee motion.
