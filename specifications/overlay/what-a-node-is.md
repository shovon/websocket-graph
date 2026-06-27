# What a Node Is

## Status of This Memo

This document is **non-normative**. It is an overview, and it means to be the front door to the overlay memos: the place a reader meets the single idea the others are built from before descending into any of them. It fixes no wire format, mandates no field, and defines no conformance surface.

Its method is worth naming, because it is the document's whole reason for existing. The other memos lean, again and again, on a phrase they treat as obvious — *"a node just runs one rule," "the reply is only another origination," "there is no dance, only the rule."* They say it the way a textbook says *the proof is left as an exercise for the reader*: true, and safe to assert, but unwritten. This memo is the supplied proof. It writes the node out in full, so that the thing the rest of the corpus rests its weight on is on the page rather than in the reader's trust.

The register is the discursive one this corpus reserves for rationale. It is allowed to argue, to use a metaphor, and to repeat a load-bearing point on purpose. Nothing here uses RFC 2119 keywords; where it appears to instruct, read "this is the model the other memos were built on," not "you must."

Section references resolve by name, not by location. Those of the form (Emergence §N) point into `path-emergence.md`, (Completion §N) into `path-completion.md`, and (Sending §N) into `sending-rule.md` — companions in this same folder. (Architecture §N) points into `../architecture.md` and (Payload §N) into `../payload-string.md` — substrate documents one level up.

## Abstract

A node looks as though it must be complicated. It floods, it forwards, it discovers paths, it answers, it repairs, it falls silent and tries again. But it is not complicated, and the point of this memo is to show why: every one of those behaviors is the same small thing wearing a different hat. A node is an actor that, when a message reaches it, makes three decisions by a contract every node shares — it **transforms** the message, it **chooses whom to hand it to**, and it **decides whether the chain goes on or stops** — reading and writing whatever local state the contract needs, and no more. That is the whole of a node. The behaviors the other memos name are those three decisions in different positions. The one thing a node does *not* do — keep the graph connected — is the one thing it cannot do from where it stands, and so the only thing left to the center.

## Table of Contents

1. What a node is — and the one thing it is not
2. Cooperation is a contract, not a kindness
3. The three acts, and the slate beneath them
4. One knob, many behaviors

## 1. What a node is — and the one thing it is not

Begin with what a node is *handed*. The substrate offers exactly one move: hand a message to an out-neighbor (Architecture §3.1). On that alone, end-to-end communication is impossible — to reach anyone who is not already your neighbor, some *other* node has to carry the message on your behalf, and then another, and another (Architecture §3.2). So every capability the system has above "speak to your neighbor" is manufactured, and manufactured the same way: by nodes relaying for one another. A node is therefore not a destination that occasionally sends. It is, first and most of the time, a *carrier for everyone else* — and only incidentally a source for itself.

Now define a node by its edge — by the one responsibility it is spared. A node does not keep the graph strongly connected. It *cannot*: connectivity is a property of the whole graph, and a node sees only its own neighborhood, never the shape it sits inside. A property no one can see locally cannot be maintained locally, so it is handed to the single party that does have the global view — the central manager (Architecture §3, §4). This is the fault line the entire system is organized along, and it is exact: **the manager owns the one guarantee that requires seeing everything; a node owns everything that can be done from a single seat.** A node is, almost precisely, *the set of things doable locally*. The manager is the one thing that is not.

## 2. Cooperation is a contract, not a kindness

Nodes carrying messages for each other is "cooperation," but strip the word of its warmth, because the warmth is misleading. No node forwards out of compassion, and none declines out of guilt. There is no fellow-feeling anywhere in this system and none is needed. Cooperation here is nothing but **rules a node has been programmed to obey** — a contract, identical at every node, cut into it the way teeth are cut into a gear. A gear does not mesh because it cares; it meshes because its shape leaves it no other option, and a node forwards for the same reason.

Saying it plainly buys two things. First, it tells you the system's behavior is *specified*, not hoped for: you can read the contract and know what every honest node will do with any message, without appealing to anyone's good nature. Second — and this is what makes the rest of the corpus legible — it draws the only line that will matter later. The "perfect world" the discovery memos assume is not a world of nice nodes; it is precisely *a world where every node honors the contract*. And the hardening still to come is precisely the study of nodes that do not — its untrusted-carrier stance, which assumes nothing about any carrier's honesty, is the whole posture. An untrusted carrier, there, is not a wicked node. It is a node that may not keep the contract. Leave compassion and guilt out of it, and the engineering stays clean: cooperation is conformance, and its failure is just nonconformance.

## 3. The three acts, and the slate beneath them

Here is the node, written out. When a message arrives — or when a node originates one, which is the same act with nothing behind it — the node runs its contract, and the contract is three decisions:

- **Transform.** What the node does to the message before letting it go on. It may append its own mark, the way a discovery flood records the hop it just took; it may spend down a budget; it may wrap a layer on or peel one off; or it may do nothing. This last case is worth dwelling on, because it is the line between substrate and overlay: the substrate carries a payload *verbatim*, the identity transform, which is exactly why the carrier stays blind to what it moves (Payload §4). The overlay is, precisely, the *non-identity* transforms — everything a flood comes to know, it knows because nodes wrote on the message as it passed. To transform is to compute, and the overlay's whole intelligence lives in transforms a blind substrate never performs.
- **Forward-set.** Whom the node hands the result to: some subset of its out-neighbors. None, one, or all — and as the next section shows, the *size* of that set is the single knob that turns one contract into every behavior the system has.
- **Stop.** Whether the chain ends here. The conditions are few and local: *this is for me* (consume it); *a budget is spent*; *I have seen this already*; *there is no valid next hop*; *the answer I was waiting for has come home*. A stop is only a predicate that ends the relaying — nothing grander.

Beneath the three sits a **slate**: whatever local state the contract reads and writes. A node may need to remember that it has seen a message, or to hold a route it has learned. But how much slate a node keeps is deliberately not part of what a node *is* — it is a materialization left to a lower layer (Completion §3). "Have I seen this?" can be answered from a remembered set *or* from a hop-budget the message carries; a route can be known from a table at the node *or* from the message itself. The three acts are the node; the slate is only the surface they work on, and it can be as thin as nothing or as thick as a cache without changing what a node, in essence, does.

## 4. One knob, many behaviors

Now collect the payoff. Of the three acts, a single knob — the size of the forward-set — turns the same unchanging node into every role the other memos give it. Each of the following is that one contract, with the knobs in a different position; not one is a new mechanism.

- Forward to **all** out-neighbors, transforming by appending the hop: a **flood** — and a flood that records its own path is **discovery** (Emergence §3).
- Forward to the **one** out-neighbor the route names: **routed delivery**, the quiet steady state once a path is known (Completion §3).
- Forward to **none**, and consume: **delivery** — the message was for you.
- Originate, then wait, and stop when an answer returns or patience runs out: **a request and the round trip that proves it** (Completion §2).
- Find that a search has reached you and that you now hold something its sender will want, and run the contract again toward them: **the "reply" — which is no reply at all, only a fresh origination** (Sending §5).
- Originate anew for the broken remainder of a route that has rotted: **repair** (Completion §4).

There is no "leg one" and no "leg two" here, and no dance, because there is nothing for the legs to be steps *of*: there is one contract, run over and over, by nodes that never know which role an onlooker would say they were playing. What reads as choreography from above is, from inside any single node, only the rule firing again (Sending §9).

So the other memos were within their rights to say *a node just runs one rule* and move on. This memo simply declined to leave it at that and wrote the rule down. There is nothing more to a node than the three acts and the slate they work on. Hand that contract to every participant, give the graph its one guarantee from the center, and everything else in this corpus is what follows.
