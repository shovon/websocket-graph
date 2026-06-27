# The Sending Rule

## Status of This Memo

This document is **non-normative**. It is the node-level companion to Path Emergence (`path-emergence.md`). Where that memo stands above the graph and watches a path form across the whole network, this one stands inside a single node and watches it decide. Same algorithm, opposite vantage. It fixes no wire format, mandates no field, and defines no conformance surface; when a future normative companion pins down the packet formats, the loop-detection rules, and the timeouts, that document carries the requirements, and this one carries the reasoning they were derived from.

Read it for the *local rule* and for why each branch of that rule is shaped the way it is. Nothing here uses RFC 2119 keywords, and where it appears to instruct a node, read "this is the behavior the requirements were built to produce," not "you must." Everything its bird's-eye companions assert from above — the two trails, the three legs, the quiet after the flood — this memo tries to *earn* from below, by showing the one rule that, run by everyone at once, adds up to all of it.

The register is the discursive one this corpus reserves for rationale. It is allowed to anthropomorphize the node — to let it "ask," "know," "decline" — because a node's-eye account is clearer when the node is a character, and to repeat a point when the point is load-bearing. The aim is for a person to be able to sit inside one node and feel why it does what it does, not for a machine to parse a procedure.

Section references resolve by name, not by location. Those of the form (Architecture §N) point into `../architecture.md`, (Relay §N) into `../relay-and-neighborhood-semantics.md`, and (Designator §N) into `../designator-string.md` — substrate documents that sit one level up from this folder. Companion overlay memos in this same folder are cited by filename, such as `path-emergence.md` and `path-completion.md`.

## Abstract

Seen from above (Path Emergence), discovery looks like a choreographed exchange: a request, a reply, a delivery — three legs of a handshake between two parties. Seen from inside a node, none of those words exist. A node knows one rule. When it has something to send, it asks whether it knows a trail to the destination; if it does, it walks that trail; if it does not, it floods, writing its own name onto the flood as the flood leaves it. That is the whole of it. The "reply" is the same rule, run by the node that received a flood and now, knowing no way back, floods in its turn. The "delivery" is the same rule, run by a node that this time happens to know the way. The legs and the requests and the replies are an outside observer's names for the pattern that appears when every node, knowing nothing of the pattern, runs the one rule. This memo is that rule, branch by branch, and the handful of things a node must keep straight to run it.

## Table of Contents

1. Why stand inside a node
2. The one rule
3. The first question: do I know the way?
4. Writing on the flood, and the guards that let it die
5. Arrival is not an ending: the target becomes an origin
6. The trail I build and the trail I carry
7. Walking a known trail: the self-check, and the relay that forgets
8. Nothing is proven until it answers
9. What a node never knows

## 1. Why stand inside a node

Path Emergence is written from a god's-eye view, and that is the right altitude for *believing* the dance — for seeing where each trail lives after each leg and trusting that both parties end up able to reach the other. But no one programs the dance. An implementer builds a node, not a network. They never write a function called "the network"; they write the thing one node does when a packet lands in its hands, and the collective behavior is not authored at all — it is what happens when many such nodes run at once. So there is room for a memo pitched exactly where the code is: inside a single node, working only from what that node can see.

And what a node can see is very little. It cannot see the graph. It cannot see where trails "exist" or that a trail exists "only at $B$" — that sentence is true but unspeakable from inside, because no node has the vantage to know it. It cannot see the party it is trying to reach. It sees three things and no more: packets arriving from its in-neighbors, the designators naming its own out-neighbors (Relay §2), and its own small, short memory. Every decision in this memo is made from those three and nothing else. That constraint is the whole interest of the node's-eye view: watch how much collective cleverness falls out of a node that is, individually, nearly blind.

The assumptions do not change from Path Emergence §2. A flood always arrives (Architecture §3); every node has a unique, recognizable ID; the world is perfect — every node honest, forwarding faithfully what it is handed. We are moving the camera, not rewriting the grants. What the perfect world papers over is, here as there, the next memo's problem.

## 2. The one rule

Here is the entire thing, before we slow down. Compressed to almost nothing, a node's behavior is:

    To send toward some party:
      I know a trail there?  ->  walk it — hand the packet to the
                                 designator of the trail's first hop.
      I don't?               ->  flood it — push a copy to every
                                 out-neighbor, and append my own name
                                 to the copy as it leaves.

Everything else in this memo is either a magnification of what "walk it" and "flood it" mean in practice, or one of the cases that *look* like a different behavior and turn out, on inspection, to be this same rule firing again. There is no second rule for replying. None for delivering. None for forwarding somebody else's flood. There is one rule, asked over and over, by every node, about whatever packet it currently holds.

Notice that the rule is phrased around an *act* — "to send toward some party" — and not around a *role*. A node running it does not know whether it is "the originator" or "the answerer" or "a relay." It knows it has something for somebody, and it knows whether it knows the way. That pair is the entire extent of a node's self-knowledge, and the rest of this memo is the argument that it is enough.

## 3. The first question: do I know the way?

Take the branch apart.

**Known trail — walk it.** The node holds, in its own memory, a recorded sequence of hops — each a pair of *(an ID, a designator)* — that it believes leads to the party it wants. It places that sequence into the packet and hands the packet to the designator of the first hop. Crucially, it leaves nothing of the trail behind in the network: the trail rides *in the packet*, not in any node along the way (Path Completion §3). The node's involvement ends the instant it forwards. Walking is cheap, quiet, and forgetful.

**Unknown trail — flood it.** The node has no such sequence. It cannot address the party directly, because the only names it can address are designators, and designators name *immediate out-neighbors only* (Relay §2) — and the party it wants is, by assumption, not one of them. So it falls back on the one move the substrate offers for reaching past the neighborhood: it pushes a copy of the packet to *every* out-neighbor and leans on strong connectivity to carry those copies everywhere, the target included (Path Emergence §2). There is no broadcast primitive to invoke; "flood" is nothing more exotic than "send, individually, to each out-neighbor." Flooding is expensive, loud, and — as the next section shows — self-limiting.

The asymmetry between the branches is the soul of the scheme: one branch is a whisper down a thin line, the other a shout across the whole graph. The point of everything is to pay the shout once and then live in the whisper. But — and this is the recurring lesson of the inside view — the node does not know this economy and does not act on it. It simply answers the question it is asked about the packet in hand, and acts. The amortization is real, but it is a satisfaction available only to someone standing outside, totting up the cost over time. Inside, there is just the question and the answer.

## 4. Writing on the flood, and the guards that let it die

When a node floods — whether because it *originated* the search or because it *received* someone else's and is passing it on; the rule does not distinguish, and neither does the node — it does two small things, and each matters out of all proportion to its size.

**First, it signs the flood.** Before forwarding a copy to a given out-neighbor, the node appends to the packet's accumulating trail one pair: *(my own ID, the designator I am about to forward along)*. This is how a trail builds itself with no one planning it. No node lays out a route; each merely records the single step it is taking, and the sequence of those records — by the time some copy comes to rest — is a faithful account of exactly how that copy traveled. The trail is a fossil of the flood's path, laid down one bone at a time, by nodes none of whom can see more than their own bone.

**Second, before forwarding at all, it decides whether this copy should be forwarded or dropped.** Not every copy that arrives deserves to be passed on — a node that forwarded every copy down every edge forever would *be* the storm the whole scheme exists to avoid. So a node, looking only at the copy in its hand and its own small memory, sometimes declines: it recognizes a copy it has effectively already handled, or one that has travelled far enough, and lets it die there. *By what precise rule* it recognizes such a copy is **loop detection**, and that rule is for the normative layer to pin down, not this memo. Assume here only that it is settled, and that under it every flood is a finite event with a finite reach.

What deserves emphasis from the inside is not the rule but its *shape*: whatever the rule turns out to be, the decision is **local** — a question the node answers about itself and the packet in its hand, with no view of the graph and no word from any other node. A flood dies not because some authority calls time on it, but because, copy by copy, individual nodes quietly decline to forward. Its death is as decentralized as its life: it ends everywhere and nowhere, the way it began.

The only lasting cost a node carries out of all this is whatever short memory that local decision needs — and it is short on purpose, needing to outlive only the flood it guards against. Once the flood has passed, the node forgets, and is stateless once more (Path Completion §3). A node spends almost nothing to be part of a flood, which is precisely why a flood can afford to touch everyone.

## 5. Arrival is not an ending: the target becomes an origin

Now the case that wears the costume of a new behavior and is, underneath, the same rule.

A flood copy lands at a node, and the node asks the question every node asks of every flood copy: *am I the party this search is looking for?* Almost always the answer is no, and the node is back in §4, signing and forwarding. But when the answer is *yes*, something quietly significant has happened, and the node must read it correctly or the whole scheme stalls here.

What the node now holds, in the packet's accumulating trail, is a complete trail from the origin *to itself*. Sit with what that is: it is the trail the **origin** would use to reach **this node** — discovered here, at the destination, by the one party who has no need of it. The origin, who *does* need it, does not even know it exists (Path Emergence §3, §4). The most useful thing in the network is sitting in the hands of the one node for whom it is useless.

So the rule fires again, and here is the crux of the whole memo. The node, having been the target, now *has something to send* — the trail it just discovered — *to a party*, the origin. By the only definition the rule recognizes, it is an **origin** now itself, sending toward the original origin. And it asks the one question it always asks: *do I know a trail to that party?* It does not — it never searched for them; it only received their search. So it floods. The very same rule. The "reply" is not a reply in any structural sense at all; it is a fresh origination, by a node that happens to be carrying some cargo, toward a party whose way it does not know.

This is the spot where the wording must be most careful, because intuition trained on two-way networks lies here, confidently and fatally. The node **cannot answer along the trail it just received.** That trail runs origin → here; its edges run that way and *only* that way (Architecture §3.1), and the node cannot step backward along a single one of them. "Send the trail back to its head" is a true description of the *goal* and a ruinous description of the *method*: the head of the trail is the **destination of a new search**, never the far end of a return walk. So whenever this memo, or its god's-eye companion, says a node "sends back" or "responds" or "answers," read it as: *originates afresh, toward the party named at the head, by the same flood-if-unknown rule as everything else.* There is no backward. There is only sending, again, toward someone new.

(This fresh flood — the second discovery, no reply but the same act — is the one that carries the found trail home as cargo; Completion §1.)

## 6. The trail I build and the trail I carry

Section 5 forces a distinction a node must hold firmly, because a single packet can contain *two* trails at once, and what the node may do with each could not be more opposite.

The **accumulating trail** is the one being built right now, by this flood, hop by hop. The node appends to it (§4); it is the node's to extend.

A **carried trail** — cargo — is a complete trail the packet is *ferrying on behalf of someone else*: the discovered route a target is sending home to an origin (§5). The node does not append to it, does not consult it for its own routing, does not so much as read it. It is freight. To the carrying node it is as opaque as the whole envelope is to the server that relays it — bytes to move, not bytes to act on.

The two look alike — both are sequences of *(ID, designator)* pairs — and that resemblance is exactly the hazard. A node must keep their roles straight by *where they sit in the envelope*, never by what they look like. Mistake one for the other and a node might extend cargo (silently corrupting another party's route) or ferry its own accumulating trail (building toward nothing). One way to make the separation structural rather than a rule to be remembered is to lean on the envelope's layering: let the cargo ride sealed in a layer the carrying node does not open, while the accumulating trail rides in the mutable transit layer the node is *meant* to append to. "Don't touch the freight" becomes, under layering, "you can't reach the freight" — a discipline turned into a fact, the kind of upgrade that matters all the more once carriers can no longer be assumed cooperative. But notice this is a forward glance at hardening, not a commitment this memo makes: sealing is deferred work, and in the perfect world this memo lives in, no node *would* maul the cargo, so the discipline alone — *keep the two straight by where they sit, never by what they look like* — is the whole of what is required here. That it is *cleaner* for no node to even be *able* to reach the freight is true, and is exactly why a later layer may harden the discipline into a fact; whether and how to do so is the sealing layer's to decide, not this memo's.

## 7. Walking a known trail: the self-check, and the relay that forgets

Return to the cheap branch and watch, from the inside, a node forward a *directed* packet — one carrying a known trail, being walked.

The node receives such a packet and does not flood and does not search. It looks into the trail for its own name. Finding its entry, it reads the designator paired with it and forwards there. That is the whole act. It plans nothing and, having forwarded, remembers nothing: the next hop was dictated by the packet, not by anything the node holds or held. This is the statelessness source routing prizes, seen from within — the relay is a momentary reader of one line in a list, and then it is done, and empty again, indistinguishable from a node that never saw the packet at all.

But before it acts, the node performs one check, and the check is the quiet hero of the entire steady state. It confirms that the entry it found carries *its own ID* — not merely that some designator happened to deliver the packet to it. The reason is that designators rot (Designator §5): the handle that meant "this node" when the trail was first laid down may, later, mean a different node, or nothing. If a rotted designator drops a packet at the wrong node, that node looks in the trail for *its* name where the next hop is expected, fails to find it, and drops the packet. A misroute thereby becomes a *clean stop* instead of a silent wrong delivery — caught, never invisible. The move is a node verifying a claim about *itself* — *am I the intended next hop? — I check my own name against the route entry* — rather than trusting the designator that delivered it.

So a node walking a trail trusts the trail's *structure* — it forwards along the designator the trail tells it to use — but it verifies its *own step*, acting only once the trail's record agrees that this packet was meant to reach it. The designator that delivered it is a hint; its own name in the expected slot is a fact. Kept distinct, hop by hop, all the way down the line.

## 8. Nothing is proven until it answers

A node that has just learned a trail — built it by flooding, or received it as cargo — knows one important thing about it: nothing. Arriving is not working (Path Completion §2). The trail was assembled under *flooding*, where copies fan out everywhere; the first time it is walked as a single directed line is a genuine first test, and in the interval a designator may have rotted, or a node may simply forward a flood and a directed packet to different places. From inside the node, the posture this demands is plain: a freshly learned trail is a *candidate*, and the only thing that will promote it to *proven* is an answer that comes home.

And the node cannot tell a dead trail from a slow one from a party that has departed — silence carries no information here (Relay §6). So it does the only honest thing available: it sets itself a patience, sends, and waits. If an end-to-end answer arrives back along the reciprocal trail, then something has now traveled each direction and something has returned; both trails are proven in the only way trails can be, and the node falls quiet (Path Completion §2, §3). If the patience runs out, the node learns just one fact — *the round trip did not close* — but that fact is enough to act on: treat the trail as not-yet-good and run the rule again, flooding afresh, with a backoff, so that a node in trouble does not become a node *making* trouble for an already-strained region (Path Completion §4).

One thing is worth saying once, plainly, from the node's own seat: a node never confirms a trail by being *told* it is good. Not by a relay's claim to have forwarded the packet, not by some neighbor's offer of a wonderful short route. It confirms a trail by *using* it and *hearing back*. The returning answer is the only authority a node recognizes — facts come home end to end, and everything a relay says along the way is a hint, however helpfully it is phrased.

## 9. What a node never knows

Step back out, now, having sat inside long enough to see the shape.

A node never knows it is sending a "request." It never knows it is sending a "reply" — to the node, the reply is just another origination toward a party it cannot yet reach. It never knows it is performing a "delivery," a "leg," a "handshake." It does not know there is a dance. What it knows is small and entirely local: *I have something for someone; do I know the way; if I do I walk it, if I don't I flood and sign my name; if something I'm carrying turns out to be for me, then I now have something for whoever sent it; and a trail is not real until it answers.* Five small facts, and not one of them so much as mentions the network.

Everything its bird's-eye companions narrate from above — the two trails that are never one, the three legs of the cold start, the quiet that settles after the flood — is what those five facts *produce* when every node, ignorant of all of it, runs them at once. That is the exact sense in which the path *emerges*: no node contains the path, plans the path, or knows the path is there. The path is the visible residue of a great many nearly-blind nodes, each answering one small question about the packet in its hand. Stand above it, and you see a handshake. Stand inside it, and there is only the rule. Both views are true, and they are the same thing seen from two distances. This memo was the inside.
