# Performance budgets

`scripts/scale_perf_gate.kujo` is the release gate for a 256 KiB-class strategic-five hearing and a 250-run cursor inventory. Separate property tests exercise larger generated token/path corpora.

Budgets:

- 256 KiB-class strategic-five mock hearing: 45 seconds;
- two 100-item cursor pages over 250 manifests: 3 seconds;
- peak resident memory deployment budget: 256 MiB;
- docket input: 1 MiB;
- context pack: 4 MiB;
- model output: 1 MiB per invocation;
- provider subprocess output: 8 MiB.

The Kujo runtime does not currently expose in-process peak RSS to a Kujo program. The gate therefore measures docket, context, aggregate artifact bytes, and latency directly while publishing the 256 MiB RSS limit as a deployment/release budget. CI or deployment supervisors should enforce RSS externally until a Kujo-native metric is available.

Reference run on 2026-07-11: 256,082 docket bytes; 512,220 context bytes; 7,807,751 aggregate artifact bytes; 28,074 ms hearing latency; 836 ms for two cursor pages. These numbers are evidence from one local machine, not universal performance claims; the budgets above are the portable release thresholds.

Run:

```bash
TRIBUNAL_HOME="$PWD" KUJO_BIN=../kujo/target/release/kujo \
  "$KUJO_BIN" run scripts/scale_perf_gate.kujo
```
