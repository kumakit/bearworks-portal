# Issue #372 Gate 5 Portal tasks

## Implementation

- [x] Confirm latest Portal main and create/use the Issue branch.
- [x] Audit the Portal handoff with Luna in read-only mode.
- [x] Pin the Apps production commit, bundle version, byte size, and SHA-256.
- [x] Add the immutable publication snapshot and lock.
- [x] Add fail-closed validation for the snapshot and displayed aggregates.
- [x] Add the static article route and primary-source attribution.
- [x] Add canonical, sitemap, header/footer/home navigation.
- [x] Add Workers CI route, AdSense, 404, and sitemap assertions.

## Local verification

- [x] `npm run validate:hachioji-climate`
- [x] `npm run lint` (no errors; four pre-existing warnings)
- [x] `npm run build`
- [x] `npm run cf:build`
- [x] Wrangler production dry-run
- [x] Wrangler staging dry-run
- [x] Desktop and mobile visual acceptance

## External gates

- [x] Approve and commit the Portal diff.
- [x] Approve and push the Portal branch.
- [x] Pass Linux clean-checkout CI.
- [x] Approve Workers deployment and verify the public route.
- [x] Confirm the production route on desktop and mobile.
- [x] Check the article URL in Google Search Console.
- [x] Request indexing and create follow-up Issue `kumakit/mission-control#376`.
- [x] Resolve the Issue completion criterion about an unexpected result.
- [x] Approve the Issue comment/status/close operations.
