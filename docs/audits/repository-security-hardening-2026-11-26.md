# Tribunal security hardening · 2026-11-26

Tribunal is a local-first decision-evidence engine. This pass started at `d3a28cd5a758d84e50004077c2bb34dacebcdae6` on `codex/tribunal-performance`. The application, test, and operator-documentation change is `3b3b5909fb16157cebe2c7ce4ca013366ed7a56e`. Verification used official Kujo 1.5.0 revision `cc2d7dbb59a8dc05f00d629e100932f56f4062f6` and the repository's pinned offline integrations. The local Intel macOS runtime SHA-256 was `3e1e475ea165c8b4a714495596fe8661ad970b27119ad44f1db4d9779f7f05d4`.

## Findings

| ID | Priority | Finding and source | Fix and regression coverage | Status |
| --- | --- | --- | --- | --- |
| SEC-1 | P0 | Run verification could treat a present, non-object signature envelope as an unverified signature without failing the integrity check. Encrypted integrity used a separate subset of envelope checks. | Share required signature field and digest checks in `src/integrity.kujo` and bind the encrypted envelope's run ID. Test malformed signatures with and without a trusted key and retain legacy v1.0, local v1.1, and provider v1.2 coverage. | Fixed |
| SEC-2 | P0 | The local store selected a run object and passed it to generic bundle import, which checked signature trust without checking the caller's selection. | Bind the requested run ID and chosen manifest digest to bundle metadata before creating the destination, then verify against that same metadata. Both store providers use the bound importer in `src/artifact_store.kujo` and `src/bundles.kujo`. Test separate run-ID and digest mismatches using trusted signed evidence. | Fixed |
| SEC-3 | P0 | Encrypted export and import staged plaintext in directories created under the host's ordinary directory permissions. | Claim owner-only mode 0700 staging in `src/common.kujo` and `src/bundles.kujo`, remove it after success or handled failure, and claim the final encrypted export directory exclusively. Test mode and existing-directory refusal, plus successful round trips, recipient rotation, and corrupted ciphertext rejection. | Fixed |

The signature and bundle formats, public library API, CLI flags, exit meanings, config, and dependency pins are compatible with v1. Invalid signature envelopes and store objects inconsistent with the selected identity now fail closed. Existing valid bundles require no migration. A trusted key is still required to verify provenance. Temporary staging uses the existing `TMPDIR` environment or `/tmp`, with a safe root outside run storage. A forcefully terminated process can leave an owner-only staging directory for operator cleanup.

## Audit scope

| Hardening phases | Security review coverage |
| --- | --- |
| 0 and 10 | Traced the CLI, policy, signed run, encrypted bundle, and store contracts. Compared v1 schemas and existing signed fixtures with their runtime readers. |
| 1, 12, 13 and 18 | Ran the existing offline gates at baseline and candidate. Added deterministic assertions to existing unit and enterprise suites picked up by compatibility CI. |
| 2, 3, 4 and 16 | Consolidated signature guards and store binding at their read boundaries. Reviewed artifact and HTTP bounds, streamed I/O, and plaintext lifetime. Kept legacy formats and schema coverage. |
| 5, 6 and 15 | Reviewed model and connector context bounds, retry and replay interfaces, and paginated projections. Command diagnostics describe refusal without returning artifact bodies or key material. Full hearing evidence stays on disk. No MCP registration surface is present in Tribunal. |
| 7, 8 and 9 | Reviewed signature verification, trusted identity selection, file claims, cleanup, locks and state transitions. Read the authorization, provenance, governance, subprocess, remote-adapter and offline-dashboard controls as deployment boundaries. |
| 11, 14 and 17 | Checked pinned Kujo and ecosystem integration inputs, updated the security and artifact-store docs, and kept release gates intact. |

This security pass uses offline/local evidence. Target filesystem, managed custody, live provider, and deployment certification require separate evidence. The performance, scale, index, and lock-load ceilings were exercised as regression gates. Peak resource use and token consumption were outside the measurement scope.

## Baseline and verification

The baseline checkout passed the evidence, security, schema, compatibility, gallery, Python, and timing gates. An initial host run hit disk exhaustion, so local fixture I/O moved to a temporary volume. An archive-only baseline lacked Git and pinned adjacent repositories. The follow-up baseline used an exact detached worktree and the pinned sibling checkouts, where unit, CLI, drift, Spec, and integration checks passed.

The candidate passed 77 Kujo source checks, 143 unit checks, 56 CLI checks, 105 enterprise checks, the property and focused hardening suites, the HTTP receive bounds, Python tests, and the offline release gates. The default sibling layout differed from the pinned integration inventory. The matrix, all 20 Eval checks, and Kennel validation passed using those exact pins. Local archive creation produced two byte-identical ZIPs matching SHA-256 `e2a5c9f83b4c78c0d0181e59e07ba715183ccc039136982ff9ff7b24aaad4ad7`, and extracted archive smoke passed.

On local Intel macOS 26.6.2, baseline and candidate both met the performance, scale, indexed paging, and lock-load budgets. The representative workloads emitted 512,220-byte contexts and 163,084-byte indexes at both revisions. Those runs check for regressions under the existing budgets.

Ubuntu x86-64, Intel macOS, and ARM macOS all passed the full compatibility workflow on the application commit, including the pinned Eval and Kennel gates. Local commands, exit codes, log hashes, and hosted platform receipts are in the [verification receipt](repository-security-hardening-2026-11-26-receipt.json). Raw logs and the local mock evidence are retained in `.tribunal/security-hardening-2026-11-26/`. [GitHub Actions run 45900496490](https://github.com/kujolang/tribunal/actions/runs/45900496490).

## Workcell

Workcell at `91b9f066ad32b6fffb8f456d8613c0379ac48b04` failed both preparations with exit 4 because Docker Desktop was unreachable. The default and dedicated Colima sockets were also unavailable. The two blocker receipts, `wc-3882f08f8acf411d9c67c58a2f1c7ea3` and `wc-0a30ce998d4949c2b611b52a642c5897`, passed Workcell manifest verification. The intended workload and deliberate exit-17 scenario remain unverified.

The closest exact-commit proof passed version, doctor, a valid docket, the expected missing-docket refusal, and a mock Executioner hearing. Tribunal verified all 16 artifacts of `2026-11-26-product-decision-md-9129` against manifest `15389c324b8d3b984664a9d05a4f8415fd0511ee3f5bdfa4ba2990cbe2a486f8`. This is local evidence.

## Remaining work

The pre-existing Workcell host blocker still requires a Docker endpoint and the identified proof image for both workload receipts. The commissioned independent security review remains outside this pass. No upstream changes are required for these fixes.
