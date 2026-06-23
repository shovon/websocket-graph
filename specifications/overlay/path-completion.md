# Path Completion

## Status of This Memo

This document is **non-normative**. It is the companion to Path Emergence (`path-emergence.md`) and picks up exactly where that memo stops: a single flood has laid a trail, and that trail has come to rest at the *target* — the wrong end from the party who will use it. Path Emergence built one trail; this memo completes the act, turning a discovered-but-stranded trail into a proven, reusable, two-way conversation. Like its companion it is aspirational: it sketches the shape of the algorithm and argues for it, fixing no wire format, mandating no field, and defining no conformance surface.

Read it for the *why* and the *how-in-outline*. When a future normative companion fixes the packet formats, the loop-detection rules, and the timeouts, that document carries the requirements; this one carries the reasoning they were derived from. Nothing here uses RFC 2119 keywords, and where it appears to instruct, read "this is the design the requirements were built to serve," not "you must."

The register is the discursive one this corpus reserves for rationale. It is allowed to walk through an example slowly, to name things with metaphors, and to repeat a point when the point is load-bearing. The step-by-step is meant to be *followed by a person*, not parsed by a machine.

Section references resolve by name, not by location. Those of the form (Emergence §N) point into `path-emergence.md` — its companion in this same folder. Those of the form (Architecture §N) point into `../architecture.md`, (Relay §N) into `../relay-and-neighborhood-semantics.md`, and (Designator §N) into `../designator-string.md` — substrate documents that sit one level up. Companion overlay memos in this same folder are cited by filename, such as `sending-rule.md`.

## Abstract

Path Emergence (`path-emergence.md`) ends on a puzzle it deliberately leaves open: a flood from $A$ seeking $B$ lays a forward trail $P_{AB}$, but that trail comes to rest at $B$ — and $B$ cannot reverse it, because the graph is directed (Emergence §3). So after one flood the party who needs the trail does not hold it, and the party who holds it cannot use it. This memo closes that gap. It completes the cold start with a second flood and a single directed delivery; it folds confirmation into ordinary traffic, so a trail is proven by a real round trip rather than by a separate handshake; it describes the quiet steady state in which messages ride the proven trails at the price of their length; and it says what to do when a trail rots. Two floods and a thread, then reuse — that is the whole arc, of which Path Emergence was the first flood.

## Table of Contents

1. Where we pick up
2. Completing the cold start: the return flood and the directed thread
3. Candidate until proven: confirmation folded into traffic
4. Steady state: the quiet after the flood
5. When a trail goes cold
6. Economies the structure hands us
7. What emerges, and what does not

## 1. Where we pick up

Path Emergence left us with exactly one thing: a forward trail $P_{AB}$, a hop-by-hop record of how a flood travelled from $A$ to $B$, sitting in $B$'s hands (Emergence §4). Three facts about it set this memo's whole agenda, and all three trace to the graph being directed (Emergence §3):

- $A$, who will send along $P_{AB}$, does not have it — $A$ never learned which branch of its flood reached $B$.
- $B$, who holds it, cannot use it to answer — its edges run $A \to B$, never back.
- Neither party yet knows the trail *works*; it was laid under flooding and has never been walked as a single directed line.

So completion has three jobs, and the next sections are those jobs: discover a return trail (a second flood), get each trail into the hands of the party who needs it (a directed delivery), and prove the pair (a round trip). Write the forward trail as $P_{AB}$ and the return trail as $P_{BA}$.

## 2. Completing the cold start: the return flood and the directed thread

**The return flood that ferries the forward trail.** $B$ now wants to do two things at once, and the elegance of the scheme is that one packet does both. $B$ needs to find its own trail to $A$ (it has none, and $P_{AB}$ cannot be reversed), and $B$ needs to get $P_{AB}$ into $A$'s hands (since $A$ is the one who will send along it). So $B$ floods a search of its own — header: *"I am $B$, I am looking for $A$"* — and **inside that packet it carries $P_{AB}$**, the forward trail it just learned, addressed to $A$.

This second flood behaves exactly like the first (Emergence §4): each hop appends *(my ID, my designator)* to the trail, and the same loop detection that bounds the first flood bounds this one. Because a flood always arrives (Emergence §2), it reaches $A$. And when it does, the packet $A$ holds contains *both* trails at last: $P_{AB}$, ferried intact inside it, and $P_{BA}$ — the return trail — freshly accumulated by this very flood. **Both trails now exist at $A$.**

One thing this leg quietly fixes is worth dwelling on: there is no bowtie problem here. One might worry that a single probe sent to "come home on its own" could never pass through both parties, because a strongly connected graph need not have a simple cycle through any given pair. But this is a *full flood*, not a lone probe — it reaches *every* node, $A$ included, unconditionally. By choosing to flood the reply rather than hoping a probe loops back, the scheme sidesteps that hazard entirely. The cost is a second flood; the reward is a guarantee.

**The directed delivery that closes the loop.** Take stock. After the return flood, $A$ holds both trails. $B$ holds only $P_{AB}$ — it still has *no way to reach $A$*, because $P_{BA}$ was discovered at $A$'s end and $B$ has never seen it. If we stopped now, $A$ could talk to $B$ and $B$ could not answer. The conversation would be half-mute.

So $A$ performs the one leg that is not a flood. It now knows $P_{AB}$, a working way to reach $B$, so it simply *uses* it: it source-routes a packet down $P_{AB}$, carrying $P_{BA}$, to deliver the return trail into $B$'s hands. This is cheap. It is not a flood; it is a single thin line of forwarding along a trail $A$ just learned. When it arrives, **$B$ holds $P_{BA}$**, and both parties can now reach the other.

That is the whole cold start: flood out (Emergence §4), flood back carrying the forward trail, then a directed leg carrying the return trail home. Two floods and a thread. Everything after this is reuse.

It is fair to ask why the directed leg cannot be avoided — why two floods do not suffice. The answer is the directionality fact one more time (Emergence §3): the return trail is *manufactured at $A$* as a byproduct of $B$'s flood, but it is *$B$* who needs it, and the only node positioned to carry it from $A$ to $B$ is $A$, along the only trail anyone has yet proven, $P_{AB}$. Some node must ferry the return trail from the end where it was discovered to the end where it is used. That ferry is the third leg, and nothing cheaper will do.

## 3. Candidate until proven: confirmation folded into traffic

Nothing discovered so far is yet *proven*. Every trail is a *candidate*: it arrived, but arriving is not the same as working — and even in the perfect world Path Emergence assumes (Emergence §2), where no one lies or refuses, things still *rot*. There is a particularly sharp reason to be wary here. $P_{AB}$ was assembled by *flooding* — by pushing to every out-neighbor — and the directed delivery is the very first time it is used as a *directed* route, one specific hop after another. A trail that forms fine under flooding can still fail under directed use: a designator may have rotted in the interval (Designator §5), or a hop may simply forward a flood and a directed packet to different places. So the directed leg is not a confirmation; it is the *first test*.

Rather than bolt on a separate "is the trail good?" handshake, the scheme folds confirmation into ordinary traffic. The directed leg already sends a packet from $A$ to $B$; let it carry $A$'s first real message too, stapled alongside the return trail. When $B$ receives it, $B$ answers — not with a flood, but by source-routing an acknowledgement back along $P_{BA}$, the return trail it just received. That acknowledgement is the hinge. If it reaches $A$, then a packet has made the full round trip — $A \to B$ along $P_{AB}$, $B \to A$ along $P_{BA}$ — under directed routing. *Both* trails are now proven in the only way trails can be proven: something travelled them and something came back. They graduate from candidate to working, and the conversation proceeds.

If the acknowledgement does *not* come — within some patience the normative layer will pin down — then $A$ learns nothing specific (silence is ambiguous; it could be a dead trail, a dropped ack, a departed $B$), but it learns enough: the round trip did not close, so the trails are not yet to be trusted, and discovery must be tried again. Note this also covers the case where the directed leg itself died: $B$, having initiated the return flood, can expect its fruit, and re-floods if none arrives. The two ends watch the same silence from opposite sides.

## 4. Steady state: the quiet after the flood

Once both trails are proven, the network goes quiet. $A$ sends to $B$ by placing $P_{AB}$ in a data packet and forwarding to the first hop's designator; each node along the way finds *its own ID* in the trail, forwards along the designator paired with it, and passes the packet on. $B$ answers along $P_{BA}$ the same way. No flood, no broadcast, no per-message search — just two thin lines of forwarding, one in each direction, at a cost proportional to trail length rather than network size. This is the emergence the whole scheme was after: the path is laid, and traffic flows along it.

Two properties of this steady state are worth making explicit, because they are why the scheme suits *this* substrate rather than merely working on it.

**Carriers hold no state.** The trail lives entirely in the packet; a carrier reads which hop is its own, forwards, and forgets. There is no routing table at a carrier, no per-conversation entry, nothing to corrupt and nothing for the system to garbage-collect. The only memory anywhere is the short-lived bookkeeping a node keeps while a flood passes through it, and the trails the two *endpoints* cache. Source routing is what buys this, and statelessness is a property worth having for its own sake — and one that will matter all the more once the world stops being perfect and a carrier's memory becomes something worth reaching into.

**The per-hop ID check is what keeps a rotting trail honest.** Designators are not stable (Designator §5): the handle a trail recorded for some hop may, later, denote a different out-neighbor, or none. Resolution against the current neighborhood does *not* save us here, because if the handle now legitimately denotes a different node, delivering there is not a substrate error — it is the overlay's problem. The defense is that every trail entry carries the *ID* of the hop it expects, and each node, on receiving a data packet, checks that the next expected ID is its own before acting. If a rotted designator delivers the packet to the wrong node, that node looks for its ID, does not find it where the trail expects, and drops the packet. Mis-routing becomes a clean failure — caught, never silent — and a clean failure is something repair can respond to.

## 5. When a trail goes cold

Trails are leases, not circuits. Nodes leave, the graph is repaired around them (Architecture §3), designators are reassigned — and a trail that worked a minute ago may, without warning, carry a packet into a dead end. Because silence means nothing here, the only honest signal is the *absence of an expected acknowledgement*: a node that source-routes a message and hears nothing back, past its patience, must presume the trail dead.

The response is to rediscover — to run the cold start again — but with two disciplines that keep rediscovery from becoming the very broadcast storm we set out to avoid. First, **back off**: a node whose trail just failed should not re-flood instantly and repeatedly; it should wait, longer each time, so a partitioned or congested region is not buried under retries. Second, **keep more than one trail**. The floods of discovery and of the return search do not deliver a single copy; they deliver *many*, arriving by many routes. Rather than keep the first and discard the rest, an endpoint can retain a handful of distinct trails, so that when the primary fails it fails over to a spare *without flooding at all*. Discovery is the expensive thing; having paid for it, harvest more than one path from it.

None of this makes a trail permanent, and it should not try to. The aspiration is not a circuit that never breaks but a trail that is cheap to relay along while it lasts and cheap to replace when it does not.

## 6. Economies the structure hands us

Two optimizations fall out of the scheme without new machinery, and neither needs the world to be perfect — they will still be here when it isn't.

**Let the directed leg carry the first message.** The third leg is already a directed packet from $A$ to $B$; there is no reason to spend it solely on delivering the return trail. Staple $A$'s first real payload to it. Discovery and the first message become a single arrival, and the acknowledgement that confirms the trails (§3) is also the acknowledgement of real content. The handshake pays for itself by carrying freight.

**Let a lucky cycle collapse the dance.** If $A$'s initial discovery flood (Emergence §4) happens to travel a cycle that returns to $A$ — passing through $B$ and continuing back to its origin — then the copy that arrives home already carries $A \to \dots \to B \to \dots \to A$: the forward trail as its prefix, the return trail as its suffix. $A$ learns both at once, skips the return flood entirely, and proceeds straight to the directed delivery. On a ring topology (Architecture §3) this is not luck but certainty, and the cold start is one flood, not two. It is a fast path worth checking for and never worth depending on — in a general graph no such cycle need exist (this is the bowtie again), which is exactly why the return flood remains the reliable road.

A third economy is sitting right here too, but it only means anything once we stop pretending the world is perfect, so it waits for the memo that does (`hardening-the-overlay.md`): in the return flood, $B$'s search carries $P_{AB}$ across the whole network, and every carrier it crosses could read the forward trail and both names — who is talking to whom, by what route. Since $B$ is searching for $A$ by name, it is exactly positioned to seal that cargo so only $A$ can open it, and the route would travel in the dark. Worth noting now, worth building later. In a perfect world there is no one to hide from.

## 7. What emerges, and what does not

What emerges is the thing Path Emergence's opening asked for (Emergence §1): after a bounded, one-time cost — two floods and a directed thread — a pair of trails exists, proven by a real round trip, and every message thereafter rides those trails at the price of their length rather than the price of the whole graph. The flooding stops. Carriers stay stateless. Both directions work, discovered honestly as the independent routes they are. A path has emerged.

What does not emerge is anything stronger than best effort, and the memo would be dishonest to imply otherwise — even with everyone cooperating. The trails are leases that rot and must be replaced, because nodes leave and the graph is repaired around them whether or not anyone misbehaves (Architecture §3). The scheme guarantees *discovery* and *reuse*; it does not guarantee *delivery*, because the party you want may simply be gone, and the only honest signal of trouble is an answer that did not come. That much is true even in the perfect world.

The rest — everything the perfect world papers over — is the deferred work, and it is exactly the two granted assumptions of Path Emergence (Emergence §2) coming due. Give the unique ID real teeth and it becomes a key: signatures to catch a carrier that forges a name or alters a trail, names a node can actually *prove*. Stop granting the perfect world and the whole catalog opens: surviving deliberate dropping, resisting the analysis of who-talks-to-whom, pricing floods against abuse, sealing a ferried trail from the carriers that carry it. None of it changes the dance above; all of it bolts onto the dance above — which is the hardening memo's subject (`hardening-the-overlay.md`), not this one's.
