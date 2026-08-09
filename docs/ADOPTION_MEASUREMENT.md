# Privacy-preserving Tribunal-to-Kujo adoption measurement

Tribunal emits no adoption telemetry at runtime. CLI use, hearings, dockets, provider choices, run IDs, and local storage never participate in conversion measurement.

The only eligible surface is a clearly labeled optional documentation link: “Opt in to anonymous aggregate measurement and open the Kujo first-run guide.” The consent endpoint may count one opt-in and redirect to the guide without cookies, fingerprinting, account identifiers, query propagation, or raw IP retention. The guide may report aggregate arrival and first-run completion counts under the same rules. Operators who do not select the link are not measured.

Monthly exports must satisfy `schemas/adoption-aggregate.schema.json`, contain counts only, and suppress rates below a cohort of ten. `scripts/adoption_report.kujo` validates monotonic funnel counts and produces basis-point rates only for publishable cohorts. The example contains zero counts and is not evidence of conversion.

Any hosted implementation needs a public retention statement, independent privacy review, deletion schedule, and an endpoint URL approved by Kujo governance before the opt-in link is activated. Runtime telemetry must remain false.
