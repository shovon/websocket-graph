# Degree-3 Balanced Trees

## Abstract

A **Degree-3 Balanced Tree (D3BT)** keeps a set of nodes connected as a single undirected tree in which **no node ever holds more than three neighbors**. New nodes are placed so the tree stays shallow; when a node leaves, the pieces it held together are re-joined so the survivors are one tree again. The structure answers queries for subtree size, height, balance point, and adjacency, and after every change it reports exactly which nodes' neighborhoods moved.

## The whole structure in three ideas

A D3BT has no ordering invariant: a node's three slots have no meaning beyond "a neighbor lives here" — there is no left, no right, no key to keep between them, and an edge may run between _any_ two nodes. That freedom lets the whole structure collapse to **three ideas**:

1. **A node is three symmetric slots.** The degree bound _is_ the representation — not a rule you check, but the fact that a node has nowhere to put a fourth neighbor. No slot is privileged: there is no parent, no child, no order.

2. **One primitive: the symmetric link.** Every change to the edge set is "occupy one empty slot on each of two nodes," or its inverse, "clear the slot on each that points at the other." There is no restructuring — a tree of degree-3 nodes is only ever linked and unlinked.

3. **Balance by placement.** Since we never restructure, balance has to come from _deciding where things go_. Insertion walks toward the shallowest part of the tree before attaching. Deletion re-hangs each orphaned piece at the **centroid** of the largest survivor. Both decisions are nothing more than local measurements — height, size, centroid — and those measurements are the entire algorithm.

The rest of this note is those three ideas worked out: the model (§1), the link primitive (§2), the two measurements balance is built on (§3), and then the three mutations — insert (§4), join (§5), delete (§6) — each a few lines on top of what came before. Section 7 lists the four invariants every mutation preserves; Section 8 explains why the tree stays shallow; Section 9 notes the sharp edges.

## 1. The model: three symmetric slots

A D3BT is a map from each node key to a fixed triple of **slots**. Each slot is either _empty_ or holds _one_ neighbor key.

```
Tree : Key  ->  (Slot, Slot, Slot)
Slot : EMPTY | neighbor Key
```

A node exists exactly when it is a key of this map. Its **degree** is the number of occupied slots — an integer from 0 to 3. A node with at least one empty slot is **sparse**; that empty slot is the only place a new edge can attach.

Two points decide every later detail:

- **The triple is positional but the positions are meaningless.** Slot 0 is not "the parent" and slot 2 is not "the last child." A slot index distinguishes one slot from another and nothing more. Never read priority, direction, or order into it.

- **Empty must be a real sentinel, distinct from every key.** If keys can be `0`, `""`, or `null`, a bare falsy value cannot double as "empty." Wrap each occupied slot — store a one-element box `[k]` and let `EMPTY` be the absence of a box — so that _any_ box means "occupied," whatever it holds. (This is exactly why the reference code types a slot as `[K] | null` rather than `K | null`.)

That is the whole data model. Everything below is operations on this map.

## 2. The one primitive: link and unlink

Because edges are undirected, an edge between `a` and `b` is recorded **twice** — once in a slot of `a`, once in a slot of `b`. The single primitive that the entire structure is built from keeps those two halves in lockstep:

```
link(a, b):                       # a and b must each be sparse
    i = index of some empty slot of a
    j = index of some empty slot of b
    a.slot[i] = b
    b.slot[j] = a

unlink(a, b):                     # a and b are currently neighbors
    clear the slot of a that holds b
    clear the slot of b that holds a
```

There is just one operation here (and its inverse), and it never moves a subtree. Add an edge, or remove one; the shapes on either side are untouched. Every mutation in §4–§6 is a handful of `link`/`unlink` calls wrapped in a decision about _where_ to call them.

Two helpers round out the toolkit. **Adjacency** is just the occupied slots:

```
neighbors(n):  the keys in n's non-empty slots         # a set of size 0..3
```

And **sparse-node search** finds somewhere an edge can attach — preferring the start, else fanning outward:

```
findSparse(start):
    if start is sparse: return start
    BFS outward from start; return the first sparse node reached
    # a finite non-empty tree always has a leaf, so this always succeeds;
    # exhausting the component without finding one means an invariant is broken
```

## 3. The two measurements balance is built on

Balance is decided by two recursive walks. Both take the node you're standing on **and the neighbor you came from**, so they measure only the subtree that fans out _away_ from the caller — the parent direction is simply skipped.

```
size(n, from):                    # number of nodes in n's subtree
    s = 1
    for m in neighbors(n), m != from:
        s += size(m, n)
    return s

height(n, from):                  # nodes on the longest downward path; a leaf is 1
    h = 0
    for m in neighbors(n), m != from:
        h = max(h, height(m, n))
    return 1 + h
```

To measure a whole component, pass `from = none`. To measure one subtree hanging off a node, pass that node as `from` — presenting it as "already visited" prunes the parent direction. Both walks are linear in the subtree they touch, and both **may be memoized**: a node's size and height don't change unless an edge in its subtree does, so a descent that revisits nodes can cache and reuse them.

These two numbers — and the centroid built from `size` in §6 — are the only things the balancing logic ever looks at.

## 4. Insertion: descend to the shallowest free slot

To insert one new node, walk from an entry point toward the **shallowest** subtree until you reach a node with a free slot, then `link` the newcomer there. That's it.

```
insert(entry, x):
    if x already exists:    return {}              # idempotent: no change
    if the tree is empty:
        create x with three empty slots
        return {x}

    n = entry  (or any existing node if none was given)
    from = none
    loop:
        if n is sparse:                            # found a home
            create x with three empty slots
            link(n, x)
            return {n, x}                          # only these two moved

        # n is full: step into its best child, never back toward `from`
        n, from  =  argmin over m in neighbors(n), m != from
                       of ( height(m, n), size(m, n) )   # shallowest, ties to smallest
                    ,  n
```

The selection rule is the whole balancing intent in one line: **prefer the shallowest onward subtree; break ties toward the smallest.** Height is the primary key because it is height — not node count — that we are trying to keep down. Because both measurements exclude `from`, each step looks only at the subtree it is about to enter, and (with memoization across the descent) the walk costs no more than the part of the tree it examines.

Note what is _absent_: no rebalancing, no second pass, no fix-up on the way back. A non-empty insertion changes exactly two neighborhoods — the newcomer and the node it attached to — and that pair is the entire affected set.

> **Other placement rules (non-normative).** Any rule that attaches to a sparse node keeps the invariants; they differ only in balance quality. _Fill-first_ — BFS to the first sparse node and attach (no measurement at all). _Smallest-subtree_ — descend by `size` alone, ignoring height. The height-then-size rule above is the recommended default for its stronger control over height.

## 5. Joining two trees: one edge between sparse nodes

Joining fuses **two separate trees** into one by adding a single edge. It is not a general "connect any two nodes" call — it is the repair primitive deletion leans on (§6).

```
join(a, b):                       # PRECONDITION: a and b are in DIFFERENT trees
    a = findSparse(a)
    b = findSparse(b)
    link(a, b)
    return {a, b}
```

Find a sparse node in each tree and link them. Because the two endpoints started in different components, the new edge cannot close a cycle, so the result is again a single tree of degree at most three.

The precondition is the one genuinely dangerous spot in the whole structure, and `join` does **not** check it: linking two nodes of the _same_ tree silently creates a cycle, and every later `size` / `height` / `centroid` walk then loops or lies. The only caller that satisfies the precondition by construction is deletion's repair, where the pieces are provably separate at the moment they're joined.

## 6. Deletion: detach, then re-root the orphans at the centroid

Removing a node can shatter the tree into as many as three pieces — the subtrees that were hanging off its three slots. Deletion unlinks the node, then stitches those pieces back into one tree, choosing the re-attachment point to keep the result shallow.

```
delete(x):
    if x does not exist:    return {}              # idempotent: no change
    affected = {}

    # 1. Detach: clear x out of each neighbor (the other half of unlink).
    orphans = neighbors(x)
    for m in orphans:
        clear m's slot that holds x
        affected += m
    remove x from the tree

    # 2. If at most one piece remains, it's already one tree.
    if |orphans| <= 1:    return affected

    # 3. Re-root the smaller pieces at the largest piece's balance point.
    dominant   = the orphan whose subtree is largest      # by size(o, none)
    subordinate = the others
    c = centroid(dominant)
    for s in subordinate:
        affected += join(c, s)                    # legal: pieces are separate here
    return affected
```

The deleted node is never in the affected set — it's gone. The set reports _survivors_ whose neighborhoods changed: the former neighbors that lost an edge, plus the nodes touched by the repair joins.

The one new ingredient is the **centroid** — the node whose removal would leave no piece bigger than half the tree. Re-hanging the smaller orphans there, rather than at some arbitrary node, is what keeps the repaired tree's height low; it is deletion's version of insertion's "descend to the shallowest part."

```
centroid(start):
    T = size(start, none)             # total nodes in this component
    n, from = start, none
    loop:
        # if any one subtree holds more than half the nodes, the balance
        # point lies inside it — step that way and repeat.
        m = a neighbor of n, m != from, with size(m, n) > T / 2
        if no such m: return n
        n, from = m, n
```

Each step strictly enters a smaller-than-`T` region, so the walk terminates at a node from which every subtree is `<= T/2`: a centroid.

## 7. The four invariants

Every operation in §4–§6 leaves all four of these true on return (it may break them _transiently_ mid-operation, but never on exit). They are **not self-enforcing** — the underlying map is an ordinary container, and any code that writes slots outside these operations can violate them.

- **I1 — Degree bound.** Three slots per node, so degree never exceeds three. This one is structural: there is literally no fourth slot to overfill.
- **I2 — Edge symmetry.** If a slot of `a` holds `b`, some slot of `b` holds `a`. No half-edges. `link`/`unlink` are the only writers, and they always touch both ends — so this holds by construction.
- **I3 — No self-loops or multi-edges.** No slot points a node at itself, and no two slots of a node hold the same neighbor.
- **I4 — Acyclic per component.** Each connected piece is a free tree: `n` nodes, exactly `n - 1` edges. `join`'s different-component precondition is what protects this.

A structure satisfying I1–I4 is a forest of degree-bounded trees. In steady state a D3BT also maintains **I5 — one component**: everything is a single tree. I5 is necessarily disturbed the instant a node departs and is restored by deletion's repair, so connectivity is a property that holds _between_ operations, not during them.

A cheap, optional checker pays for itself in testing: degree ≤ 3 everywhere; every edge symmetric; exactly one component; exactly `n - 1` edges in it.

## 8. Why it stays shallow

A component of `n` nodes has `n - 1` edges (I4) and max degree three (I1), so it is sparse by construction; the open question is only its height.

Both mutations push toward small height by the same instinct — _act where the tree is shortest._ Insertion attaches in the shallowest subtree it can reach. Deletion re-roots survivors at the centroid, the point that minimizes the tallest resulting piece. The placement disciplines aim to keep height close to logarithmic in `n`, and in practice they do — but D3BT offers **no hard worst-case height bound**: height depends on the operation sequence. An application that needs a guarantee should strengthen the placement rule and document the bound it then enforces.

Costs follow directly:

- Attaching to a known sparse node is constant work.
- `findSparse` is linear in the worst case, constant when the entry point is sparse.
- An insertion descent measures height and size at each step — linear in the part of the tree examined, with memoization.
- A deletion computes one centroid — linear in the largest orphan — plus up to two joins.

## 9. Sharp edges

- **Invariants are not self-enforcing.** Only §4–§6 preserve I1–I4. Any code that writes a slot directly can break edge symmetry or acyclicity with no complaint from the structure. Confine all mutation to these operations, and ship the §7 checker for tests.
- **Cycle injection via misused `join`.** `join` trusts its different-component precondition (§5). Call it on two nodes of the same tree and you get a silent cycle whose damage surfaces far away, as a later `size`/`height`/`centroid` walk that loops or returns nonsense. Guarantee separateness at the call site; deletion's repair is the one caller that does so by construction.
- **Mutation amplification.** Each deletion triggers a centroid computation and up to two joins — repeated linear work when deletions rain on a large tree. An adversarial workload should bound the mutation rate.
- **Entry-point arbitrariness.** Operations given no entry point pick an arbitrary existing node. That's well-defined under I5; on a forest such a call acts within one component only.
- **Key semantics.** Keys are compared only for equality and carry no ordering. A caller that recycles a key owns whatever meaning it reads into the reuse; the structure ascribes none.

```

```
