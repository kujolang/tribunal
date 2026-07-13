# External Blockers

blockers:
  - id: kujo-cli-module-distribution
    command: "kujo run <entry>.kujo"
    evidence: "KUJO_MODULE_PATH now resolves kujo/modules/cli.kujo from external repositories. Tribunal still retains its application-specific parser and needs an explicit adapter contract before replacing it with the smaller first-party parse(spec) API."
    status: needs-contract-first
    next_action: "Define the parse(spec) adapter contract for Tribunal's command, validation, and help behavior, then migrate call sites and add parser parity tests."
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
