# Kujo 1.5 Workcell verification

This is local container execution evidence for the unreleased Tribunal 1.0.2 candidate. It does not certify an enterprise deployment. Historical 1.0 image receipts remain historical.

Use Workcell revision `91b9f066ad32b6fffb8f456d8613c0379ac48b04` from the integration matrix and official Kujo 1.5.0 (`cc2d7dbb59a8dc05f00d629e100932f56f4062f6`). Keep the host runtime explicit in `KUJO`. Prepare a clean committed Tribunal checkout before invoking Workcell; it refuses dirty source.

## Image preparation

Start an authorized Docker daemon with adequate disk space. For local Colima, use `colima start kujo-workcell --activate=false` and explicitly set `DOCKER_HOST` to its socket. Do not change another project's active Docker context. A separate empty `DOCKER_CONFIG` can be used for public pulls when the host configuration references an unavailable credential helper.

Build from a small temporary context, not the whole repository or its evidence directory:

```bash
context="$(mktemp -d)"
mkdir -p "$context/scripts" "$context/docs"
cp scripts/install_ci_runtime.py "$context/scripts/"
cp docs/INTEGRATION_MATRIX.json docs/workcell-runtime.Dockerfile "$context/docs/"
docker build --platform linux/amd64 \
  -f "$context/docs/workcell-runtime.Dockerfile" \
  -t kujolang/workcell-kujo:tribunal-kujo-1.5.0-cc2d7db "$context"
```

The recipe pins the Ubuntu amd64 manifest and reuses the checksum-pinned official Kujo installer, including version validation. It installs required launcher/runtime utilities and defaults to an unprivileged image identity. Workcell additionally chooses the host-matching unprivileged identity, drops all capabilities, forbids privilege escalation, disables networking, mounts a read-only root, and applies the definition's resource limits. Package repository contents are not snapshot-pinned: preserve the final image ID and package inventory; this is an identified proof image, not a claim of reproducible OS package resolution. Remove only your temporary build context after preserving required logs.

## Success and failure evidence

Set `WORKCELL_BIN` to the pinned Workcell launcher and `KUJO` to the verified host runtime. On macOS, set `TMPDIR` to a writable directory under the repository's ignored `.tribunal/` directory so Docker can mount the disposable workspace. Preserve each run ID and verify both manifests:

```bash
"$WORKCELL_BIN" run --file docs/workcell-launch-gate.json --repo . --no-pull
"$WORKCELL_BIN" verify --run .workcell/runs/<success-run-id> --json
"$WORKCELL_BIN" run --file docs/workcell-failure-gate.json --repo . --no-pull
"$WORKCELL_BIN" verify --run .workcell/runs/<failure-run-id> --json
```

Success must report Workcell exit 0, exact source commit, expected runtime version, completed mock review, and successful receipt verification. The deliberate failure must report workload exit 17 and Workcell exit 7 (`workload-failed`), while its evidence manifest still verifies. A launch/preflight failure is not the intended failure proof. Confirm network `none`, read-only root, dropped capabilities, no privilege escalation, resource limits, image digest/revision label and cleanup in the receipts. Do not relabel a different source revision's receipt.

This procedure creates no public release, Git tag, package publication, signature or live-provider request.
