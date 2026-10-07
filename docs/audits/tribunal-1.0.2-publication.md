# Tribunal 1.0.2 publication receipt

Date: 2026-10-07. Scope: Tribunal release, official website, documentation and read-only catalog refresh. This record supplements the prior repository hardening reports; it does not replace historical evidence.

## Release and source identity

- Release: [Tribunal v1.0.2](https://github.com/kujolang/tribunal/releases/tag/v1.0.2), published 2026-10-07 at 14:31:29 UTC.
- Immutable tagged source: `567518a2d9d39ff77da52b5fb1fca4546984c197`.
- Publication workflow source: `a21c6977db3d9a7560429747cce17073fdbe33f5`.
- Successful publication: [run 37635411474](https://github.com/kujolang/tribunal/actions/runs/37635411474).
- Public ZIP: 465,145 bytes; SHA-256 `fcf31d454da48adca44927b6b78bbb14dd31482ab8cc43745d897baf57b95040`.
- All 218 SHA256SUMS entries verified after downloading the public asset; no Python caches were packaged. A second smoke test of that public ZIP passed on official Kujo 1.8.0.
- The attached archive receipt records the actual source-built Kujo 1.5 runtime identity. Archive reproducibility is verified within that recorded build; different runtime binary provenance can produce different ZIP hashes across builds.

The compact [publication and deployment receipt](https://github.com/kujolang/tribunal/releases/download/v1.0.2/publication-receipt.json) preserves final workflow, production, catalog, audit and Workcell results. Detailed local logs are under `.tribunal/publication-20261007/`; they are intentionally excluded from Git.

## Runtime verification

The unchanged tagged source passed 104 commands on the checksum-verified official Kujo 1.8.0 macOS Intel executable: 77 source checks, 390 Kujo checks, 11 Python tests, three HTTP receive-boundary cases, all release gates, 20 Eval cases, Kennel validation and repository checks. See [the command receipt](../compatibility/kujo-1.8.0-2026-10-07.json).

The original three-platform Kujo 1.5 matrix remains separate historical reproduction evidence. The 1.8 result covers the measured macOS Intel host, not unmeasured 1.8 platforms. No assertion, timeout, budget, provider boundary or test was weakened.

Exact tagged-source Workcell runs:

| Case | Run | Result |
| --- | --- | --- |
| Offline success | `wc-188ffada77744cd2b98c371ae74ceae2` | exit 0, execution verified, cleanup complete |
| Intentional failure | `wc-369bea14694645239081bca1ad70b013` | workload exit 17, expected execution failure, cleanup complete |

Both evidence manifests verified. Workcell used the documented Kujo 1.5 container and existing resource/security limits. The task-owned Colima profile was stopped afterwards.

## Findings and implemented changes

| ID | Priority | Finding / evidence | Action | Status |
| --- | --- | --- | --- | --- |
| PUB-01 | P1 | Tag-dispatched publication was rejected by the protected-branch-only release environment; run 37631783049 verified successfully but could not publish. | Resolve a matching, already-merged tag from protected main; carry its immutable SHA through verification, archive provenance and publish checkout. Seven behavioral regression tests cover wrong refs/versions, missing tags, unmerged source and verification-only execution. | Resolved; PR #11, full platform checks and publication passed |
| PUB-02 | P2 | Current website/docs/catalog still identified Tribunal 1.0.1. | Refresh 1.0.2 metadata, hardening summary, release inventory, exact-tag installation and generated catalog/Worker. | Resolved |
| PUB-03 | P2 | Current Kujo 1.8 evidence was absent. | Run the unchanged tagged source and archive on official 1.8; record measured scope and update README/install guidance. | Resolved for measured host; broader 1.8 platform certification remains unclaimed |

The original tag was not moved. Branch protections, the release environment, reviewer requirement and all release gates remained enabled. The release owner authorized publication and the required environment approval was recorded.

## SEO / AI-search content audit

Artifact audit result: **PASS WITH RECOMMENDATIONS** for this release-content scope. Final live responses and lab results are in the linked publication receipt.

- Preserved untouched source/build and production baselines before edits.
- Main site: 244 generated HTML pages before and after; docs: 106 before and after. Route sets are identical.
- Both inventories: no missing titles/descriptions, duplicate titles, H1-count errors, JSON-LD parse failures, broken internal destinations or missing image alt attributes.
- Existing site-wide exceptions remain unchanged: the intentionally noncanonical 404 and one image without dimensions on `/providers/`. Neither is on a changed Tribunal page.
- The three changed pages retain their canonical URLs, headings, schema types and sitemap membership. No template, asset, training-crawler policy or route redesign was introduced.
- HTML bytes: ecosystem Tribunal 20,222 → 20,353; operator guide 10,416 → 10,676; release inventory 27,217 → 27,242. These are content-size measurements, not performance improvements.
- Baseline curl checks returned 200 for the eight scoped content/discovery/health URLs. Synthetic Googlebot, Bingbot, OAI-SearchBot and ChatGPT-User requests passed all 24 checks; this is an access probe, not a claim of actual indexing or AI citations.
- HTTP, www and slash variants reached the canonical URLs in one redirect; query parameters were preserved. Initial Python urllib requests returned 403, while curl and browser probes succeeded; the failed client observations were preserved separately.
- Baseline Lighthouse 12.8.2: main-site performance 56, accessibility 100, SEO 100; docs performance 99, accessibility 100, SEO 100. These single-run lab values were measured during other local verification workloads. Do not infer causality, ranking gains or field CWV from before/after variation.

Search Console, Bing Webmaster Tools, analytics, request logs, field CWV and controlled AI-answer citations: **NOT AVAILABLE — DATA ACCESS REQUIRED**. No ranking, traffic or citation claims were invented. With authorized data access, compare index coverage, page/query performance, citations and field metrics after 7/28/60/90 days. The main-site performance observation warrants a dedicated repeat measurement before assigning a regression or optimization claim.

Research consulted 2026-10-07: [Google AI-search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), [canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), and [sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap). These support crawlable, source-backed content and canonical consistency; they do not guarantee visibility.

## Ecosystem boundaries

The official MCP snapshot retains 232 records and six installation profiles. Only the Tribunal record changed; profiles and read-only capabilities are unchanged. The Worker was regenerated from pinned source inputs, not hand-edited. CI validation and native/Worker parity checks passed. CI deployment credentials were absent, so the existing documented Wrangler login was used for deployment.

Agents-site roles and the released Tribunal skill/workflow descriptions remain accurate and version-independent; no divergent agent contracts were created. Kennel registry package publication is independent; the site now supplies an explicit GitHub tag clone command rather than implying registry publication of 1.0.2.

No public API, CLI, schema, file format or environment-variable contract changed in this publication work. Managed signing, live providers, independent security review and target-environment certification remain outside these release claims.

## Verification commands

Exact expanded Kujo 1.8 commands and log digests are in the linked command receipt. Other commands executed successfully include:

```text
python3 -m unittest discover -s tests -p 'test_release_source.py'
bash -n scripts/release_source.sh
kujo run scripts/docs_link_gate.kujo --interpreter
git diff --check
npm ci
npm test
kujo run ./build.kujo -- --site-url https://kujolang.ai
npm run images:responsive
bash scripts/verify-site-contract.sh output
bash scripts/validate-generated-output.sh output
KUJO_BIN=<official-1.8> SSG_ROOT=<pinned-ssg> bash tests/site-contract.sh
kujo run scripts/sync_catalog.kujo --interpreter -- --site <reviewed-site> --check --json
kujo run tests/run_all.kujo --interpreter
kujo run scripts/generate_worker.kujo --interpreter -- --framework <pinned-framework>
node --check dist/worker.js
node tests/worker_contract_test.mjs
KUJO_BIN=<official-1.8> node tests/native_http_test.mjs
npx --yes wrangler@4.130.0 deploy --dry-run
npx --yes wrangler@4.130.0 deploy
RECEIPT_PATH=<receipt> node tests/production_catalog_test.mjs
npx --yes lighthouse@12.8.2 <page-url> --chrome-flags=--headless --only-categories=performance,accessibility,seo --output=json --output-path=<receipt> --quiet
```

Generated source/artifact inventories, curl headers, crawler/redirect probes, Lighthouse JSON, deployment IDs and public-archive checks remain in the local evidence directory and compact release attachment. No application regression or unresolved publication-code failure remains.
