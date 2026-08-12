# Issue #372 Gate 5 Portal walkthrough

## Outcome

The Portal implementation is locally ready for review. Commit, push, Linux CI, Workers deployment, public acceptance, and Issue updates remain separate gates.

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

- `npm run validate:hachioji-climate`: pass
- `npm run lint`: pass with four pre-existing warnings and no errors
- `npm run build`: pass; route generated as static content
- `npm run cf:build`: pass on Windows with the upstream compatibility warning
- `npx wrangler deploy --dry-run --env=""`: pass
- `npx wrangler deploy --dry-run --env staging`: pass
- Browser desktop: title, H1-H5 cards, 4-row table, source app link, canonical, and full bundle hash present; no page-level horizontal overflow
- Browser mobile (390 x 844): no page-level horizontal overflow; comparison table scrolls inside its own container

## Commit and remaining gates

The Portal diff was reviewed and approved for commit. This commit contains only the 15 Issue #372 Portal files.

1. Approve and push the Issue branch.
2. Pass Linux clean-checkout Workers CI.
3. Approve Workers deployment and complete public desktop/mobile acceptance.
4. Resolve or explicitly accept the Issue completion criterion about an unexpected result.
5. Separately approve the Issue comment, status change, and close.
