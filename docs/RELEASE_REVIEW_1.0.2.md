# Tribunal 1.0.2 release review — not published

The candidate is prepared for human review in [PR #8](https://github.com/kujolang/tribunal/pull/8). No release, tag, package publication, live-provider request, signing or notarization was performed. The latest published release remains 1.0.1. Review and merge approval are still required; this document does not authorize publication.

## Candidate and compatibility

- Product/CLI/package candidate: **1.0.2**. Kujo target: **1.5.0**, release source `cc2d7dbb59a8dc05f00d629e100932f56f4062f6`.
- Corrected application and local archive/Workcell candidate: `95eb5665c21ab86712cb0cc0baea12ad3a47dd08`. Earlier candidate `e2b1896` predates the packaging and index-probe fixes; its receipts remain historical.
- This review record is a later evidence-only commit. Resolve the final review branch and its checks from PR #8; older receipts are not relabeled as evidence for a different SHA.
- Public library API 1.0, CLI commands/options and supported evidence schemas remain unchanged. Existing malformed-input false successes now fail explicitly, as documented in the September audit. Upgrades require the documented Kujo target and must not mix older concurrent store/index writers with the hardened writer.

## Proposed release notes

Tribunal 1.0.2 strengthens local decision evidence: conditional publication retains history under contention; governance mutations preserve invalid prior records; incomplete event projections fail visibly; HTTP publication requires valid conditions; and resource bounds apply before unreadable history is published. It also screens constructed context, validates encrypted inventories, and avoids redundant existing-directory traversal.

Kujo 1.5 is the verified runtime target. Compatibility CI uses checksum-pinned official archives; release verification builds its pinned source. HTTP receive-boundary regressions cover exact-limit acceptance and announced/unannounced overflow refusal. This release does not establish provider-side replay idempotency, automatic stale-lock recovery, a hosted service, or universal enterprise certification.

## Review checklist

- [x] Version, package metadata, current compatibility docs, changelog and generated man page agree on unreleased 1.0.2.
- [x] Required local checks pass: version, doctor, entrypoint check, 136 main tests, 56 CLI tests, schema and documentation gates, three HTTP receive-boundary cases, seven installer tests and diff check. The later lock fix passes all 40 hardening checks; four additional release-inventory tests and exact-source archive/smoke checks pass.
- [x] The original candidate passed push compatibility run [37622194528](https://github.com/kujolang/tribunal/actions/runs/37622194528); its PR run exposed the lock race recorded below. Those historical 388-check receipts remain in the [machine-readable review receipt](audits/release-review-2026-10-07/receipt.json). The corrected inventory is **390 Kujo checks**, seven installer tests, four release-inventory tests and three HTTP receive cases. Consult PR #8 for the final-head compatibility checks and verification-only release workflow; prior-head successes cannot satisfy that requirement.
- [x] Current Workcell success and intentional-failure manifests verify with the exact source/image identities below.
- [x] Candidate archive is reproducible and extracted smoke passes. Source `95eb566` archive SHA-256: `10aec712f727a83e94225286ddbf3cf3b6ec74b0e1fd109c6e6b0695a070d70d` (450045 bytes; zero Python cache entries). The review-record commit has additional documentation and therefore a separate archive/digest; use its exact receipt rather than substituting this candidate digest.
- [ ] Release-owner reviews PR #8 and chooses the final immutable source. No merge is implied by preparation.
- [ ] Release-owner explicitly authorizes a future tag/publication. Do not create either during this preparation task.

## Workcell evidence

Pinned Workcell source: `91b9f066ad32b6fffb8f456d8613c0379ac48b04` (product 1.0.0). Both final runs bind Tribunal `95eb5665c21ab86712cb0cc0baea12ad3a47dd08` to Linux amd64 image `sha256:4305c871600b637e20fbf698173ae216b9eccd0dfea762febd435017a1308aa9`; image revision label is the approved Kujo source. The executable digest is `93d5b2e5591a20fe56ec9a5312c045d53c5dc3e4abe3b3a6765cc1ecd2b71381`.

| Run | Expected and observed outcome | Manifest |
| --- | --- | --- |
| `wc-cd160351168d41eca36ecebc5a83fe6f` | completed; workload and Workcell exit 0; mock review/export; cleanup complete | six files, verifies |
| `wc-07f5c9a89d8e4c45b0ea90ab49011fa8` | workload exit 17; Workcell process exit 7; `workload-failed`; evidence exported; cleanup complete | six files, verifies |

The failed workload correctly reports `execution_succeeded=false` and skipped workload verification. Its separate manifest verification succeeds; these are different claims. The committed machine-readable receipt embeds the exact receipt/manifest documents and exported proof. Complete immutable runs (including stdout/stderr and patches) remain under `.workcell/runs/<run-id>/`; both original manifests and temporary evidence copies verified. Raw logs remain outside Git in accordance with the artifact guard.

Both policies use network `none`, user `501:20`, read-only root, all capabilities dropped, no-new-privileges, no Docker socket, one CPU, 512 MiB, 128 PIDs and the unchanged 120-second timeout. The host wrapper passes the explicit Colima endpoint and `run --pull=never`; it passes no host-control environment to the container. See [reproduction instructions](WORKCELL_REVIEW.md).

The initial `wc-588311ebf4174aa9bd7ec35d6a036efd` timed out before container creation because the pinned Workcell version strips host daemon-selection environment from the Docker child. That failure remains recorded; no timeout was raised. A subsequent dirty-source preparation attempt was refused as designed. The correction changes only host Docker endpoint selection; container safety policy is unchanged.

## Additional release blockers resolved during preparation

The first local package included ignored `__pycache__` bytecode despite matching its rebuild. Archive selection now uses only regular files committed at the declared Git HEAD and refuses changed tracked inputs before creating output. Four disposable-Git regressions cover generated inputs, unstaged/staged alterations, wrong source identity and symlinks. The corrected ZIP contains no caches, remains byte-reproducible and passes extracted smoke. Earlier package digests remain historical and are not release candidates.

PR run `37622641774`, Intel job `112796469920`, exposed a symlink-probe race under concurrent index ownership. The first attempted fix (`e1370fb`) also failed locally and in CI: Kujo can retain an assigned native error value after its catch executes. The final correction (`95eb566`) attempts exclusive mkdir first and consumes symlink/metadata errors inside guarded conditions before changing flags. No operation runs without a successful exclusive claim; observed symlinks and non-directories still fail, missing observations retry within the unchanged 30-second budget, and the retained error is reported on exhaustion. Independent-process contention and both live/dangling symlink regressions pass (40 hardening checks). Failed intermediate logs remain in the review receipt; no budget or assertion was relaxed.

## Remaining external work

- **Workcell upstream:** bind host daemon selection consistently and enforce no-pull at launch. The explicit CLI wrapper enables this candidate's proof without modifying the pinned Workcell repository. Existing SignalBox capture `cap_669a9f08-6919-4f3f-a38a-6f58c78eaf4d` / signal `sig_2c40ef48-3f70-4c76-88c2-bf7199a3874e` already track it; no duplicate was created.
- **AI SDK:** additive provider-idempotency forwarding and provider-specific verification remain necessary before claiming live replay deduplication or charge prevention. Mock/local review does not require that claim.
- **Kujo runtime:** native exclusive-directory ownership remains an upstream improvement; the existing fixed `/bin/mkdir` implementation and bounds are retained.
- **Concord:** product-version parsing should distinguish changelog dependency versions; Tribunal's explicit candidate version keeps the unchanged gate valid.
- **Deployment certification:** commissioned independent security review, live provider, target identity, managed custody, shared-filesystem, backup/recovery and regulated deployment approvals remain separate. No credentials or organizational authority were supplied for those tasks.

These follow-ups do not represent a failed local/operator-controlled release gate. No sibling repository was modified, and no broad deployment certification is claimed.
