# Path Emergence

## Status of This Memo

This document is **non-normative**. Like the base architecture (`architecture.md`), it is aspirational: it sketches the shape of an algorithm and argues for that shape, but it fixes no wire format, mandates no field, and defines no conformance surface. It is the algorithm companion to the architecture, which describes the *substrate* clients build on. This memo is what that substrate was pointing at — but only its **first move**: how a single flood **discovers a trail** to a distant node. How that trail is then carried to the party who needs it, proven, reused, and replaced when it rots is the work of its companion, `path-completion.md`. This memo deliberately stops at discovery.

Read it for the *why* and the *how-in-outline*. When a future normative companion fixes the packet formats, the loop-detection rules, and the timeouts, that document carries the requirements; this one carries the reasoning they were derived from. Nothing here uses RFC 2119 keywords, and where it appears to instruct, read "this is the design the requirements were built to serve," not "you must."

The register is the discursive one this corpus reserves for rationale. It is allowed to walk through an example slowly, to name things with metaphors, and to repeat a point when the point is load-bearing. The step-by-step is meant to be *followed by a person*, not parsed by a machine; that is the whole reason it reads the way it does.

Section references resolve by name, not by location. Those of the form (Architecture §N) point into `../architecture.md`, (Relay §N) into `../relay-and-neighborhood-semantics.md`, and (Designator §N) into `../designator-string.md` — substrate documents that sit one level up from this folder. Companion overlay memos in this same folder are cited by filename, such as `path-completion.md` and `sending-rule.md`.

## Abstract

The substrate gives a node one move: send to an out-neighbor (Architecture §3.1). To reach a distant node $B$, a node $A$ can flood — push the message to every out-neighbor, who push it onward — and strong connectivity guarantees it arrives (Architecture §3). But flooding *every* message is intolerable: it costs the whole network's bandwidth to deliver one packet, and it does so again for the next. The thing we actually want is for a **path to emerge** from an initial flood and then be *reused*, so that the second message and the thousandth travel a thin line of nodes rather than drowning the graph.

This memo describes the first half of that emergence: **discovery**. A single flood, launched toward a target, lays down a record of how it travelled, and that record — a **trail** — comes to rest *at the target* as a reusable route. That is the whole of what is built here. The scheme is, in essence, the route-discovery phase of Dynamic Source Routing adapted to a network whose edges do not run both ways — and it is exactly that one-way property that makes discovery only *half* the story: the trail a flood lays is one-directional, and it is discovered at the wrong end from the party who will use it. Completing the path — a second discovery in the other direction, a directed delivery that carries each trail to the party who needs it, and the round trip that proves the pair — is deferred to `path-completion.md`. Here, one flood lays one trail.

## Table of Contents

1. The problem, stated as a cost
2. What we get to assume
3. Two trails, never one
4. The flood that lays a trail
5. What is discovered, and what is deferred

## 1. The problem, stated as a cost

A flood works. That is worth saying first, because everything below is an optimization of something that already functions: a node that floods a message reaches its target, guaranteed, by strong connectivity (Architecture §3). If correctness were the only axis, we could stop here and flood everything forever.

The trouble is the bill. A flood touches every node and every edge in the graph to deliver one payload — $O(E)$ sends for a single message — and it has no memory, so the next message to the same destination pays the same price again. A conversation of a hundred messages between two nodes, in a graph of ten thousand, spends a million sends on what should cost a hundred times the length of one thin path. Worse, floods collide: many nodes flooding many destinations is the broadcast-storm failure mode, where the network spends all its capacity carrying discovery and none carrying content.

So the goal is not to *replace* flooding but to *amortize* it. Pay the flood once, learn something durable from it, and let every subsequent message ride the thing you learned. The thing you learn is a **trail**: a recorded sequence of hops that is known to lead where you want. This memo is how that trail is *laid down* by a single flood; how it is then confirmed, used, and replaced when it rots is the work of `path-completion.md`.

## 2. What we get to assume

Two kinds of assumption hold this scheme up, and saying up front which is which is the honest thing to do. The first kind is a **contract we demand of the substrate** — two properties of the graph we send over, which something below us must make true. The second kind we simply *grant ourselves*, magically, and pay back in a later memo. The whole pleasure of what follows is watching a path emerge with exactly this much, and without the machinery that would otherwise crowd the view.

Take the contract first, and notice what it is a contract *for*: not a server, not a relay, not any particular medium, but a **graph** — nodes with directed edges — that keeps two promises. Whatever sits below and makes them true is its own affair; we name one such provider below, then forget it.

**A flood always arrives** (Architecture §3). The graph is strongly connected, so a message pushed to every out-neighbor, forwarded onward, reaches every node — including the one you are looking for, and including, when it is the target's turn to search, you. We never have to wonder *whether* a flood gets there; only what it costs and what it learns on the way. This one is real; we are owed it.

**A node may send only to its out-neighbors** (Architecture §3.1). The one move the graph offers is to hand a message to an out-neighbor, named by a designator. There is no broadcast, no send-to-anyone — and, the part a reader raised on two-way networks keeps forgetting, no reply path. An edge runs one way: a node cannot step back along the edge a message arrived on. The *only* way it ever reaches whoever sent to it is if that party independently happens to be one of its own out-neighbors — and then it is not answering at all, merely making an ordinary forward send like any other, which needs no special blessing here. So the scheme only ever moves *forward*. This is the fact §3 is built on. Flooding is only this move made over and over: with no broadcast primitive to lean on, to flood *is* to send a copy to each out-neighbor in turn.

Two things follow from the graph being *directed*, and they shape everything below. The first is the one just stated: there is no backward, so a reply is never a reply — it is a fresh forward send toward a party newly named. The second is that the scheme simply stops caring about in-edges. It assumes the substrate tells it *nothing* about where a message came from — no sender, no inbound route — and so carries its own: every scrap of identity and route in what follows is something the overlay *chose* to write into the packet, which is *why the trail must be built explicitly*, hop by hop, rather than read from below. Whether a particular substrate reveals anything about the edge a message arrived on is left undefined, and beside the point: the scheme neither uses it nor relies on it. We assume nothing inbound, and build forward.

*One provider, named once and then dropped.* In base GRS these two promises are kept by a central server that relays each message along an out-edge and is deliberately blind to any routing built atop it (Architecture §3, §3.1–3.2). But that server is **not our substrate — it is one witness that our substrate is buildable**, an existence proof rather than the floor we stand on. The edge it pays for by relaying could as easily be a direct channel two neighbors negotiate, or some other transport entirely; the contract above does not care which, and neither do we. (Nor do we demand any *secrecy* of it: a relay plainly *sees* what it carries, and an implementation is as free to tell a node which edge a message arrived on as to keep mum — the contract leaves it open, and the scheme leans on neither answer. The day hiding origin from the carrier itself matters, that is the overlay's to arrange by sealing, deferred to the hardening memo, `hardening-the-overlay.md`.) The relay is the provider's private business, and it does not appear again.

That is the entire contract: a strongly connected graph of one-way edges. The two remaining assumptions demand nothing of anyone — they are fictions we grant ourselves and dismantle later.

**Every node has a unique ID** (granted). Wave a hand: each node is born knowing a name for itself that no other node shares, stable across time, and any node can recognize any other's. Where this name comes from, why it might one day need to be a *key* rather than a mere label, how a node would prove a name is really its own — all of that is real work, and none of it is this memo's. Here a unique, stable, recognizable label is the entire requirement, and we grant it by fiat. Mind only the one distinction that *is* load-bearing: this ID is not a designator. A designator names the *next hop right now* (Relay §2) and may mean a different node a moment later; an ID names a *party across time*. A trail, as we will see, is built from both — a designator to take the next step, an ID to say who that step reaches.

**The world is perfect** (granted). Wave the other hand: every node is honest and cooperative. Carriers forward what they are handed, faithfully; no one drops a message out of spite, lies about a path it took, forges a name, or reads what it ferries to learn who is talking to whom. This is plainly false of any real network, and that is exactly the point — it is a lie we tell on purpose, so the path can emerge in clean air before we let the weather in. What changes when we stop telling it — signatures to catch the forger, redundancy to survive the dropper, sealing to blind the snoop — is the entire subject of a later memo. Not here. Here, everyone can be trusted, because the world is perfect.

## 3. Two trails, never one

Here is the fact that shapes the entire scheme, and the one a reader steeped in bidirectional networks will keep forgetting: **the path from $A$ to $B$ and the path from $B$ to $A$ are different things, discovered separately, and one cannot be turned into the other.**

Call them the **forward trail** $A \to B$ and the **return trail** $B \to A$. On the ordinary internet these are two directions of one pipe; here they are unrelated routes through the graph, because an edge runs one way (Architecture §3.1). If $A$ floods and the message reaches $B$ along some sequence of hops, $B$ now knows *a way that messages get from A to it* — but $B$ cannot reverse that sequence to answer, because none of those edges runs backward. To reach $A$, $B$ must discover its own trail, from scratch, by flooding in its turn.

This is why reaching back is not a step *within* one act but a *second instance of the same act*. An answer cannot retrace the question: $B$ reaching $A$ is its own independent discovery, flooded from scratch, with no relation to the trail $A$'s flood laid. And there is a deeper consequence — the one that shapes everything the companion memo does: the trail a flood lays is discovered at the *opposite* end from the party who will use it. $A$'s flood lays the $A \to B$ trail, but the finished record comes to rest at $B$, while $A$, who needs it in order to send, never sees it. Carrying each trail to the party who needs it, and proving the pair with a round trip, is the completion this memo defers (`path-completion.md`). What remains here is the single move both discoveries are built from: one flood laying one trail.

## 4. The flood that lays a trail

Let $A$ want to reach a distant node $B$, and let $A$ hold no trail to it. $A$ has only the one move the substrate offers — send to an out-neighbor — and $B$ is not one. So $A$ falls back on flooding, and a trail assembles itself as the flood runs. Write the forward trail it will produce as $P_{AB}$.

$A$ builds a discovery packet. Its header says, in effect, *"I am $A$, I am looking for $B$."* The rest of the packet is an empty list — the part that will accumulate the trail. $A$ sends a copy to each of its out-neighbors (there is no broadcast primitive; flooding *is* sending individually to each out-neighbor).

Each node that receives a copy appends to the trail a pair *(my ID, the designator I am about to forward along)*, forwards a copy onward to each of its own out-neighbors, and asks: *am I $B$?* That a flood *terminates* — fans out, reaches every node, then dies rather than circulating forever — is something this memo leans on throughout; *how* it terminates, the loop-detection rule by which a node drops a copy instead of forwarding it, is for the normative layer to pin down. Assume here only that it is settled.

When the node that is $B$ asks that question and the answer is yes, the copy it holds carries, in its accumulated list, a complete record of how a message travelled from $A$ to here — every hop's ID and the designator each used. **That record is $P_{AB}$, the forward trail, and it now exists at $B$.**

Note carefully *where* it exists, because it is the whole reason there is a companion memo. It exists **only** at $B$. $A$ does not have it. $A$ launched the flood but has no idea which branch reached $B$, or by what path, or even that it arrived at all. The forward trail was discovered at the far end from the party who will use it — the most useful thing the flood produced now sits in the hands of the one node that has no need of it.

And nothing here is yet *proven*. $P_{AB}$ was assembled under flooding, where copies fan out in every direction at once; it is a *candidate* — a record of how a flood once travelled, not a route yet shown to work when walked as a single directed line. Promoting a candidate to a proven trail, like carrying it home to $A$, belongs to completion (`path-completion.md`), not to discovery.

## 5. What is discovered, and what is deferred

Step back and take stock of exactly what one flood bought, because the honest accounting is also the map of what is left.

**What is discovered.** A single flood, launched by $A$ toward $B$, deposits at $B$ a trail $P_{AB}$: a hop-by-hop record — *(ID, designator)* pairs — of one way that messages travel from $A$ to $B$. It is laid down with no node planning it, each hop recording only the single step it took, and it costs one flood: $O(E)$ sends, paid once. This is the durable thing the introduction asked for — the residue a flood leaves behind, the seed a path emerges from.

**What is deferred — to `path-completion.md`.** Everything that turns that residue into a working conversation:

- *The trail is at the wrong end.* $P_{AB}$ sits at $B$, but $A$ is the one who will send along it. Getting it into $A$'s hands is completion's first job.
- *There is no way back.* The graph is directed (§3), so $B$ cannot answer along $P_{AB}$. A return trail $P_{BA}$ must be discovered by a second flood — the same act, run by $B$ — and it, too, will be discovered at the wrong end.
- *Nothing is proven.* A candidate trail is not a working one; only a round trip proves a pair. Confirmation, and what to do when it fails, is completion's.
- *Reuse and repair.* How traffic rides a proven trail in steady state, and how an endpoint copes when a trail rots, are completion's.

One thing does *not* wait for any of that, because it is already true of the trail this memo builds: nothing here is stronger than best effort. A flood always arrives (§2), so *discovery* is guaranteed — but the party you sought may depart a moment later, designators rot, and the only honest signal of trouble is an answer that never comes. Answers, though, are completion's subject, not this memo's. Discovery is the one thing a flood can promise outright; everything else is earned later, or not at all.

The rest — giving the granted unique ID real teeth as a key, and admitting the world was never perfect — is the subject of the hardening memo (`hardening-the-overlay.md`), not this one. Here, one flood lays one trail, and a path begins to emerge.
