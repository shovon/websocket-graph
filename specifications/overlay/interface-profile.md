# Interface Profile: Packets and RPCs

The two path-emergence memos — stateful and stateless — describe how delivery works: how a node floods to find a trail, how the trail comes back, how it installs or gets stamped onto a header, how breaks are repaired. Both of them talk about "flooding the **cargo**," about "an **RPC** that builds the trail," about a node "**ferrying** something back." None of them say what actually travels between two adjacent nodes to make those words true.

That is this memo's job. It defines the envelope the path-emergence disciplines are written on top of — the contract at the single hop, below the question of how trails come to exist. It deliberately specifies nothing about routing; it specifies the unit that routing is expressed in.

The whole thing rests on one move:

> A **packet** is an envelope. The unit of meaning is the **RPC**. One packet may carry several RPCs. Addressing and validity are decided **per RPC**, not per packet.

Everything below is a consequence of taking that seriously.

---

## What rides between two nodes

A packet is the raw thing that arrives on an edge: bytes, with no inherent meaning and — per the network model — no trustworthy sender identity. Meaning lives entirely in the contents. Inside the envelope are one or more RPCs, each a self-contained request: _build a trail_, _deliver this cargo_, _here is a trail I found, take it_. An RPC is the smallest thing a receiving node acts on or declines to act on. The packet is just how some RPCs happened to travel together on one hop.

Keeping these two levels apart is what lets the rest of the design stay honest. The moment "the packet" becomes the unit of meaning, you start asking ill-formed questions — does this packet take precedence over that one, is this packet addressed to me — when the real answers are per-RPC and differ within a single envelope.

---

## Why carry more than one RPC

The honest case is sending into the unknown. A node that holds something to deliver but has no forward trail does not pay one flood to find the route and then a second delivery to use it. Its packet carries two RPCs at once: a **discovery** RPC that floods to find a route, and a **delivery** RPC, addressed to the target by node ID, that carries the cargo. These are two different operations — _find me a route_ and _get this there now_ — and neither embeds the other. The delivery is satisfied when the flood reaches the target; the discovery's result comes home separately, so the route is cached for next time. That is the motivation for a packet holding more than one RPC.

It is worth being careful about the symmetric-looking case, because it is _not_ two RPCs. When a delivery carries a _trail_ as its content — the discovered route riding home to the origin — that is still a single delivery RPC with the trail as its payload, exactly as a delivery carrying ordinary cargo is one RPC. Content riding as the payload of a delivery does not make a second RPC; two RPCs takes two operations, the way discovery and delivery are two.

So the precedence question — _if a packet holds a build-trail RPC and a delivery that already contains the whole trail, which wins?_ — never actually arises. It assumed a contradiction: you cannot both be asking for a trail to be built and be in possession of the finished trail. Those are two different **states** of the node, not two RPCs racing inside one packet. If you hold the trail you route, and there is no discovery RPC; if you don't, you flood, and there is no finished trail to embed. The question dissolves into _which state are you in_ — and only the no-trail state multiplexes, pairing discovery with the destination-addressed delivery above.

---

## One flood is many packets

"Flooding" reads like a single act, and as an _RPC type_ it is one thing: build-the-trail-onward. But it is never one packet. To each out-neighbor the node appends a trail entry of its own node ID paired with the **out-edge designator for that specific neighbor** — and designators are per-edge, so the appended entry, and therefore the packet, differs for every neighbor.

The unit on the wire is the per-edge packet. A flood is the act of emitting `N` of them, identical in intent and different in their head entry. Calling it "one RPC" is fine as long as it never quietly collapses the fan-out: there is one operation, many differentiated copies, and the difference is exactly the local designator that makes the trail a forward source route.

---

## Addressing is a property of the RPC, not the packet

Different RPC types answer "is this for me?" differently, and that is the whole reason the per-RPC framing pays off.

- A **flood / build-trail RPC** names the destination it is hunting for — the target node ID is in the packet, which is how a receiver recognizes that it _is_ the target or holds a suffix toward it. What it does not name is the **next hop**, because the next hop is the very thing the flood is trying to discover. So whoever receives it on an out-edge is a legitimate place for it to be, and there is no head entry that has to name the receiver for the RPC to be acted on.
- A **source-routed or install RPC** is addressed precisely. It carries a trail whose head entry names the node that is supposed to act on it next, and the head is stripped as the packet is forwarded on. So the receiver applies a simple test: _does the head entry name me?_ If it does, the RPC is for it. If it doesn't, the RPC is misaddressed — the route has rotted, or the packet arrived somewhere it shouldn't have.

This head-entry self-check is a delivery-integrity test, not loop detection. It asks only "was this hop meant for me," and a node that fails it knows the routed RPC in its hands is stale on arrival, independent of any cycle reasoning.

---

## Drop the RPC, not the packet

Once validity is per-RPC, the failure mode follows. When a routed RPC's head entry does not name the receiver, the instinct is to drop the packet — but the packet may be carrying other RPCs whose addressing is perfectly fine. A flood RPC sharing the same envelope is still addressed to "whoever received it," and that is this node.

So the discipline is: a node evaluates each RPC in the envelope on its own terms and discards the ones it cannot honor, not the envelope that carried them. A misaddressed install does not take a co-traveling find down with it. Dropping at the granularity of the RPC is what keeps multiplexing from turning every envelope into an all-or-nothing bet.

---

## Plug-in points

This memo defines the envelope; it does not define what a flood needs in order to stop, or how a node decides it has seen a route before. Those belong to the cycle-detection memo, and the interface profile only reserves room for them:

- A flood / build-trail RPC carries whatever **discovery or dedup identifier** the cycle-detection memo requires for remember-and-drop termination. The envelope provides the slot; the memo defines the contents and the rule.
- **Loop-checking** an accumulated or concatenated trail is likewise deferred. The profile guarantees the trail entries are present and well-formed enough to be checked; it does not specify the check.

The head-entry self-check above is the one validity test that lives here rather than in the cycle memo, because it concerns whether a single hop was meant for this node — delivery integrity — and not whether the route as a whole revisits itself.
