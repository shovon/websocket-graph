# Building a Trail

## Status of This Memo

This document is **non-normative**. It is the node's-eye companion to `path-emergence.md`: where that memo tells the flood as one global event — a trail emerging across the whole graph and coming to rest at its far end — this one stands at a single node's seat and runs the rule *by hand*, watching what one node reads, writes, branches on, and hands onward as a discovery passes through it. It fixes no wire format, mandates no field, and defines no conformance surface. It is a worked walk, not a specification.

It owns exactly one thing the other two memos leave on the table, and is careful to own nothing else. It does not re-argue what a flood *costs*, that a flood is *guaranteed to arrive*, or what discovery *defers* to completion — all of that is Emergence's, settled there, and merely cited here (Emergence §1, §2, §4); nor why the forward and return trails are *two routes and not one*, which is Completion's, settled there (Completion §1). Nor does it re-derive the node's contract — the three acts of **transform**, **forward-set**, and **stop**, and the **slate** beneath them — which is Node's (Node §3). This memo takes that contract as given and does the one thing neither parent does: it *runs* it, step by step, for the discovery case alone.

The register is the discursive one this corpus reserves for rationale. It may argue, lean on a metaphor, and repeat a load-bearing point on purpose. Nothing here uses RFC 2119 keywords; where it appears to instruct, read "this is the procedure the requirements were built to serve," not "you must." There is a one-line test for whether a sentence belongs in this memo at all: *could you write it without naming a single node's own read, write, or branch?* If yes, it is Emergence's, and it is not here. If a sentence only means anything as "*you, the node, holding this packet, do X*" — then it is this memo's, and that is the only kind of sentence below.

Section references resolve by name, not by location. Those of the form (Emergence §N) point into `path-emergence.md`, (Node §N) into `what-a-node-is.md`, (Completion §N) into `path-completion.md`, and (Sending §N) into `sending-rule.md` — companions in this same folder. (Architecture §N) points into `../architecture.md`, (Relay §N) into `../relay-and-neighborhood-semantics.md`, and (Designator §N) into `../designator-string.md` — substrate documents one level up.

## Abstract

A trail is built by a flood (Emergence §3), but a flood is not a thing any node ever sees. From above, a flood is a wave crossing the graph; from inside, there is no wave — there is only *you*, a node, with a packet in hand and a rule to run, and the wave is what an onlooker calls the sum of ten thousand nodes each running that rule once. This memo takes that inside view. It shows that the rule a node runs to build a trail has a single shape with **two ways in** — a packet arrives, *or* the node decides to originate — that flow into **one handler**, and that the handler is not a march of steps but a **branch**: test whether you have seen this before, test whether you are the one being sought, and only if both answers send you onward do you append your hop and fan out. It shows *where the trail lives* (on the packet, growing) as against *what the node keeps* (a thin slate, so it can recognize a repeat), and it corrects one thing the bird's-eye telling must blur: the hop a node records is written **once per out-edge, inside the fan-out**, so each copy carries the designator of the very edge it left by. That is the whole of building a trail, told as one node experiences it.

## Table of Contents

1. The node is the protagonist now
2. One door, two ways in
3. The handler is a branch, not a march
4. What you write, and where it lives
5. What you never get to know

## 1. The node is the protagonist now

Change the protagonist, and everything you can say changes with it.

Emergence's protagonist is the trail. Its sentences quantify over the graph — *every* node appends, the flood touches *every* edge, the record comes to rest at *B* — and in such sentences a node appears only as a verb in passing: it shows up, appends, forwards, and is gone before the next clause. Time runs once, $A$ to $B$, and the node is a step in a path the path-memo is really about.

Here the protagonist is the node, and the trail is the transient. A node is not a step in one flood; it is a standing thing that packets *pass through*, one after another, for as long as it is up. The same node that forwards a discovery for $B$ this second will forward one for $C$ the next, and later originate one of its own toward $D$, and it runs *the same handler* every time. Emergence never shows a node twice, because it never needs to — the flood it narrates happens once. This memo's natural unit is the opposite: one node, many packets, one rule fired again and again. That is not a finer-grained retelling of §4. It is a different object on the table, and §4 has nowhere to put it.

So read everything below as written from one chair. You are a node. You hold a packet, or you are about to make one. You cannot see the graph, you do not know there is a flood, and you have exactly the moves the substrate grants — hand a message to an out-neighbor (Architecture §3.1), and nothing more. Everything the system calls "discovery" is what happens when a great many chairs like yours each do the small thing this memo describes.

## 2. One door, two ways in

A handler needs an entrance. Ask where control enters, and the node's view immediately departs from the flood's, because the flood has one beginning — $A$ decides to search — while a node has **two ways the same handler starts**, and their sameness is the point.

The first way in is *a packet arrived*. The substrate handed you a discovery — someone, somewhere, is searching, and the copy in your hand carries a header naming who originated it and whom they seek, and a list of the hops it has crossed to reach you. You did not ask for it; it simply arrived, and the handler runs.

The second way in is *you decide to originate*. The layer above you wants to reach a distant node $B$ to which you hold no trail, so you must search. You build a discovery: a header that says, in effect, *"I am me, I am looking for $B$,"* and a list — **empty**. Then you run the handler.

Now see the thing this memo exists to make plain, which Node asserts in a single clause (Node §3, "the same act with nothing behind it") and Emergence shows once for $A$ as mere setup. **Originating is not a second mechanism. It is arrival with an empty list.** The handler does not branch on "am I the origin?"; it cannot even tell. The only difference between the node that starts a search and the node that relays one is the *state of the list when the handler begins* — empty in the first case, already populated in the second — and the handler treats both identically from its first instruction onward. There is one door. Origination is what it looks like when you walk in carrying a blank packet instead of one someone handed you.

## 3. The handler is a branch, not a march

Here is the handler, run by hand. Emergence §3 narrates it as a sequence — append, forward, then ask *am I $B$?* — and as a *global* account that is true. As a *procedure* it is the wrong shape, because those are not three things you do in a row; they are tests that *gate* one another, and getting the order and the gating right is the whole of the node's job.

**First branch: have I seen this before?** Before anything else, you ask whether this discovery is one you have already handled. You must — a flood fans copies down every path at once, and several will converge on you; if you forwarded each, copies would circle the graph forever and the flood would never die. So the first thing the handler does is consult your slate (§4) for a handle that identifies *this* search — call it a discovery id, some mark that distinguishes this flood from every other — and if you find it there, you **stop**: drop the copy, forward nothing, return. The chain ends at you, silently, and that is correct.

A word on what is yours to decide here and what is not. *That* this test sits first, before you touch the trail or fan anything out, is forced by where you sit — it is a node-seat fact, and this memo states it. *What* you key the test on, and how long your slate must remember it, is the loop-detection rule, and that is the normative layer's to fix; Emergence deferred it on purpose (Emergence §3), and this memo defers the same rule while insisting only on its *position*. The slot is here. What fills it is not ours.

If you have *not* seen it, you record that you have now — write the handle to your slate — and fall through.

**Second branch: am I the one being sought?** Read the target from the header and compare it against your own ID. If it is you, the search has arrived. You **stop**, but a different stop than the first: you do not drop the packet, you *consume* it — you hand its accumulated list up as the finished trail and let the layer above you do what it came to do (Completion §2 takes it from here). And notice what you do *not* do: you do not append your own hop, and you do not fan out. This is not an omission; it falls straight out of the next branch. The hop a node records is the edge it is *about to forward along*, and you are not forwarding — the message was *for you*. The trail ends with the hop of whoever handed it to you, because that was the last edge the message actually crossed. The target consuming without appending is the same rule, taking the branch that forwards to no one.

**Third branch: otherwise, carry it.** You are not the target, and you have not seen this before, so you do the work the flood is made of — you transform and you fan out (Node §3). To whom? To *all* your out-neighbors, because you hold no trail toward the target and have no basis to prefer one edge over another; with no broadcast primitive to lean on, "to all" means *send a copy to each, one at a time* (Architecture §3.1, Emergence §2). What transform? You append your hop. And exactly *how* you append it is the one detail the next section is for, because it is the place the global telling and the node's telling actually disagree.

There is no fourth branch, and there is no "leg one, leg two," no handshake, no choreography — just these three tests, run top to bottom, by a node that never learns which of them an onlooker would have called the interesting one (Node §4). What reads as a flood from above is this branch, fired once, in ten thousand chairs.

## 4. What you write, and where it lives

Two pieces of state move when a discovery passes through you, and the node's seat is the only vantage from which they are clearly *two*. Emergence speaks of the trail "accumulating," in the passive voice of a thing that assembles itself; from your chair there is nothing passive about it — there is something you write **onto the packet**, and something you write **into yourself**, and they are not the same and do not live in the same place.

**On the packet: the trail, growing.** The list in the header is the trail under construction, and your contribution to it is one entry: a pair *(your ID, the designator you forward along)* — your name, so the finished trail records *who* this hop reached, and the designator, so it records *how* the next step is taken (Emergence §3; the ID-versus-designator distinction is Emergence §2). This entry rides *out* with the packet. It is not yours to keep; the moment you forward, it belongs to the copy, and you will not see it again.

That the trail accumulates *on the packet* is not, here, one materialization among several — it is forced. Completion leaves open where a *proven* trail's knowledge lives once the path exists: in every packet, at the nodes, or split between them (Completion §3). But during the flood there is no such choice, because there is nowhere else to write. No node yet holds a route to the target — that is the whole reason a flood is running — so the only surface the growing trail can be written onto is the copy itself. The open question Completion raises is about the trail's *later life*; the worked walk here is its *birth*, and at birth the packet is the only slate there is.

**In yourself: the slate, thin.** The one thing you keep is whatever lets the first branch of §3 work — the handle by which you will recognize this same discovery if a sibling copy reaches you a moment later. That is the slate (Node §3), and for discovery it can be as little as a remembered set of marks. How thick it must be, and for how long it must hold, is a materialization left to a lower layer (Completion §3); the node, in essence, needs only *enough to not forward the same flood twice*.

Now the correction this section exists for — the detail §3 deferred and the one place a node's account *must* depart from the bird's-eye one, not merely refine it. Emergence writes the hop as "*(my ID, the designator I am about to forward along)*," singular, as though you append once and then forward. You cannot. You are forwarding to *every* out-neighbor, and the designator that names one out-neighbor is not the designator that names another — each edge has its own (Relay §2, Designator §2). So the append cannot happen *before* the fan-out, once; it happens *inside* it, once per edge. By hand, the third branch is really:

> for each out-neighbor: take a fresh copy of the packet; append *(your ID, the designator that names **this** out-neighbor)*; hand that copy to that out-neighbor.

The sibling copies that leave you are therefore *not identical* — they agree on everything the search arrived with, and differ in their last entry's designator, each naming the edge it personally departed by. This is not pedantry; it is the property that makes a trail usable at all. A trail is a record of edges *actually crossed*, and a copy can only honestly record the edge it *itself* left by. Write the designator once before the loop and every branch would carry the same edge in its trail — true of at most one of them, a lie in all the rest. The global sentence "the node appends its hop" is true the way "the company hired someone" is true; from your chair, you append once for each door you push the packet through.

## 5. What you never get to know

Close where only the node's seat can close: on its ignorance, which is total and which does not matter.

Run the handler to its end and you have appended your hop and pushed a copy out every edge — and you have no idea what became of any of them. You do not know if one reached the target. You do not know if *yours* was the copy that got there or one of the thousands that died at a seen-before check in some chair you will never hear of. You do not know there was a flood; you saw one packet, branched on it, and forwarded. You do not even know whether the search you just helped carry will succeed at all — the party being sought may have departed a hop ago, and you would forward toward them exactly the same (Emergence §4, on best-effort).

This is not a defect to be engineered away; it is the design working. A node that had to *know* the global outcome to play its part would need the global view, and the global view is precisely the one thing a node does not have and is not asked to have — it belongs to the center (Node §1). The trail gets built not because any node oversees the building but because none of them needs to: each runs the branch in §3, blind, and the trail assembles itself at the far end out of all that local, unwitting work. The node that originated the search is no wiser — it floods and learns nothing, because the finished trail comes to rest at the *other* end, in the hands of the one node that was looking for it (Emergence §3, §4). Carrying it back to where it is wanted is not this handler's job, nor a new one; it is this same handler, run again, by that far node, toward the origin (Sending §5, Completion §2).

So the whole of building a trail, from inside, is this: a blank packet or an arriving one comes to your door, you run one branch over it, you write one hop per edge and a mark on your own slate, and you forward into a dark you never see lit. Do that in every chair, and a path emerges that no chair planned. That is the rule firing again — and it is the only thing a node ever does.
