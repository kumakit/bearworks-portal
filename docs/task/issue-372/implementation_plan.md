# Issue #372 Gate 5 Portal implementation plan

## Source of truth

The approved cross-repository plan and five hypotheses are maintained in `kumakit/bearworks-apps` under `docs/task/issue-372/`. This document narrows that approved plan to the Portal handoff.

## Scope

- Publish a static article at `/labs/hachioji-climate` under the monetized route group.
- Vendor the Apps production publication bundle as an immutable snapshot.
- Pin byte size, SHA-256, schema, version, and Apps production commit in a lock file.
- Fail builds and publish commands when the snapshot contract differs.
- Register canonical, sitemap, header/footer/home navigation, and Workers preview assertions.

## Article contract

- Use JMA observations from 1990-01-01 through 2025-12-31 for Hachioji, Fuchu, Ome, and Tokyo.
- Report H1-H5 from the bundle, including `supported` and `caution`.
- Explain quality codes 5/8, 90% coverage, homogeneity boundaries, station-level scope, and non-causal limits.
- State honestly that all five preregistered hypotheses were supported and no preregistered contradiction was observed.
- Distinguish that result from the broader belief that Hachioji is the coldest place in Tama, which the four-station comparison does not support.
- Disclose AI assistance and human verification roles.

## Gates

1. Snapshot and lock validator pass locally.
2. Lint and Next.js build pass.
3. OpenNext build and Wrangler production/staging dry-runs pass.
4. Workers preview verifies the valid route, canonical, sitemap, AdSense boundary, and advertisement-free invalid route.
5. Linux clean-checkout CI passes after a separately approved push.
6. Workers deployment and public acceptance require separate approval.

## Open completion condition

The Issue wording that requires at least one result contrary to expectation conflicts with the production bundle, where H1-H5 are all supported. Do not fabricate a contradiction. Gate 5 implementation can proceed, but Issue completion remains blocked until the criterion is amended or explicitly accepted.
