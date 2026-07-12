# Tribunal example gallery

These six offline examples cover architecture, security, launch, incident, procurement, and product decisions. Each docket has explicit scope, non-goals, evidence, a recommended panel, and a deterministic expected-artifact contract in `catalog.json`.

Run the gallery gate to create each hearing in temporary storage, verify its sealed artifacts, compare the output to the catalog, and remove the temporary data:

```bash
kujo run scripts/gallery_gate.kujo --interpreter
```

To keep one example, run `tribunal review examples/gallery/<name>.md --panel <panel> --mock`. Mock results demonstrate structure and workflow, not the correctness of a real organizational decision.
