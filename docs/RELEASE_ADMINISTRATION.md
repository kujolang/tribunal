# Tribunal 1.0.0 release administration

This is an administrator-ready plan, not a record of applied repository governance. Inspection on 2026-08-09 found no `main` branch protection, repository ruleset, Actions environment, repository Actions secret, repository Actions variable, or self-hosted runner. Applying these controls requires explicit approval under [AGENTS.md](../AGENTS.md).

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

The administrator must inspect the returned protection document and run a normal test PR before treating the policy as proven.

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

The tag-triggered release workflow requires a self-hosted runner with labels `self-hosted` and `kujo`, plus a `KUJO_BIN` repository variable or runner environment value that resolves to the pinned Kujo 1.0.0 binary. No such runner or variable existed at inspection time.

`KUJO_ECOSYSTEM_TOKEN` is optional while every pinned integration repository remains public and readable by the scoped `github.token`. Exact-candidate hosted run `31341698867` proved that fallback. Configure the secret only if a pinned repository becomes inaccessible to the workflow token, and grant read-only access to the minimum repository set.

`TRIBUNAL_SIGNING_PROVIDER_CONFIG` remains required for the approved release-signing provider. No value was inspected, created, or used during preparation. The release owner must provision it under separate credential and signing authority, then verify the provider-specific public-key identity before publishing.

## Reserved release-owner sequence

After the controls above are approved and verified, the release owner must confirm candidate `1ceed3010c9c554fb9d44b8e38c91f9c998b80fb`, create `v1.0.0`, approve the `release` environment deployment, inspect all tag-workflow artifacts and signatures, and only then publish. This preparation does not authorize or perform those actions.
