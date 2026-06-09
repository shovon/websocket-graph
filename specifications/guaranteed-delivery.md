# GRS Guaranteed Delivery

## Status of This Memo

This document is an optional **delivery-contract strengthening** for GRS. The base relay is best-effort: the server attempts to deliver an accepted payload but guarantees neither delivery nor any signal of it (Delivery §6), and leaves reliability, ordering, and deduplication to a later document (Delivery §7). This *is* that later document, for deployments that want more — it raises the floor from *best-effort* to **guaranteed delivery**, and invites the rest of the system to be built on that stronger floor.

It is opt-in, in the same spirit as the bindings that each fix one open choice (`unique-session-identity.md`, `designator-string.md`, `payload-string.md`): a deployment happy with best-effort ignores it; a deployment that wants delivery it can count on adopts it and builds accordingly. `push-based-choreography.md` describes the flows beautifully; this document changes one thing about them — the `Deliver` arm stops being a hopeful attempt and becomes a promise — and much of what a client would otherwise have to build for itself simply falls away.

It **strengthens guarantees and removes none.** No-Misdelivery (Delivery §3), resolution against the current neighborhood (Delivery §4), directionality (Architecture §3.1), and self-scoping (Core §6) all hold exactly as before. Guaranteed delivery sits **on top of** acceptance: it promises more about the messages the server *accepts*, and changes nothing about which messages are accepted. It is written against the Pushable Profile and its choreography, where the server delivers by push; Section 7 notes the pull analogue. Section references of the form (Push §N) point into `rpc-push-profile.md`, (Delivery §N) into `delivery-and-consistency.md`, (Core §N) into `rpc-interface.md`, (Architecture §N) into `architecture.md`, and (Ack §N) into `acknowledgement-and-errors.md`.

## Table of Contents

1. Terminology
2. The Guarantee
3. The One Boundary: Receiver Departure
4. What Acceptance Now Means
5. What the Server Must Do
6. What This Does Not Change
7. Composition
8. Security Considerations
9. References

## 1. Terminology

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

This document uses all terms of the core (Core §1), the Pushable Profile (Push §1), and the acknowledgement model (Ack §1), and adds:

- **Delivered**: a payload is **delivered** to an out-neighbor when that out-neighbor's node has received and accepted it at the application boundary — not merely when the server has transmitted it.
- **Accepted message**: a `Send` whose designator denoted a current out-neighbor at the moment of sending, so the server took it for relay (Delivery §4; Ack §3).

## 2. The Guarantee

For every message the server **accepts**, the server guarantees:

1. **Reliability** — the payload is delivered to the out-neighbor it was accepted for; the server does not silently drop it (boundary: Section 3).
2. **Order** — payloads accepted from one sender for one out-neighbor are delivered to that out-neighbor in the order they were sent (per-edge FIFO).
3. **No duplication** — each accepted payload is delivered to that out-neighbor at most once; a receiver never observes a payload twice.

Together: an accepted payload is delivered to its out-neighbor **exactly once, in order** — failing only if that out-neighbor departs first (Section 3). That is the floor a guaranteed-delivery deployment builds on, and it is meant to be relied upon, not hedged against.

## 3. The One Boundary: Receiver Departure

The single thing guaranteed delivery cannot promise is delivery to a node that no longer exists. If the out-neighbor a message was accepted for **departs** (Architecture §3, Core §4.4) before the payload is delivered, the payload is not delivered — there is no node left to deliver it to, and No-Misdelivery forbids handing it to anyone else (Delivery §3).

Stated exactly, then: an accepted payload is delivered to the out-neighbor it was accepted for, **or that out-neighbor departs before delivery**. Within a node's lifetime the guarantee is absolute; it lapses only at that node's death — the same boundary every other per-node guarantee in GRS respects (cf. the lifetime boundary of `unique-session-identity.md`). A deployment that needs delivery to survive a receiver's reconnection is asking for two strengthenings at once — guaranteed delivery **and** a persistent identity to deliver to (Architecture §3); see Section 7.

## 4. What Acceptance Now Means

Under the base relay's best-effort contract, an acceptance decision reports only that the server will *attempt* relay, never that the payload arrives (Delivery §6). This document **raises that promise**: because every accepted payload is delivered (Section 2), **accepted now means will-be-delivered** — to the out-neighbor it was accepted for, unless that out-neighbor departs first.

A sender MAY therefore treat acceptance as an eventual-delivery commitment, and needs no separate end-to-end delivery receipt for the common case. The sender-facing acknowledgement that carries this meaning is specified in `acknowledgement-and-errors.md`, which reads against this floor (Ack §4). The only residual uncertainty is receiver departure (Section 3), which a deployment MAY surface to the sender as a delivery-failed-on-departure signal, or leave silent.

## 5. What the Server Must Do

The guarantee (Section 2) is the contract; the mechanism is an implementation matter, but it has irreducible parts a conforming server MUST provide:

- **Buffer until delivered.** The server retains an accepted payload until it is delivered (Section 1) or its out-neighbor departs. It MUST NOT drop a buffered payload to reclaim space — that would break reliability; under pressure it applies backpressure instead (below).
- **Confirm and retransmit.** The receiver acknowledges each delivered payload at the application boundary, and the server retransmits an unacknowledged payload until it is confirmed or the receiver departs. This makes the relay's receiving half two-way, where the base leaves `Deliver` one-way and unacknowledged (Push §5.2).
- **Sequence for order and dedup.** The server orders payloads per sender→receiver edge, and the receiver suppresses any duplicate a retransmission may produce — a per-edge sequence is the usual mechanism for both.
- **Flow-control the sender; do not drop.** Because buffers are finite and dropping is forbidden, a server under load MUST push back toward the sender — throttling or blocking `Send` — rather than discard accepted traffic. Under guaranteed delivery, therefore, acceptance MAY be flow-controlled: a `Send` is not always instantaneously accepted, because acceptance now carries a delivery obligation the server must be able to honor.

The wire form of the receiver's acknowledgement, the sequence, and the flow-control signal are syntax, left to the transport binding (Core §5, Delivery §7).

## 6. What This Does Not Change

- **Which messages are accepted.** Resolution is unchanged: a designator that denotes no current out-neighbor is still **discarded** (Delivery §3, §4; Ack §6). Guaranteed delivery promises nothing about a discarded message — there is no out-neighbor to deliver it to. It strengthens the fate of *accepted* messages only.
- **No-Misdelivery.** A payload still reaches only the node its designator denoted at the moment of sending (Delivery §3). Reliability never relaxes targeting.
- **Departed receivers stay departed.** This document does not resurrect a node or hold its identity (Architecture §3); it only declines to deliver across a death (Section 3).
- **Directionality and self-scoping** (Architecture §3.1, Core §6) are untouched.

## 7. Composition

- **With the choreography.** The flows of `push-based-choreography.md` are unchanged in shape; what changes is the guarantee on the `Deliver` arm — read it as solid-and-certain rather than dashed-and-hopeful, within the boundary of Section 3.
- **With the identity model.** The reach of the guarantee is set by the identity it composes with. Under the ephemeral default (or `unique-session-identity.md`), a receiver's disconnect *is* its departure, so the guarantee is "delivered while connected." Compose it instead with a **persistent identity** (Architecture §3) and the server can hold an accepted payload for a durable receiver and flush it on reconnection — store-and-forward across sessions — extending the guarantee past the boundary of Section 3, at the cost the persistent-identity axis already names.
- **With the acknowledgement model.** `acknowledgement-and-errors.md` reads against this floor: it expresses acceptance as a delivery commitment (Ack §4, mirroring Section 4 here), while discard-versus-error (Ack §6) and the error types (Ack §5) are independent of delivery mode and apply unchanged.
- **Beyond server failure.** The guarantee holds absent server failure; surviving a server crash with undelivered payloads intact is a further, separate strengthening (durable buffering), related to the persistence and recovery the base leaves implementation-defined (Architecture §8).

## 8. Security Considerations

- **Buffering is a memory-amplification surface.** Because the server may not drop accepted payloads (Section 5), a sender that floods a slow, blocked, or unreading receiver forces the server to retain ever more state — a denial-of-service lever the best-effort relay never hands an attacker, since it simply drops. A guaranteed-delivery server MUST bound this with flow control, per-edge or per-node quotas, and backpressure to the sender (Section 5); these are load-bearing for safety, not merely efficiency.
- **Backpressure propagates.** Throttling a `Send` to protect a slow receiver couples sender and receiver progress; an adversarial or stuck receiver can thereby slow its senders. Deployments SHOULD bound how long a sender may be blocked and MAY convert a sufficiently overdue delivery into a receiver departure (Section 3) rather than stall indefinitely.
- **Inherited considerations.** No-Misdelivery, confidentiality (the server still sees every payload), and self-scoping are as in the base (Delivery; Architecture §8; Core §6); guaranteed delivery adds reach and retention, not new trust in the server.

## 9. References

### 9.1. Normative References

- RFC 2119: Key words for use in RFCs to Indicate Requirement Levels.
- GRS Delivery and Consistency (`delivery-and-consistency.md`).
- GRS RPC Pushable Profile (`rpc-push-profile.md`).
- GRS RPC Common Core (`rpc-interface.md`).
- Graph Relay System (GRS) Protocol (`architecture.md`).

### 9.2. Informative References

- GRS Pushable Choreography (`push-based-choreography.md`): the flows whose `Deliver` arm this document upgrades.
- GRS Acknowledgement and Error Model (`acknowledgement-and-errors.md`): the sender-facing acknowledgement model that reads against this floor, expressing acceptance as a delivery commitment (Ack §4).
- GRS Unique Per-Session Node Identifiers (`unique-session-identity.md`): the ephemeral identity whose lifetime boundary this guarantee shares (Section 3).
