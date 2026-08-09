# Privileged automation security review

## Scope

Decide whether a deployment agent may receive production write access under short-lived workload identity and approval gates.

## Non-goals

- Replacing the identity provider
- Allowing ambient credentials

## Evidence

Every write is scoped, logged, reversible, and requires a human approval for production.
