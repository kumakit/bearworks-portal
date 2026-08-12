# Issue #372 Gate 5 Portal walkthrough

## Outcome

The Portal article is published and accepted in production. The implementation branch and `main` contain commit `75f94901118db807bee8afb3489ae230d27f6c0c`, Linux clean-checkout CI passed, Workers deployment completed, and the public route passed HTTP plus desktop/mobile browser acceptance.

## Data handoff

- Apps production commit: `6d543851a69833d01999975d85b20d94340c9fab`
- Publication bundle: `hachioji-climate-2026-08-11.r1.json`
- Bundle version/schema: `2026-08-11.r1` / `1.0.0`
- Byte size: `405549`
- SHA-256: `8992cb17df3dabb3f56b359c097dbb817e4a744e40f43a502ae2896fb9c817dd`

The Portal vendors the exact production bundle. A separate lock file pins its byte contract and source commit. The validator reads raw bytes and stops the build/publish commands if the size, hash, version, schema, station set, H1-H5 results, quality counts, or displayed recent aggregates differ.

## Implementation

- Added the static monetized route `/labs/hachioji-climate`.
- Added canonical and Article JSON-LD metadata.
- Added the route to the sitemap, header, footer, and home page.
- Derived the 2020-2025 comparison table directly from the fixed bundle.
- Documented definitions, quality codes 5/8, 90% coverage, homogeneity boundaries, attribution, limits, and AI/human roles.
- Added the validator to `build`, `cf:build`, `preview`, `deploy`, and `upload`.
- Added Workers CI assertions for the route, hash, canonical, sitemap, AdSense, and advertisement-free invalid route.
- Added LF attributes for the byte-hashed JSON and validator.

## Luna audit adopted

Luna independently confirmed the minimum route/snapshot/lock structure, fail-closed validation requirements, Workers checks, and the conflict between the Issue completion wording and the production bundle.

All five preregistered hypotheses are `supported` with publication permission `caution`. The article states that no preregistered contradiction was observed. It separately explains that the broader belief that Hachioji is the coldest place in Tama is not supported by this four-station comparison because Ome has more winter days. No unexpected preregistered result is fabricated.

## Verification

### Local

- `npm run validate:hachioji-climate`: pass.
- `npm run lint`: pass with four pre-existing warnings and no errors.
- `npm run build`: pass; route generated as static content.
- `npm run cf:build`: pass on Windows with the upstream compatibility warning.
- `npx wrangler deploy --dry-run --env=""`: pass.
- `npx wrangler deploy --dry-run --env staging`: pass.

### GitHub and Linux

- Portal implementation commit: `75f94901118db807bee8afb3489ae230d27f6c0c`.
- Issue branch push: pass; the remote branch matched the local commit.
- Linux clean-checkout Workers CI: pass in [run 31603872907](https://github.com/kumakit/bearworks-portal/actions/runs/31603872907).
- The existing GitHub Pages workflow also completed successfully after the `main` push in [run 31605003965](https://github.com/kumakit/bearworks-portal/actions/runs/31605003965). Its legacy Jekyll output is separate from the production Workers route.

### Production

- Apps source application: <https://apps.bearworks.uk/Hachioji_Climate>.
- Portal article: <https://bearworks.uk/labs/hachioji-climate>.
- Article, canonical, full bundle hash, sitemap entry, robots.txt, and ads.txt: pass.
- AdSense boundary: present on the home and article routes; absent from the tested non-monetized and invalid routes.
- Dashboard API baseline: Cloudflare Access sign-in HTML returned; protected data was not exposed.
- Browser desktop: title, H1-H5 cards, 4-row table, source app link, canonical, and full bundle hash present; no page-level horizontal overflow.
- Browser mobile (390 x 844): no page-level horizontal overflow; comparison table scrolls inside its own container.

### Search Console

Google Search Console URL Inspection was checked on 2026-08-12. At that time the article URL was not registered in Google, was not known to Google, had not been crawled, and had no detected referring sitemap. The public sitemap already contains the article URL. An indexing request was accepted into Google's priority crawl queue; later indexing confirmation is separated into [`kumakit/mission-control#376`](https://github.com/kumakit/mission-control/issues/376).

## Completion decision

The user explicitly accepted the completion interpretation on 2026-08-12: no contradiction is invented among preregistered H1-H5, while the broader initial expectation about Hachioji being the coldest place in Tama is treated as the unexpected finding and discussed with the Ome comparison. The remaining publication, verification, and external-approval gates are complete.

Issue #372 is ready for a final result comment and closure as completed.
