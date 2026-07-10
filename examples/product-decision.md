# Add deterministic release evidence to the agent workflow

## Scope

Require each completed implementation task to attach the exact validation commands, exit status, and artifact paths used to establish completion.

## Non-goals

- Building a hosted dashboard
- Replacing existing CI
- Requiring live model credentials

## Proposal

Add a small local receipt contract that agents can produce and downstream tools can index. Begin with offline fixtures and one repository before broader adoption.

## Decision requested

Should the team implement the bounded receipt contract now, redesign it, pause for evidence, or reject it?
