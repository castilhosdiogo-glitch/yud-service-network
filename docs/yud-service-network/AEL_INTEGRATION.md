# YUD Service Network ↔ Agent Engineering Layer

Status: analysis. Nothing here is implemented yet.

Two repositories are building YUD Service Network at the same time. This
document records which layer owns what, where the two meet, and the two places
where they currently collide.

Source reviewed: `castilhosdiogo-glitch/yud-agent-engineering-layer`
PRs [#66](https://github.com/castilhosdiogo-glitch/yud-agent-engineering-layer/pull/66)
(`domain-harnesses/yud-service-network`) and
[#71](https://github.com/castilhosdiogo-glitch/yud-agent-engineering-layer/pull/71)
(Cloudflare/DigitalOcean runtime), both still drafts.

## The split is real, and it is not duplication

The AEL domain harness declares `"authority": "intelligence_only"` on every
skill. That is the same boundary this repository enforces in Postgres: the
model proposes, deterministic code authorizes.

| | Agent Engineering Layer | This repository |
| --- | --- | --- |
| Owns | what the model must output, and how it is graded | the system of record |
| Artifacts | skills, workflows, evaluators, policy overlay, `domain-records.schema.json` | migrations, RLS, RPCs, edge functions |
| Authority | none — `intelligence_only` | authorizes, persists, audits |
| Failure mode it prevents | hallucinated availability, fabricated certainty, unprompted execution | privilege escalation, lost updates, double acceptance |

The AEL schema is not a competing copy of the domain tables. It describes the
*answer* an agent gives — `status`, `extracted`, `missing`, `next_question`,
`invented_availability`, `fabricated_fraud_certainty`. None of those are
columns here, and none of our columns are in it.

## The seam

This is the only place the two must agree. Each row is a hand-off: an AEL skill
produces a record, something here consumes it and turns it into state.

| AEL skill | Its output | Consumed here as | Lands in |
| --- | --- | --- | --- |
| `skill:service_request_intake` | `extracted{category, subcategory, location, time_window, constraints}` | `action: "create_request"` | `agent_service_requests` |
| `skill:professional_matching` | `ranked[]`, over professionals passed in with `eligible=true` | `yud_match_request` result | `agent_request_candidates` |
| `skill:regional_quote_assist` | `range`, `confidence`, `provenance`, `sets_professional_price` | `action: "get_price_reference"` | `regional_service_price_reference` (read-only) |
| `skill:professional_onboarding` | `extracted`, `missing`, `next_question` | — | `service_capabilities` (no API action yet) |
| `skill:marketplace_guardrails` | `decision ∈ {allow, block_bypass, escalate_abuse, escalate_uncertain}` | — | no enforcement point yet |
| `skill:human_escalation` (#71) | escalation record | — | no table yet |

### What the seam requires

1. **`intake.status` is not a request status.** `complete | incomplete | held`
   describes the quality of an extraction. It must never be written into
   `agent_service_requests.status`, which is a lifecycle. An `incomplete`
   intake has no row here at all; it is a conversation that has not produced
   demand yet.
2. **`matching.ranked` does not grant access.** Access comes from a row in
   `agent_request_candidates`, written by `yud_match_request`, which is
   `service_role` only. A model ranking a professional is a suggestion; the
   candidate row is the authorization. Keep it that way.
3. **`regional_quote_assist.sets_professional_price` is `false` by contract.**
   Reference price is decision support. `agent_service_quotes.amount_cents`
   comes from the professional, never from the model.
4. **`guardrails.decision` has no enforcement point here.** Today nothing reads
   it. Until something does, it is advisory, and should not be described as a
   control.

## Two real collisions

### 1. Two WhatsApp adapters

AEL PR #71 adds `deploy/cloudflare/yud-service-network/src/whatsapp-cloud.mjs`
and `whatsapp-state.mjs` — a full WhatsApp Cloud API integration with its own
state, on a Cloudflare Worker. This repository has
`supabase/functions/yud-whatsapp-webhook` and `yud-whatsapp-outbox`, against
the same Meta API and the same phone number id.

A WhatsApp Business phone number has **one** webhook URL. Two adapters cannot
both receive. This has to be decided, not merged:

- **Supabase here** — inbound/outbound sit next to the data they write, no
  cross-service hop, one deployment target. Costs the AEL harness a direct
  channel.
- **Cloudflare in AEL** — the channel lives with the agent runtime and the
  governed execution envelope. Costs a network hop to Supabase for every
  state read and write, and splits the secret across two platforms.

Whichever loses should delete its adapter rather than keep it dormant. Two
half-wired transports against one phone number is how a message gets delivered
twice or not at all.

### 2. Three schemas for one domain, inside this repository

Independent of AEL, this repo already defines the same contracts three times:

- `src/schemas/service-network.ts` — zod, tested by
  `src/schemas/service-network.test.ts`, and **imported by nothing**;
- the inline zod schemas in `supabase/functions/yud-agent-network/index.ts` —
  the only ones actually enforced at the boundary;
- the Postgres `CHECK` constraints in migrations 044–049.

They have already drifted: the unused file models location as
`location: {latitude, longitude}` and requires `professional_id` on a quote;
the enforced copy uses flat `latitude`/`longitude` and derives
`professional_id` from the session.

Adding the AEL `domain-records.schema.json` as a fourth definition would make
this worse. The order to fix it:

1. make the edge function the single enforced source, or import the shared
   file into it;
2. point the tests at whatever that turns out to be;
3. only then map AEL records onto it.

"No schema, no decision" does not hold while the tested schema is not the
enforced one.

## Suggested next step

Before either PR merges: decide the WhatsApp owner, and collapse the schema
duplication here. Both are cheap now and expensive after there is live traffic
on two transports.
