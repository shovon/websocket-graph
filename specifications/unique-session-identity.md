# GRS Unique Per-Session Node Identifiers

## Status of This Memo

This document is a concrete **identity binding** for GRS. It answers, with a single definite rule, the identity-persistence axis the architecture leaves deferred (Architecture §3): a node's identity is **ephemeral and per-session** — minted fresh when a node is established, and never carried across a node's lifetime boundary — and additionally **globally unique** and **never reused**. It exists for implementers and derivers who want a fixed rule to build on rather than the open choice the base leaves them.

It takes the base architecture's *default* — connection/session-scoped identity, a reconnect being a wholly new node (Architecture §3) — and strengthens it in exactly one direction the companions already permit (Delivery §2; designator-string §4): the per-session identifier is guaranteed distinct from every identifier any other node has ever held or will ever hold, and a retired identifier is never minted again. It does **not** take the other direction the axis offers: it provides **no** persistence across sessions (Section 7). A derivative wanting durable identity — for example a public key serving as a durable node identifier (Architecture §3) — is a different binding, answering the same axis the other way.

This identifier serves as the node's **designator** — the handle by which its in-neighbors address it (Architecture §2, Delivery §2) — so the binding fixes designator semantics as a consequence of fixing identity. It is **representation-agnostic** and composes with a representation binding such as `designator-string.md` (under which the identifier is a string). It is one binding among possible others, and is normative for implementations that adopt it. Section references of the form (Architecture §N) point into `architecture.md`, (Delivery §N) into `delivery-and-consistency.md`, and (Core §N) into `rpc-interface.md`.

## Table of Contents

1. Terminology
2. The Rule
3. Generation
4. Lifetime and Retirement
5. The Designator Is the Node's Identity
6. Resolution and No-Misdelivery
7. What This Binding Does Not Provide
8. Security Considerations
9. References

## 1. Terminology

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

This document uses the terms **Server**, **Client**, **Node**, **out-neighbor**, **in-neighbor**, **neighborhood**, **neighborhood state**, and **Designator** as defined in Architecture §2 and refined in Delivery §2, and **session** as in Core §4.4. A **node identifier** is the value this binding fixes: the per-session, globally unique, never-reused identity of one node, which also serves as that node's designator.

## 2. The Rule

When the server establishes a node — that is, at the start of each session (Core §4.4) — it assigns the node a **node identifier** carrying three guarantees:

1. **Per-session.** Exactly one identifier is minted per node, at establishment. A node never changes identifier during its lifetime, and a new session is a new node with a new identifier (Architecture §3).
2. **Globally unique.** The identifier is distinct from that of every other node the server has ever established or will ever establish, over the whole lifetime of the deployment — not merely among concurrently live nodes.
3. **Never reused.** Once a node departs, its identifier is retired permanently and is never minted again for any later node (Section 4).

Those three together are the entire rule. Everything else in this document either says how to satisfy them (Section 3), what follows from them (Sections 4–6), or what they deliberately do not give you (Section 7).

## 3. Generation

How the server mints identifiers satisfying Section 2 is implementation-defined; this binding fixes the guarantees, not the mechanism. Two families suffice, by way of non-normative example:

- **Monotonic.** A counter that only ever increases, optionally prefixed by a per-restart **epoch**, rendered as the identifier (e.g. `epoch ‖ counter`). Uniqueness and never-reuse follow from never counting backward, and no record of retired identifiers need be kept (Section 4).
- **Random.** A token drawn from a space large enough that collision is negligible (e.g. a version-4 UUID). Uniqueness is probabilistic but overwhelming; never-reuse follows from the same negligibility.

Two constraints make either correct, and are the load-bearing requirements behind Section 2:

- **Derive only from server-side, allocation-fresh state.** An identifier's seed MUST come from the server's own minting process — a counter tick, a fresh random draw — and MUST NOT be derived from any client-supplied or client-stable attribute. Deriving from a client attribute both risks collisions (two like clients colliding) and would smuggle in cross-session identity (Architecture §3, §3.2), which this binding does not provide (Section 7).
- **Uniqueness must span restarts.** A server restart MUST NOT mint an identifier equal to one issued before the restart, whether that earlier identifier is still live or already retired. A strictly increasing per-restart epoch, or a sufficiently large random space, satisfies this without persisting the set of issued identifiers. (Persistence of the graph itself remains implementation-defined; Architecture §8.)

The identifier space MUST be large enough that it is never exhausted over the deployment's lifetime; a scheme that could wrap and re-mint a value would violate never-reuse (Section 2).

## 4. Lifetime and Retirement

A node identifier is born with the node and dies with it:

- **Stable for the lifetime.** The identifier does not change while the node exists, including across any number of the node's neighborhood changes (Architecture §3). An in-neighbor holding it may rely on it denoting the same node for as long as that node lives.
- **Retired into vacancy.** When the node departs (Core §4.4), its identifier is retired. Retirement is **permanent, and to no one**: the identifier becomes a tombstone, not a reservation. It is never minted for a later node (Section 2) and — crucially — it is never reattached to a returning client, because there is no notion of a returning client (Architecture §3). A later session is a new node with a new identifier.

This is what makes a stale identifier **unambiguously and permanently dead**. An identifier a client once held either still denotes the same live node or denotes nothing at all; it can never have come to denote a *different* node. The "absolute certainty that a previously held identifier is no longer the same node," which the architecture requires before a handle may be treated as stale (Architecture §3), is here structural: a retired identifier resolves to nothing, forever.

## 5. The Designator Is the Node's Identity

Under this binding, a node's identifier **is** its designator: every in-neighbor that has the node as an out-neighbor denotes it by that one identifier (Delivery §2). Two consequences:

- **Per-state distinctness holds for free.** Because every node's identifier is globally unique, the designators of any node's out-neighbors are automatically distinct within every neighborhood state — the base requirement (Delivery §2) is met with no further effort.
- **The designator carries cross-state meaning, within a lifetime.** Unlike the base designator, which fixes no meaning beyond a single neighborhood state (designator-string §3), this identifier is stable across the node's lifetime (Section 4). A client MAY therefore compare it across its own successive neighborhood states to recognize "the same out-neighbor" as the graph changes around it — the cross-state meaning the base leaves to a future layer (Delivery §2), supplied here for the node's lifetime only.

Because all of a node's in-neighbors share the one identifier for it, two of them can — out of band — discover that they address a common out-neighbor. This is inherent in giving the node a single identity and is intended; it is also an information exposure the per-edge base designator does not have (Section 8).

Whether the server also discloses a node's *own* identifier to it is out of scope here; doing so bears nothing on self-scoping (Core §6), which rests on the session, not on naming.

## 6. Resolution and No-Misdelivery

Resolution is unchanged from the base: the server resolves a `Send` designator against the sender's **current** neighborhood and relays to the denoted out-neighbor, or discards (Delivery §3, §4). This binding does not touch that rule; it only constrains what identifiers the server may issue.

The interaction is wholly favorable. Because an identifier is never reused (Section 4), a `Send` carrying a stale identifier — one whose node has departed — resolves to nothing and is **discarded**, exactly as the base requires, with no possibility that it now denotes a different node. No-misdelivery (Delivery §3) holds as before, and the one residual hazard the base tolerates — a designator silently coming to denote a *different* out-neighbor after reuse — is eliminated outright. A client therefore needs no version or generation counter to tell a stale identifier from a current one: stale resolves to discard, permanently (Section 4).

## 7. What This Binding Does Not Provide

- **No persistence across sessions.** This is the *ephemeral* answer to the identity-persistence axis (Architecture §3). A node that departs and a client that later returns are unrelated nodes with unrelated identifiers; nothing an in-neighbor held survives the departed node's death. A deployment needing durable identity wants the *other* answer to the axis — a persistent-identity binding (e.g. a public key as a durable identifier; Architecture §3) — not this one.
- **No participant identity.** That two sessions belong to the same real-world client is neither expressed nor expressible here; the server has no such concept (Architecture §3). Any continuity of *participant* identity is constructed above the relay (Architecture §3.2), independent of these identifiers.
- **No ordering or versioning of neighborhood state.** An identifier names a node, not a state; it says nothing about which of two neighborhood states is newer. State ordering remains deferred (Core §3).

## 8. Security Considerations

This binding inherits Core §6 and Architecture §8, and — where it is realized as a string — the designator considerations of designator-string §7, adding only what fixing identity makes concrete.

- **Identifiers are not capabilities.** As in the base (designator-string §7), no-misdelivery rests on resolving every `Send` against the caller's *current* neighborhood, not on an identifier being unguessable. A guessed or forged identifier relays only if it already denotes one of the caller's own current out-neighbors, and is otherwise discarded. Predictable identifiers (e.g. a monotonic counter) are therefore safe for correctness.
- **A predictable identifier leaks structure.** A monotonic scheme exposes node creation order and rough population — and, because the identifier is global, lets holders correlate a shared out-neighbor (Section 5). A deployment wishing to avoid this SHOULD mint high-entropy random identifiers instead; this is a confidentiality choice, not a correctness one.
- **Restart collisions.** Failing to make uniqueness span a restart (Section 3) can re-mint a live or retired identifier, reintroducing exactly the cross-node ambiguity this binding exists to remove. A strictly increasing epoch, or a large random space, is the guard.

## 9. References

### 9.1. Normative References

- RFC 2119: Key words for use in RFCs to Indicate Requirement Levels.
- Graph Relay System (GRS) Protocol (`architecture.md`).
- GRS Delivery and Consistency (`delivery-and-consistency.md`).
- GRS RPC Common Core (`rpc-interface.md`).

### 9.2. Informative References

- GRS Designator String Representation (`designator-string.md`): the representation binding this one composes with; under it, an identifier is a string, and §4's "global uniqueness" and "stability across states" are the strengthenings this binding makes mandatory.
- GRS Payload String Representation (`payload-string.md`): a sibling cross-cutting binding.
- RFC 4122: A Universally Unique IDentifier (UUID) URN Namespace — one example random mechanism for Section 3.
