# Tribunal 1.0.0 exact-candidate evidence

## Identity and boundary

- Release candidate and application-source commit: `1ceed3010c9c554fb9d44b8e38c91f9c998b80fb`
- Kujo 1.0.0 revision: `9b77dce592047121cb71066629836ad89252f3ce`
- Local Kujo binary SHA-256: `a8175b084398a1623cf24cabb6aafb05f316cd6b15eb5e2015089501dd9d8215`
- Integration PR: [#1](https://github.com/kujolang/tribunal/pull/1), squash-merged 2026-08-09
- Evidence follow-up: [#2](https://github.com/kujolang/tribunal/pull/2), documentation and release-owner record only; it does not change the candidate's application source
- Local evidence root: `/Users/robertdevore/2026/Kujolang/kujo-repos/.tribunal-release-v1/1ceed30/`

The verdict applies only to the documented stable local or operator-controlled engine. No tag, release, public asset, signature, live provider credential, independent-review completion, or deployment-specific certification was created or claimed.

## Local command record

All candidate commands ran from a detached worktree at the candidate revision. Adjacent integration repositories were separate detached worktrees at the exact revisions in `docs/INTEGRATION_MATRIX.json`. Thresholds were unchanged.

| Command | Result |
| --- | --- |
| `./bin/tribunal version` | `Tribunal v1.0.0` |
| `./bin/tribunal doctor --json` | pass; 0 failures, 0 warnings |
| `$KUJO_BIN check tribunal.kujo` | pass |
| `$KUJO_BIN run tests/tribunal_tests.kujo --interpreter` | 130 passed, 0 failed |
| `$KUJO_BIN run tests/cli_integration.kujo --interpreter` | 55 passed, 0 failed |
| `$KUJO_BIN run scripts/schema_gate.kujo --interpreter` | 35 executable schemas passed |
| `git diff --check` | pass |
| `for file in $(find . -name '*.kujo' -not -path './.git/*'); do "$KUJO_BIN" check "$file"; done` | all Kujo sources checked; runtime emitted known non-fatal type-check warnings |
| `$KUJO_BIN run tests/enterprise_tests.kujo --interpreter` | 83 passed, 0 failed |
| `$KUJO_BIN run tests/property_tests.kujo --interpreter` | 21 passed, 0 failed |
| `$KUJO_BIN run scripts/drift_gate.kujo --interpreter` | pass; 0 advisory findings |
| `$KUJO_BIN run scripts/spec_gate.kujo --interpreter` | pass |
| `$KUJO_BIN run scripts/perf_gate.kujo --interpreter` | pass; unchanged 15,000 ms budget |
| `$KUJO_BIN run scripts/scale_perf_gate.kujo --interpreter` | pass; unchanged 45,000 ms hearing and 6,000 ms pagination budgets |
| `$KUJO_BIN run scripts/index_perf_gate.kujo --interpreter` | pass; unchanged budgets |
| `$KUJO_BIN run scripts/load_chaos_gate.kujo --interpreter` | pass; throughput and recovery objectives met |
| `$KUJO_BIN run scripts/adversarial_gate.kujo --interpreter` | pass; 7 fixtures, 9 server routes, 4 surfaces |
| `$KUJO_BIN run scripts/dashboard_accessibility_gate.kujo --interpreter` | automated fundamentals pass; manual screen-reader, 400% zoom, and forced-colors checks remain deployment/UI work |
| `$KUJO_BIN run scripts/security_review_gate.kujo --interpreter` | register pass; review remains `commissioned`, not completed |
| `$KUJO_BIN run scripts/integration_matrix_gate.kujo --interpreter` | pass; 10 integrations, 1 documented exclusion, all revisions and worktrees pinned |
| `$KUJO_BIN run scripts/gallery_gate.kujo --interpreter` | pass; 6/6 examples |
| `$KUJO_BIN run scripts/v1_compatibility_gate.kujo --interpreter` | pass; 42 commands and 5 fixtures |
| `$KUJO_BIN run scripts/docs_link_gate.kujo --interpreter` | pass; 81 local links across 41 candidate Markdown files |
| `(cd ../eval && $KUJO_BIN run main.kujo run "$TRIBUNAL_HOME/tests/tribunal_eval.json")` | pass; 19/19 after the transparent contention event below |
| `$KUJO_BIN run ../kennel/kennel.kujo --interpreter -- validate --project-dir "$TRIBUNAL_HOME"` | `kennel.toml is valid` |
| `$KUJO_BIN run scripts/release_archive.kujo --interpreter` | pass; deterministic primary/rebuild hashes match |
| `$KUJO_BIN run scripts/archive_smoke.kujo --interpreter <archive>` | pass; version, doctor, happy review, and intentional failure path |

Primary logs are `macos-x86_64-focused-gates.log`, `macos-x86_64-full-gates-scale-variance.log`, `macos-x86_64-eval-uncontended-retry.log`, and `macos-x86_64-post-eval-gates.log` in the evidence root.

### Transparent failures and corrections

No failure was hidden or bypassed:

1. An initial local matrix run used the developer's current adjacent worktrees. The integration matrix correctly failed because several heads did not match the pins. That invalid run is preserved as `macos-x86_64-full-gates-unpinned-worktrees.log`; the user worktrees were not modified.
2. The first isolated matrix run reached Eval without a binary at the pinned worktree-relative `../kujo/target/release/kujo` path. Eval failed with exit 127. The exact pinned binary was exposed at that expected path and the invalid run was preserved as `macos-x86_64-full-gates-missing-pinned-runtime.log`.
3. In the next isolated run, the direct scale gate passed at 32,672 ms, but Eval's second scale invocation took 53,660 ms and failed the unchanged 45,000 ms budget while an unrelated Kujo release compile consumed a CPU continuously. The log is preserved as `macos-x86_64-full-gates-scale-variance.log`. After that compile completed, Eval was rerun without changing source, configuration, or thresholds and passed 19/19 in 201,029 ms; this is `macos-x86_64-eval-uncontended-retry.log`. The exact-candidate hosted workflow independently passed the full inventory without retries on all three platforms.

## Release artifacts

Two independent invocations produced byte-identical source archives:

- `archive-build-a/tribunal-v1.0.0.zip`
- `archive-build-b/tribunal-v1.0.0.zip`
- SHA-256: `75cdbe279129f2a5d7a251c9887c8e5de74374f4846811383f353d2200061802`
- Size: 267,183 bytes
- ZIP entries including directories: 211
- Packaged files recorded by the receipt: 187
- SPDX SBOM SHA-256: `9eb148008dfe6bfaff41349fdf3eb8751022684047541ff1a6970b446effbf81`
- in-toto provenance SHA-256: `d54e567aab06f2762fe3b84e0baa3bd2d4c2958cb2e1dff017833eda624ad3ee`
- `SHA256SUMS` SHA-256: `a00e7943b63a4d0ac2b5b66923942f033bdb4b2bd50ba1e53e76c48463e3ac6d`
- Archive receipt SHA-256: `55ebf2b307276acd2c6af53aafc76c5ee4fa87083eac68f0740382e427102b2e`

`unzip -t`, every entry in packaged `SHA256SUMS`, SPDX identity, the exact provenance source revision, executable mode `0755`, the normalized single timestamp, identical inventories, forbidden-path checks, and high-confidence secret checks passed. The only token-shaped value was the deliberate dummy `sk-AAAA...` adversarial fixture. Both extracted-package smoke runs passed their happy path and observed the required nonzero intentional-failure path. `release-manifest.json`, both archive receipts, inventories, modes, and validation logs are in the evidence root. Nothing was signed or published.

## Workcell proof

The image was built from the pinned Kujo source before this evidence pass and inspected immediately before execution:

- Tag: `kujolang/workcell-kujo:tribunal-v1.0.0-9b77dce`
- Image digest: `sha256:fc82e1cfb39c617057555ba4069cd64b8d0f7388a39fb748a0709427d61bf5e7`
- `org.opencontainers.image.revision`: `9b77dce592047121cb71066629836ad89252f3ce`

| Command | Result |
| --- | --- |
| `workcell run --file docs/workcell-launch-gate.json --repo . --no-pull` | `wc-8994612bfc1549c8939c0347354221f9`; completed, exit 0, manifest verified |
| `workcell verify --run .workcell/runs/wc-8994612bfc1549c8939c0347354221f9 --json` | pass; manifest v1, 6 files |
| `workcell run --file <intentional-failure-definition> --repo . --no-pull` | `wc-22bd739ba3234f778849db21fcf0e10b`; expected `workload-failed`, workload exit 17, Workcell exit 7 |
| `workcell verify --run .workcell/runs/wc-22bd739ba3234f778849db21fcf0e10b --json` | pass; manifest v1, 5 files |

Both receipts bind the exact candidate and image digest. The copied receipts, manifests, logs, exported proof, verification JSON, and `workcell-summary.json` are in the evidence root. Colima was stopped after the proof.

## Hosted platform proof

GitHub Actions run [31341698867](https://github.com/kujolang/tribunal/actions/runs/31341698867) completed successfully at the exact candidate. `gh run download 31341698867 --repo kujolang/tribunal` retained and inspected:

| Platform artifact | Job | Result |
| --- | --- | --- |
| `tribunal-compatibility-linux-x86_64` | `93316444730` | pass |
| `tribunal-compatibility-macos-x86_64` | `93316444672` | pass |
| `tribunal-compatibility-macos-arm64` | `93316444704` | pass |

Each receipt names the candidate, pinned Kujo revision, architecture-specific runtime digest, measured environment, full gate inventory, and `pass`. Main artifact-guard run `31341698868`, job `93316444758`, also passed. Linux arm64 and Windows remain unsupported.

## Release quality and administration

From ShipCheck at version 1.0.0:

| Command | Result |
| --- | --- |
| `shipcheck scan --dir <candidate> --format json` | 16/16 passed, 0 warnings, exit 0 |
| `shipcheck gate --dir <candidate> --format json` | 16/16 passed, 0 warnings, exit 0 |

Version 1.0.0 remains consistent across product metadata, CLI, README, changelog, package manifests, installer and archive behavior, compatibility policy, and release notes. API, evidence, event, signature, encryption, bundle, and other schema versions remain independent.

Inspection found no branch protection, ruleset, release environment, self-hosted runner, repository Actions secret, or repository Actions variable. Those facts and reserved human actions are in `external-blockers.json`; administrator-ready controls are in [release administration](RELEASE_ADMINISTRATION.md). The public integration matrix does not currently require `KUJO_ECOSYSTEM_TOKEN`, as run `31341698867` proved the scoped `github.token` fallback. Runner provisioning, `KUJO_BIN`, authorized provider configuration, real signing, repository governance, independent-review completion, tag creation, tag-workflow verification, and publication remain human-authorized actions.

## Verdict

**READY FOR RELEASE-OWNER TAGGING** at candidate `1ceed3010c9c554fb9d44b8e38c91f9c998b80fb`, once the release owner completes the explicitly reserved administration, runner, signing, approval, tag, verification, and publication actions. No further application-source change is required.
