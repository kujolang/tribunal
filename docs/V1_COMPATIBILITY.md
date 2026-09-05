# Tribunal v1 compatibility contract

Tribunal 1.0.1 is stable as a local or operator-controlled decision-evidence engine. This contract does not certify a hosted service, shared filesystem, identity provider, signing or encryption custody system, remote store, regulated environment, or organization deployment.

## Version identities

| Surface | v1 identity | Compatibility rule |
| --- | --- | --- |
| Product and CLI | `1.0.1` | Patch and minor releases preserve the documented v1 command names, accepted option meanings, and exit-code meanings. |
| Kujo library API | `1.0.0` | Additive 1.x changes are allowed; removal, semantic repurposing, or incompatible envelope changes require API 2.0. |
| Configuration | schema `1.0.0` fixture contract | Existing documented fields keep their meanings within product 1.x; additive optional fields require safe defaults. |
| Tribunal record | schema `1.0.0` | Readers continue validating and inspecting supported 1.x records. |
| Signature envelopes | `1.0.0`, `1.1.0`, and provider `1.2.0` | All remain verifiable under the documented trust boundary. New write algorithms or incompatible envelopes require a new envelope version. |
| Portable bundle | schema `1.0.0` | Import/export inventory and trust semantics remain compatible within product 1.x. |
| Encrypted bundle | schemas `1.0.0` and `1.1.0` | Legacy whole-value evidence remains readable; 1.1 framed output is the current write format. |

Other API, event, evidence, policy, receipt, provenance, and schema identifiers are independent contract versions. A Tribunal product release never changes them solely to match the product number.

## Supported CLI and library surface

The supported CLI is the exact command inventory generated from `tribunal help` in [COMMAND_REFERENCE.md](COMMAND_REFERENCE.md), including the documented global options. Exit `0` means success, `1` runtime failure, `2` usage/configuration failure or a stopped hearing, and `3` integrity or authorization failure. Unknown commands, unknown or duplicate options, missing values, unsafe paths, and conflicting modes fail closed.

The supported library exports are `review_docket`, `resume_hearing`, `compare_sealed_rulings`, `list_hearings`, and `verify_hearing` from `src/lib.kujo`, plus the `config`, `contracts`, `panels`, and `compare` package exports declared in `kennel.toml`. Every library operation returns the API 1.0 envelope documented in [LIBRARY_API.md](LIBRARY_API.md).

## Evidence, configuration, export, and import

The static fixtures under `tests/fixtures/v1/` freeze representative v1 configuration, record, portable-bundle, JSON export, and CLI contracts. `scripts/v1_compatibility_gate.kujo` validates those fixtures against the executable implementation and schemas. The main and enterprise suites additionally create real runs, export JSON and JSONL, export signed bundles, import them through an independently supplied trust policy, and reject modified metadata, files, signatures, and paths.

Run directories created by supported pre-1.0 Tribunal releases remain inspectable when every recorded contract version is in the supported list and integrity verification passes. Use `show`, `replay`, `verify`, `contracts`, or `audit`; rebuild only the external index when requested. Tribunal does not rewrite sealed historical evidence in place. An unsupported future schema must be retained unchanged and inspected with a compatible newer reader rather than downgraded.

## Changes and upgrades

Compatible 1.x releases may add commands, optional fields, schema versions, or library functions. They may not remove or repurpose a documented v1 command, public function, required evidence meaning, accepted historical format, or exit meaning. A breaking CLI or library change requires Tribunal 2.0, an independently versioned contract update where relevant, migration guidance, compatibility fixtures, and a changelog entry.

Before upgrading, follow [INSTALLATION.md](INSTALLATION.md): back up storage and external governance/trust records, verify representative evidence, pin the Tribunal and Kujo revisions together, run doctor/index/schema/compatibility gates, and retain the prior reader for rollback. Rollback never permits mutation of sealed runs.
