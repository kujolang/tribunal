# Paperclip skill stub: invoke Tribunal

This is an integration contract, not an installed Paperclip skill.

1. Materialize the issue/plan/decision as a Markdown docket with explicit scope and non-goals.
2. Run `tribunal review <docket> --panel fast-two-model --mock` for deterministic workflows, or an approved `--live` review through Kujo AI SDK.
3. Treat a nonzero exit and `status: stopped` as a blocked task requiring human review.
4. Read `decision-packet.md`; assign only its required next actions within its scope.
5. Require the listed evidence and acceptance criteria before closing the Paperclip issue.
6. Escalate any listed trigger or stop-the-line condition. Do not silently reinterpret the ruling.
7. Attach the Tribunal run ID and `receipt.json` hash to the Paperclip task comment when connector policy permits.

Paperclip remains responsible for task state, assignments, governance, and approvals. Tribunal remains responsible for the decision hearing and record.
