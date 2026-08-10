# Tribunal 1.0.0 release administration

The release administration described here was applied with release-owner approval on 2026-08-09/10. `main` is protected, the `release` environment requires human review, and self-hosted runner `tribunal-robertdevore-mac` is online with the `kujo` label and pinned `KUJO_BIN` repository variable.

## Main protection

Protect `main` with all of the following settings:

- require a pull request with one approval;
- dismiss stale approvals and require approval of the most recent push;
- require conversation resolution;
- require branches to be current before merging;
- require these exact status checks:
  - `platform (ubuntu-24.04, linux-x86_64)`
  - `platform (macos-15-intel, macos-x86_64)`
  - `platform (macos-15, macos-arm64)`
  - `tool-artifacts`
- include administrators;
- block force pushes and branch deletion.

After approval, a repository administrator may apply that policy with:

```bash
gh api --method PUT repos/kujolang/tribunal/branches/main/protection \
  --input /tmp/tribunal-main-protection.json
```

where `/tmp/tribunal-main-protection.json` contains:

```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "platform (ubuntu-24.04, linux-x86_64)",
      "platform (macos-15-intel, macos-x86_64)",
      "platform (macos-15, macos-arm64)",
      "tool-artifacts"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1,
    "require_last_push_approval": true
  },
  "restrictions": null,
  "required_conversation_resolution": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
```

The returned protection document was inspected. The optional-signing release-policy change is the normal protected PR used to prove the policy before tagging.

## Release environment

Create an Actions environment named `release`, restrict it to protected branches, and require one approved human reviewer. The workflow already binds its publish job to that environment. Resolve the approved reviewer ID first, replace `REVIEWER_ID`, and then apply:

```bash
gh api users/REVIEWER_LOGIN --jq .id
gh api --method PUT repos/kujolang/tribunal/environments/release \
  -f wait_timer=0 \
  -F 'reviewers[][type]=User' \
  -F 'reviewers[][id]=REVIEWER_ID' \
  -F 'deployment_branch_policy[protected_branches]=true' \
  -F 'deployment_branch_policy[custom_branch_policies]=false'
```

Verify with `gh api repos/kujolang/tribunal/environments/release` and an intentionally unapproved workflow attempt. Do not use the environment as a substitute for archive, provenance, or signature verification.

## Runner and credentials

The tag-triggered release workflow uses self-hosted runner `tribunal-robertdevore-mac` with labels `self-hosted` and `kujo`. `KUJO_BIN` resolves to the pinned Kujo 1.0.0 binary, and the workflow's adjacent integration worktrees are provisioned at the exact matrix revisions.

`KUJO_ECOSYSTEM_TOKEN` is optional while every pinned integration repository remains public and readable by the scoped `github.token`. Exact-candidate hosted run `31341698867` proved that fallback. Configure the secret only if a pinned repository becomes inaccessible to the workflow token, and grant read-only access to the minimum repository set.

`TRIBUNAL_SIGNING_PROVIDER_CONFIG` is optional. When it names an approved provider config, the workflow creates and publishes signed evidence. When absent, the workflow still runs every release gate and publishes the reproducible archive, checksums, SBOM, provenance, smoke evidence, and archive receipt. An unsigned release must not claim signer-backed provenance.

## Reserved release-owner sequence

Application source remains candidate `1ceed3010c9c554fb9d44b8e38c91f9c998b80fb`. The reviewed optional-signing policy merge on `main` becomes the `v1.0.0` tag source without changing application logic. The release owner must inspect the tag-workflow archive and receipt, approve the `release` deployment, and only then publish; signatures are inspected only when signed evidence is present.
