# External Blockers

blockers:
  - id: kujo-cli-module-distribution
    command: "kujo run <entry>.kujo"
    evidence: "Tribunal retains its local CLI parser because external repositories cannot resolve kujo/modules/cli.kujo through the current module search paths; copying the module would create a second source of truth."
    status: needs-contract-first
    next_action: "Publish/install the first-party CLI module or add a supported module search path/package dependency, then migrate parser call sites and add parser parity tests."
  - id: process-result-normalization-contract
    command: "execute_status / ProcessResult access"
    evidence: "Tribunal and CaseFile normalize legacy dict-shaped results, missing fields, and non-string stderr/stdout before rendering receipts; direct field access would change error behavior."
    status: needs-contract-first
    next_action: "Define a typed ProcessResult compatibility contract for missing fields and null streams, then replace the defensive adapter with native fields and regression fixtures."
  - id: tribunal-json-file-contract
    command: "src/common.write_text / write_json"
    evidence: "Tribunal's retained file helpers ensure parent directories, use atomic overwrite, append a newline to pretty JSON, and preserve the repository's JSON artifact formatting contract; direct write_file_atomic alone is not behavior-equivalent."
    status: policy-blocked
    next_action: "Define a first-party JSON-file write contract covering parent creation, overwrite, pretty formatting, trailing newline, and return shape, then migrate with byte-level artifact fixtures."
  - id: checklist-external-blocked-line-27
    command: "checklist classification"
    evidence: "docs/NEXT_SESSION_REVIEW.md:27"
    status: external-blocked
    next_action: "Resolve the external dependency, then rerun checklist mode."
