#!/bin/sh
set -eu
export JEKYLL_ENV=production
node --test tests/*.test.mjs
node --check assets/js/portfolio.js
bundle exec jekyll build --trace
python3 scripts/verify_site.py
# Build separately so the production output always retains its root-relative URLs.
subpath_output=$(mktemp -d)
trap 'rm -rf "$subpath_output"' EXIT
bundle exec jekyll build --baseurl /preview --destination "$subpath_output"
python3 scripts/verify_site.py "$subpath_output" /preview
