# Tribunal Kujo library API

Import `src.lib` from another Kujo program. The public API version is `1.0.0`; additions are backward-compatible within 1.x and breaking changes require 2.0. Every call returns a schema-validated envelope with `apiVersion`, `ok`, `operation`, and either `value` or `error`.

```kujo
from src.lib import review_docket, list_hearings, verify_hearing

result := review_docket(config, "decision.md", "fast-two-model", "", "")
if result["ok"] != true { print(result["error"]); exit(1) }
page := list_hearings(config["tribunal"]["storage_dir"], "completed", "", 25, "")
checked := verify_hearing(config["tribunal"]["storage_dir"], result["value"]["runId"], "")
```

Public functions are `review_docket`, `resume_hearing`, `compare_sealed_rulings`, `list_hearings`, and `verify_hearing`. The library retains sealing, stop-the-line, path, and resource-limit rules. Authorization is enforced by CLI dispatch; embedding callers must authenticate and authorize access before invoking library functions, including read operations that accept only a storage path. The library is an in-process trusted-operator API, not a service authorization boundary. The API never exposes provider credentials or a direct-provider bypass.

Index operations coordinate through a storage-wide exclusive directory. Coordination timeout, unsafe paths and an interrupted update raise filesystem-style exceptions; embedding callers must surface these errors rather than treating them as empty lists or successful writes. After confirmed process shutdown, recover the abandoned index lock and run index repair as described in [Operations](OPERATIONS.md). Each list call is consistent; multiple cursor calls do not form a snapshot.
