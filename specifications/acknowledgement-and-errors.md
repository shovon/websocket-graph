# GRS Acknowledgement and Error Model

## Status of This Memo

This document is a companion to the *GRS RPC Pushable Profile* (`rpc-push-profile.md`) for deployments that have adopted **guaranteed delivery** (`guaranteed-delivery.md`) as their relay floor. It fixes two things the base profile defers (Core §4.1, §5): whether and how the server **acknowledges** a client request — in particular the acceptance decision a `Send` carries — and whether and how it reports an **error**.

Because it reads against the guaranteed-delivery floor, it carries **none** of the best-effort caveats a weaker floor would force. There is no "acceptance is not delivery" hedge here: under guaranteed delivery, acceptance *is* a delivery commitment (Section 4). What remains is the part that was never about best-effort at all — the distinction between a message safely **discarded** and a request that **errored** (Section 6), which No-Misdelivery makes essential under any delivery floor.

It is opt-in, in the spirit of the other strengthening documents: a deployment chooses guaranteed delivery and this acknowledgement model together, and builds on the certainty they provide. Within it, request feedback remains the client's per-call choice — a `Send` MAY still be issued one-way (Section 2).

It is **not syntax-specific.** It fixes *what* an acknowledgement and an error mean, and *what outcomes and error types exist* — not how they are encoded; a concrete transport binding (for example a JSON one) supplies the wire form, the correlation mechanism, and any code values (Core §5). It changes none of the relay's guarantees: No-Misdelivery (Delivery §3), resolution against the current neighborhood (Delivery §4), and the guaranteed-delivery contract (GD §2) hold exactly as their documents state them.

Section references of the form (Push §N) point into `rpc-push-profile.md`, (GD §N) into `guaranteed-delivery.md`, (Core §N) into `rpc-interface.md`, (Delivery §N) into `delivery-and-consistency.md`, and (Architecture §N) into `architecture.md`.

## Table of Contents

1. Terminology
2. What Carries an Acknowledgement
3. The Acceptance Decision
4. Acceptance Is a Delivery Commitment
5. Errors
6. Discard Is Not an Error
7. What This Document Leaves to the Binding
8. Security Considerations
9. References

## 1. Terminology

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

This document uses all terms of the core (Core §1), the Pushable Profile (Push §1), and guaranteed delivery (GD §1), and adds:

- **Acknowledgement**: a server response to a client request reporting that request's outcome — a successful result or an error (Sections 3, 5).
- **Acceptance decision**: the successful outcome of a `Send` — that the server **accepted** the payload for delivery, or **discarded** it (Delivery §4; GD §2).
- **Error**: an outcome reporting that a request could not be processed as a well-formed operation (Section 5), distinct from a discard (Section 6).
- **Error type**: a member of the closed set of categories this document defines (Section 5).
- **One-way request**: a request issued without expecting a response; it receives neither acknowledgement nor error (Section 2).

## 2. What Carries an Acknowledgement

An acknowledgement is a property of the **client→server request direction**:

- **The client-initiated request** `Send` (Push §5.1) — the only operation a client invokes in this profile — MAY be acknowledged, or issued one-way.
- **Server-originated deliveries** (`Deliver`; Push §5.2) are **confirmed** under this floor: guaranteed delivery requires the receiver to acknowledge each delivered payload so the server can fulfil its contract (GD §5). That delivery confirmation is mandatory and belongs to the guaranteed-delivery mechanism, not to the discretionary request acknowledgement this document governs — the two are different channels and should not be conflated. `NeighborhoodUpdate` (Push §5.3) carries no acknowledgement of its own.

Acknowledgement of a `Send` is **opt-in.** A client may issue a `Send` one-way and forgo its acceptance decision. Under guaranteed delivery this is an especially clean choice — the payload will be delivered whether or not the client asked to hear the acceptance (Section 4) — but a one-way `Send` then learns nothing, not even that it was malformed, since it provides no channel for a response. A client that wants the acceptance decision (or an error) issues the `Send` expecting one. How a client marks a request as expecting a response, and how a response is matched to it on a connection where requests, responses, and pushes interleave, is a correlation concern left to the binding (Section 7); this document fixes only that every acknowledgement MUST be unambiguously associable with its request.

## 3. The Acceptance Decision

When a `Send` is acknowledged, its successful outcome is exactly one of:

- **Accepted** — the designator denoted a current out-neighbor of the sender (Delivery §4), and the server has taken the payload for guaranteed delivery to it (Section 4).
- **Discarded** — the designator did not denote a current out-neighbor — malformed, stale, or never valid — and the server dropped the payload (Delivery §3, §4). This is the No-Misdelivery safe outcome, not a fault (Section 6).

These two are the whole of a `Send` acknowledgement's success content; a `Send` may alternatively yield an error (Section 5).

Colloquially a client might call any non-accepted `Send` "rejected." This document splits that notion into two unrelated outcomes — a **discard** (a *success*: the relay did exactly what it should) and an **error** (Section 5: the request itself was faulty) — because conflating them misleads the client about what happened and what, if anything, to do about it (Section 6).

## 4. Acceptance Is a Delivery Commitment

Under guaranteed delivery, **accepted means will-be-delivered.** When the server accepts a `Send`, it has committed to delivering the payload to the out-neighbor it was accepted for — exactly once, in order (GD §2). A sender MAY rely on this: acceptance is a delivery commitment, and no separate end-to-end delivery receipt is needed for the ordinary case.

The commitment has one boundary, and only one: if the out-neighbor **departs** before the payload is delivered, the payload is not delivered, because there is no longer a node to deliver it to (GD §3). This is not a failure of the request and not an error (Section 5); it is the single point at which the guarantee lapses, at a node's death. A deployment MAY surface it to the sender as a delayed **delivery-failed-on-departure** signal, distinct from the acceptance decision, or leave it silent (GD §4). Where surfaced, it reports a delivery outcome — not a fault in the `Send`, which was accepted and correct.

So an accepted `Send` has exactly two eventual fates: delivered (the guaranteed, expected case), or undelivered solely because its out-neighbor departed first. A sender needs no other delivery bookkeeping.

## 5. Errors

An **error** reports that a request could not be processed as a well-formed operation — a failure *about the request*, before or apart from any resolution of a designator. It is **orthogonal to delivery**: an error is never a statement about whether a payload arrived. An error carries an **error type** (below), and MAY carry a human-readable **message** and structured **detail**; the message is diagnostic only, and a client MUST NOT depend on its text.

This document defines a closed set of error types:

- **Malformed** — the message could not be interpreted as a well-formed operation invocation.
- **Unknown operation** — the invocation named an operation this profile does not define, or one a client may not invoke (for example, a server-push name).
- **Invalid argument** — a known operation was invoked with a missing, ill-typed, or constraint-violating argument (for example, a `Send` lacking a designator, or a designator or payload not of the form a composed representation binding requires).
- **Not permitted** — a well-formed, understood request the caller may not invoke as its node or in its current state (for example, an authorization failure under a derivative that adds one); minimal in the base, where self-scoping by connection already bounds what a caller can name (Core §6).
- **Temporarily unavailable** — the server cannot service an otherwise-valid request at this moment — for example, under the flow control guaranteed delivery imposes to bound buffering (GD §5); the client MAY retry.
- **Internal error** — the server failed to process a valid request for reasons of its own.

A binding or derivative MAY define additional error types in a space it designates; a recipient that does not recognize a type MUST treat it as an unspecified failure rather than misclassify it. No error type reports the **content** of a payload, the **discard** of one (Section 6), or its **delivery outcome** (Section 4); errors concern only whether the server could act on the request.

## 6. Discard Is Not an Error

The central distinction in this document — and the one part of it that owes nothing to the delivery floor: a **discard** (Section 3) is a *successful* acknowledgement outcome, not an error (Section 5).

Guaranteed delivery strengthens the fate of *accepted* messages; it does not change *which* messages are accepted (GD §6). A `Send` whose designator denotes no current out-neighbor is resolved against the current neighborhood and safely dropped, upholding No-Misdelivery (Delivery §3, §4) — exactly as under any floor. The server did its job; nothing about the request was faulty, and nothing was lost that the guarantee ever covered, because the guarantee attaches only at acceptance (Section 4). Reporting a discard as an error would misrepresent a normal, expected outcome — one a graph change can cause at any instant (Delivery §4) — as a failure. **Accepted** and **discarded** are the two faces of a correct `Send`; an **error** is the absence of a correct `Send`.

## 7. What This Document Leaves to the Binding

Consistent with Core §5, the following are syntax, left to the transport binding:

- the wire encoding of an acknowledgement and of an error, and any concrete code values for the error types of Section 5;
- the **correlation** mechanism (Section 2);
- whether an acknowledgement is a distinct response message or folded into a request/response facility the transport already provides;
- the form of the optional delivery-failed-on-departure signal (Section 4), if a deployment surfaces it;
- maximum sizes and any limit on a message or its error detail (Delivery §7).

This document fixes the outcomes and their meaning; a binding gives them a form.

## 8. Security Considerations

- **The acceptance decision reveals nothing a caller did not already hold.** Accepted-versus-discarded distinguishes only whether the designator denotes one of the caller's *own current out-neighbors* — which the caller already learns from its own neighborhood state (Push §5.3). It is not a probe into any other node's neighborhood, consistent with self-scoping (Core §6).
- **Error detail can leak.** A human-readable message or structured detail (Section 5) may expose server internals; a server SHOULD keep error detail minimal and free of sensitive state, particularly for an `Internal error`.
- **Inherited considerations.** The buffering and backpressure surfaces guaranteed delivery introduces (GD §8) are governed there; confidentiality and self-scoping are as in the base (Architecture §8, Core §6).

## 9. References

### 9.1. Normative References

- RFC 2119: Key words for use in RFCs to Indicate Requirement Levels.
- GRS RPC Pushable Profile (`rpc-push-profile.md`).
- GRS Guaranteed Delivery (`guaranteed-delivery.md`).
- GRS RPC Common Core (`rpc-interface.md`).
- GRS Delivery and Consistency (`delivery-and-consistency.md`).
- Graph Relay System (GRS) Protocol (`architecture.md`).

### 9.2. Informative References

- GRS Pushable Choreography (`push-based-choreography.md`): the flows whose `Send` acceptance and `Deliver` confirmation this model describes.
