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
2. Completing the cold start: importing the knowledge each end lacks
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

## 2. Completing the cold start: importing the knowledge each end lacks

Completion answers one question, and only one, at each step — the question the whole memo turns on (§4): *the knowledge this step needs — does it already exist somewhere, or nowhere?* Where it exists, you move or reuse it; where it exists nowhere, you manufacture it, and the only instrument that manufactures route-knowledge out of nothing is a flood. Ask that question of the two trails in turn, and the cold start falls out on its own, with nothing left to recount as a procedure.

**The return trail exists nowhere, so it has to be flooded for.** $B$ holds $P_{AB}$ but cannot reverse it (Emergence §3), and no node anywhere has ever been asked for a way to $A$: the knowledge does not yet exist, in any form, at any node. So $B$ has no choice but to manufacture it the only way absent knowledge can be manufactured — by flooding, *"I am $B$, looking for $A$."* A lone probe sent to find its own way home would not serve, because a strongly connected graph need not hold a simple cycle through both parties (the bowtie); a full flood reaches *every* node, $A$ included, unconditionally (Emergence §2). A whole flood is the price of conjuring return-knowledge from nothing, and there is no cheaper instrument. This — beneath the narration — is all that the return flood, "leg 2" in the older telling, ever was: not a step in a dance, but the one place the substrate's directedness makes you pay full price for knowledge that exists nowhere else.

**The forward trail exists, only at the wrong end — so the same flood ferries it for free.** $P_{AB}$ is already real; it is merely held by $B$, the party with no use for it, while $A$, who will send along it, lacks it. That asks not for manufacture but for a *move*, $B \to A$. Yet $B$ cannot simply send it — having no path to $A$ is the very lack it is flooding to repair. So the move costs nothing of its own: $B$ tucks $P_{AB}$ *inside* the flood it must send regardless, and when that flood arrives, $A$ holds both at once — $P_{AB}$ ferried intact, $P_{BA}$ accumulated by the flood's own passage. **$A$ now knows both trails.** The misplaced knowledge simply rides along on the manufacturing of the absent knowledge; one flood does the work because only one was ever forced.

**The last gap needs no flood at all, because the knowledge to close it already exists.** $A$ holds both trails now; $B$ still holds only $P_{AB}$ and cannot yet answer, since $P_{BA}$ was born at $A$'s end and $B$ has never seen it. But this, too, is only a move — and its mover already has what the move requires: $A$ knows $P_{AB}$, a working way to reach $B$. So $A$ does not flood; it *uses* what it knows, sending $P_{BA}$ along $P_{AB}$ into $B$'s hands. Same question, opposite answer — the knowledge exists, at $A$ — and so reuse stands in for manufacture, a directed delivery for a second flood.

And that is the entire cold start. It was not recounted; it was *derived* — three answers to a single question about where knowledge sits. "Two floods and a thread" is the shape those answers happen to take, a consequence of the substrate, never a recipe imposed on it.

> The one question admits shortcuts whenever knowledge happens to be lying around already. Should a flood cross a node that *already* knows the rest of the way — to $B$ during the search, or to $A$ on the way home — that node can answer from what it holds and spare the flood the remaining distance; should a proven trail later break mid-path, the break-point can re-import only the missing remainder instead of failing the whole route back to its origin. Both are the same corollary — *reuse knowledge wherever it already exists* — moved off the endpoints and into the interior. And both buy their savings with questions this memo will not answer: how fresh the borrowed knowledge is, which node is entitled to vouch for it, and who comes to learn of a local repair — the last of which, pressed even a little, reopens the very reverse-path problem the return flood exists to solve. They are choices for a layer that names materializations; here they are noticed, and left to it.

## 3. Candidate until proven: confirmation folded into traffic

Nothing discovered so far is yet *proven*. Every trail is a *candidate*: it arrived, but arriving is not the same as working — and even in the perfect world Path Emergence assumes (Emergence §2), where no one lies or refuses, things still *rot*. There is a particularly sharp reason to be wary here. $P_{AB}$ was assembled by *flooding* — by pushing to every out-neighbor — and the directed delivery is the very first time it is used as a *directed* route, one specific hop after another. A trail that forms fine under flooding can still fail under directed use: a designator may have rotted in the interval (Designator §5), or a hop may simply forward a flood and a directed packet to different places. So the directed leg is not a confirmation; it is the *first test*.

Rather than bolt on a separate "is the trail good?" handshake, the scheme folds confirmation into ordinary traffic. The directed leg already sends a packet from $A$ to $B$; let it carry $A$'s first real message too, stapled alongside the return trail. When $B$ receives it, $B$ answers — not with a flood, but by sending an acknowledgement back along $P_{BA}$, the return trail it just received. That acknowledgement is the hinge. If it reaches $A$, then a packet has made the full round trip — $A \to B$ along $P_{AB}$, $B \to A$ along $P_{BA}$ — under directed routing. *Both* trails are now proven in the only way trails can be proven: something travelled them and something came back. They graduate from candidate to working, and the conversation proceeds.

If the acknowledgement does *not* come — within some patience the normative layer will pin down — then $A$ learns nothing specific (silence is ambiguous; it could be a dead trail, a dropped ack, a departed $B$), but it learns enough: the round trip did not close, so the trails are not yet to be trusted, and discovery must be tried again. Note this also covers the case where the directed leg itself died: $B$, having initiated the return flood, can expect its fruit, and re-floods if none arrives. The two ends watch the same silence from opposite sides.

## 4. Steady state: the quiet after the flood

Once both trails are proven, the network goes quiet. $A$ sends to $B$ along $P_{AB}$, and $B$ answers along $P_{BA}$: the message advances one hop at a time, each node passing it to the next one the route names, until it arrives. No flood, no broadcast, no per-message search — just two thin lines of forwarding, one in each direction, at a cost proportional to trail length rather than network size. This is the emergence the whole scheme was after: the path is laid, and traffic flows along it.

Two properties of this steady state are worth making explicit, because they are what the scheme actually commits to — and, just as tellingly, what it does not.

**The route is knowledge, and that is the whole of what the scheme fixes — not where the knowledge lives.** For a message to advance, each hop must *know* which way to pass it; for an endpoint to originate at all, it must know the trail entire. That knowing is the requirement, and it is the level at which this memo means to stay. *How* the knowledge is held is left open on purpose, because more than one arrangement satisfies it: the route may travel inside every packet, so each node reads its step afresh and keeps nothing of it; or it may be laid down at the nodes as the trail first passes over them, so that later packets carry little and each node supplies the rest from what it learned; or the knowing may be divided between the two. These are materializations of a single fact, and the scheme commits to none of them. It commits only to the fact — *the route must be known along the path* — and leaves the storing of it to a layer below this one.

What the requirement does pin down is a necessity, not a choice: knowledge cannot precede its arrival. No node can know a route until the route has reached it, so for the route to be known all along the path — every hop able to take its step — the trail must cross the whole path **at least once**. That one unavoidable pass is exactly the directed leg of §2 — the first time the trail is walked end to end as a line rather than fanned out as a flood — and it is what turns a trail merely *discovered*, known only at the far endpoint, into a trail *complete*, knowable at every node it threads. Whatever later messages do or do not carry, that first full pass has to happen, because there is no other way for the knowledge to arrive where it is needed.

**The per-hop identity check is what keeps a rotting trail honest.** Designators are not stable (Designator §5): the handle the route recorded for some hop may, later, denote a different out-neighbor, or none. Resolution against the current neighborhood does *not* save us here, because if the handle now legitimately denotes a different node, delivering there is not a substrate error — it is the overlay's problem. The defense is that the route pairs each hop's designator with the *ID* of the node it expects, and each node, before forwarding, checks that the next expected ID is its own. If a rotted designator delivers the packet to the wrong node, that node looks for its ID, does not find it where the route expects, and drops it. Mis-routing becomes a clean failure — caught, never silent — and a clean failure is something repair can respond to.

## 5. When a trail goes cold

Trails are leases, not circuits. Nodes leave, the graph is repaired around them (Architecture §3), designators are reassigned — and a trail that worked a minute ago may, without warning, carry a packet into a dead end. Because silence means nothing here, the only honest signal is the *absence of an expected acknowledgement*: a node that sends a message along a trail and hears nothing back, past its patience, must presume the trail dead.

The response is to rediscover — to run the cold start again — but with two disciplines that keep rediscovery from becoming the very broadcast storm we set out to avoid. First, **back off**: a node whose trail just failed should not re-flood instantly and repeatedly; it should wait, longer each time, so a partitioned or congested region is not buried under retries. Second, **keep more than one trail**. The floods of discovery and of the return search do not deliver a single copy; they deliver *many*, arriving by many routes. Rather than keep the first and discard the rest, an endpoint can retain a handful of distinct trails, so that when the primary fails it fails over to a spare *without flooding at all*. Discovery is the expensive thing; having paid for it, harvest more than one path from it.

None of this makes a trail permanent, and it should not try to. The aspiration is not a circuit that never breaks but a trail that is cheap to relay along while it lasts and cheap to replace when it does not.

## 6. Economies the structure hands us

Two optimizations fall out of the scheme without new machinery, and neither needs the world to be perfect — they will still be here when it isn't.

**Let the directed leg carry the first message.** The third leg is already a directed packet from $A$ to $B$; there is no reason to spend it solely on delivering the return trail. Staple $A$'s first real payload to it. Discovery and the first message become a single arrival, and the acknowledgement that confirms the trails (§3) is also the acknowledgement of real content. The handshake pays for itself by carrying freight.

**Let a lucky cycle collapse the dance.** If $A$'s initial discovery flood (Emergence §4) happens to travel a cycle that returns to $A$ — passing through $B$ and continuing back to its origin — then the copy that arrives home already carries $A \to \dots \to B \to \dots \to A$: the forward trail as its prefix, the return trail as its suffix. $A$ learns both at once, skips the return flood entirely, and proceeds straight to the directed delivery. On a ring topology (Architecture §3) this is not luck but certainty, and the cold start is one flood, not two. It is a fast path worth checking for and never worth depending on — in a general graph no such cycle need exist (this is the bowtie again), which is exactly why the return flood remains the reliable road.

A third economy is sitting right here too, but it only means anything once we stop pretending the world is perfect, so it waits for the memo that does (`hardening-the-overlay.md`): in the return flood, $B$'s search carries $P_{AB}$ across the whole network, and every carrier it crosses could read the forward trail and both names — who is talking to whom, by what route. Since $B$ is searching for $A$ by name, it is exactly positioned to seal that cargo so only $A$ can open it, and the route would travel in the dark. Worth noting now, worth building later. In a perfect world there is no one to hide from.

## 7. What emerges, and what does not

What emerges is the thing Path Emergence's opening asked for (Emergence §1): after a bounded, one-time cost — two floods and a directed thread — a pair of trails exists, proven by a real round trip, and every message thereafter rides those trails at the price of their length rather than the price of the whole graph. The flooding stops. The route is known along the path. Both directions work, discovered honestly as the independent routes they are. A path has emerged.

What does not emerge is anything stronger than best effort, and the memo would be dishonest to imply otherwise — even with everyone cooperating. The trails are leases that rot and must be replaced, because nodes leave and the graph is repaired around them whether or not anyone misbehaves (Architecture §3). The scheme guarantees *discovery* and *reuse*; it does not guarantee *delivery*, because the party you want may simply be gone, and the only honest signal of trouble is an answer that did not come. That much is true even in the perfect world.

The rest — everything the perfect world papers over — is the deferred work, and it is exactly the two granted assumptions of Path Emergence (Emergence §2) coming due. Give the unique ID real teeth and it becomes a key: signatures to catch a carrier that forges a name or alters a trail, names a node can actually *prove*. Stop granting the perfect world and the whole catalog opens: surviving deliberate dropping, resisting the analysis of who-talks-to-whom, pricing floods against abuse, sealing a ferried trail from the carriers that carry it. None of it changes the dance above; all of it bolts onto the dance above — which is the hardening memo's subject (`hardening-the-overlay.md`), not this one's.
