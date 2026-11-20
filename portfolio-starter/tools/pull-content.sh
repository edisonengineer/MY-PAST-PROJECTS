#!/usr/bin/env bash
# Downloads only the content files the portfolio needs from the main site repo into _source/.
# The main repo is public, so no token is needed.
set -euo pipefail
cd "$(dirname "$0")/.."
REPO=$(node -p "require('./portfolio.config.json').sourceRepo")
BRANCH=$(node -p "require('./portfolio.config.json').sourceBranch || 'main'")
rm -rf _source
git clone --quiet --depth 1 --branch "$BRANCH" --filter=blob:none --sparse "https://github.com/$REPO.git" _source
git -C _source sparse-checkout set --no-cone \
  /content/cv.js /js/projects.js /js/sheet-works.js /js/certificates.js /js/sheet-data.js /js/config.js \
  '/images/engineering/' '/images/graphic/' '/images/works/' '/images/certificates/' '/images/profile/' \
  '/models/' '/pdfs/edison-ochieng-cv.pdf' '/pdfs/*report*.pdf' '/fonts/' /favicon.svg /favicon.ico
echo "Pulled $(git -C _source rev-parse --short HEAD) from $REPO"
