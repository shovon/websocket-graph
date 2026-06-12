import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
	type Degree3Graph,
	getDepth,
	getCount,
	findSparseNode,
	joinNodes,
	insertNodeFill,
	insertSmallestSubtree,
	insertNode,
	findCentroid,
	deleteNode,
	depthFirstTraverse,
	breadthFirstTraverse,
	edgeList,
} from "./adjacency-list.mts";

// ---------------------------------------------------------------------------
// Helpers
//
// A Degree3Graph<K> is an undirected graph of maximum degree 3. Every node maps
// to a fixed 3-slot tuple; each slot is either null (empty) or a single-element
// tuple [neighbourKey]. These helpers build/inspect such graphs the same way
// `clean-updating-graph-example` uses them (string keys throughout).
// ---------------------------------------------------------------------------

type Slots<K> = [[K] | null, [K] | null, [K] | null];

/** Build a 3-slot tuple from up to 3 neighbour keys, padding with nulls. */
function slots<K>(...neighbors: K[]): Slots<K> {
	if (neighbors.length > 3) throw new Error("A node may have at most 3 slots");
	const out: ([K] | null)[] = [null, null, null];
	neighbors.forEach((nb, i) => {
		out[i] = [nb];
	});
	return out as Slots<K>;
}

/**
 * Build a consistent undirected graph from an edge list. Each edge is recorded
 * on both endpoints. `isolated` lists nodes that exist with no edges.
 */
function buildGraph(
	edges: [string, string][],
	isolated: string[] = [],
): Degree3Graph<string> {
	const adj = new Map<string, string[]>();
	const ensure = (k: string) => {
		if (!adj.has(k)) adj.set(k, []);
		return adj.get(k)!;
	};
	for (const k of isolated) ensure(k);
	for (const [a, b] of edges) {
		ensure(a).push(b);
		ensure(b).push(a);
	}
	const graph: Degree3Graph<string> = new Map();
	for (const [k, nbs] of adj) graph.set(k, slots(...nbs));
	return graph;
}

/**
 * Build a graph from explicit per-node slot layouts. Unlike `buildGraph`, which
 * always left-packs neighbours into the lowest slots, this lets a slot be `null`
 * *between* two filled slots — the interior-gap layout the production code
 * leaves behind after a `deleteNode` nulls out a middle slot. Edges are taken
 * verbatim and are NOT auto-mirrored, so the caller controls the exact slot
 * index on every endpoint.
 */
function graphFromSlots(
	spec: Record<string, [string | null, string | null, string | null]>,
): Degree3Graph<string> {
	const graph: Degree3Graph<string> = new Map();
	for (const [key, layout] of Object.entries(spec)) {
		graph.set(
			key,
			layout.map((n) => (n === null ? null : [n])) as Slots<string>,
		);
	}
	return graph;
}

/** Non-null neighbour keys of a node (order preserved), or [] if absent. */
function neighborsOf(graph: Degree3Graph<string>, key: string): string[] {
	const node = graph.get(key);
	if (!node) return [];
	return node.filter((s): s is [string] => s !== null).map(([k]) => k);
}

/** Assert that the graph is symmetric: every a->b edge has a matching b->a. */
function assertSymmetric(graph: Degree3Graph<string>) {
	for (const [key] of graph) {
		for (const nb of neighborsOf(graph, key)) {
			assert.ok(
				graph.has(nb),
				`neighbour ${nb} of ${key} should exist in the graph`,
			);
			assert.ok(
				neighborsOf(graph, nb).includes(key),
				`edge ${key}->${nb} is not mirrored by ${nb}->${key}`,
			);
		}
	}
}

// ---------------------------------------------------------------------------
// getDepth
// ---------------------------------------------------------------------------

describe("getDepth", () => {
	it("returns 1 for a single isolated node", () => {
		const graph = buildGraph([], ["a"]);
		assert.equal(getDepth(graph, "a", new Set(), new Map()), 1);
	});

	it("returns null for a node that does not exist", () => {
		const graph = buildGraph([], ["a"]);
		assert.equal(getDepth(graph, "missing", new Set(), new Map()), null);
	});

	it("counts levels along a chain", () => {
		// a - b - c
		const graph = buildGraph([
			["a", "b"],
			["b", "c"],
		]);
		assert.equal(getDepth(graph, "a", new Set(), new Map()), 3);
		assert.equal(getDepth(graph, "b", new Set(), new Map()), 2);
	});

	it("returns 0 when the root was already visited", () => {
		const graph = buildGraph([], ["a"]);
		assert.equal(getDepth(graph, "a", new Set(["a"]), new Map()), 0);
	});

	it("short-circuits on a cached value without consulting the graph", () => {
		const graph = buildGraph([], ["a"]);
		const cache = new Map<string, [number]>([["ghost", [42]]]);
		assert.equal(getDepth(graph, "ghost", new Set(), cache), 42);
	});

	it("populates the cache with the computed depth", () => {
		const graph = buildGraph([["a", "b"]]);
		const cache = new Map<string, [number]>();
		getDepth(graph, "a", new Set(), cache);
		assert.deepEqual(cache.get("a"), [2]);
	});
});

// ---------------------------------------------------------------------------
// getCount
// ---------------------------------------------------------------------------

describe("getCount", () => {
	it("returns 1 for a single isolated node", () => {
		const graph = buildGraph([], ["a"]);
		assert.equal(getCount(graph, "a", new Set(), new Map()), 1);
	});

	it("returns null for a node that does not exist", () => {
		const graph = buildGraph([], ["a"]);
		assert.equal(getCount(graph, "missing", new Set(), new Map()), null);
	});

	it("counts every node reachable in a chain", () => {
		const graph = buildGraph([
			["a", "b"],
			["b", "c"],
		]);
		assert.equal(getCount(graph, "a", new Set(), new Map()), 3);
	});

	it("treats a seeded visited set as a parent boundary (subtree size)", () => {
		// star: c is the centre with leaves l1, l2, l3
		const graph = buildGraph([
			["c", "l1"],
			["c", "l2"],
			["c", "l3"],
		]);
		// Counting from c while pretending we came from l1: c + l2 + l3 = 3
		assert.equal(getCount(graph, "c", new Set(["l1"]), new Map()), 3);
	});

	it("returns 0 when the root was already visited", () => {
		const graph = buildGraph([], ["a"]);
		assert.equal(getCount(graph, "a", new Set(["a"]), new Map()), 0);
	});

	it("short-circuits on a cached value", () => {
		const graph = buildGraph([], ["a"]);
		const cache = new Map<string, number>([["ghost", 7]]);
		assert.equal(getCount(graph, "ghost", new Set(), cache), 7);
	});
});

// ---------------------------------------------------------------------------
// findSparseNode
// ---------------------------------------------------------------------------

describe("findSparseNode", () => {
	it("throws when the root does not exist", () => {
		const graph = buildGraph([], ["a"]);
		assert.throws(() => findSparseNode(graph, "missing"), /All node should exist/);
	});

	it("returns the root itself when it has a free slot", () => {
		const graph = buildGraph([["a", "b"]]);
		assert.equal(findSparseNode(graph, "a"), "a");
	});

	it("BFSes to a descendant with a free slot when the root is full", () => {
		// root a is full (b, c, d); only the leaves have free slots
		const graph = buildGraph([
			["a", "b"],
			["a", "c"],
			["a", "d"],
		]);
		const found = findSparseNode(graph, "a");
		assert.ok(["b", "c", "d"].includes(found));
		assert.ok(neighborsOf(graph, found).length < 3);
	});

	it("throws when no node has a free slot (graph is not a tree)", () => {
		// Complete graph K4: every node has all 3 slots filled
		const graph = buildGraph([
			["a", "b"],
			["a", "c"],
			["a", "d"],
			["b", "c"],
			["b", "d"],
			["c", "d"],
		]);
		assert.throws(() => findSparseNode(graph, "a"), /Graph is not a tree/);
	});
});

// ---------------------------------------------------------------------------
// joinNodes
// ---------------------------------------------------------------------------

describe("joinNodes", () => {
	it("throws when either node is absent", () => {
		const graph = buildGraph([], ["a"]);
		assert.throws(
			() => joinNodes(graph, "a", "missing"),
			/must exist in the graph/,
		);
		assert.throws(
			() => joinNodes(graph, "missing", "a"),
			/must exist in the graph/,
		);
	});

	it("connects two isolated nodes symmetrically", () => {
		const graph = buildGraph([], ["a", "b"]);
		const joined = joinNodes(graph, "a", "b");
		assert.deepEqual(joined, ["a", "b"]);
		assert.deepEqual(neighborsOf(graph, "a"), ["b"]);
		assert.deepEqual(neighborsOf(graph, "b"), ["a"]);
		assertSymmetric(graph);
	});

	it("attaches via sparse representatives when a target is full", () => {
		// a is full; one of its leaves should receive the new edge to x
		const graph = buildGraph(
			[
				["a", "b"],
				["a", "c"],
				["a", "d"],
			],
			["x"],
		);
		const [left, right] = joinNodes(graph, "a", "x");
		// `a` was full, so the join climbs to a leaf of a's subtree.
		assert.ok(["b", "c", "d"].includes(left!));
		assert.equal(right, "x");
		assert.ok(neighborsOf(graph, "x").includes(left!));
		assert.ok(neighborsOf(graph, left!).includes("x"));
		assertSymmetric(graph);
	});

	it("fills an interior null slot left by a deletion", () => {
		// a's middle slot is empty: [[b], null, [c]]. The join must drop x into
		// that interior gap, not append after c.
		const graph = graphFromSlots({
			a: ["b", null, "c"],
			b: ["a", null, null],
			c: ["a", null, null],
			x: [null, null, null],
		});
		const joined = joinNodes(graph, "a", "x");
		assert.deepEqual(joined, ["a", "x"]);
		// Slot order preserved: b, x, c.
		assert.deepEqual(graph.get("a"), [["b"], ["x"], ["c"]]);
		assert.deepEqual(neighborsOf(graph, "x"), ["a"]);
		assertSymmetric(graph);
	});
});

// ---------------------------------------------------------------------------
// insertNodeFill
// ---------------------------------------------------------------------------

describe("insertNodeFill", () => {
	it("seeds an empty graph with the node as root", () => {
		const graph: Degree3Graph<string> = new Map();
		const result = insertNodeFill(graph, { toInsert: "a" });
		assert.deepEqual(result, ["a"]);
		assert.deepEqual(graph.get("a"), [null, null, null]);
	});

	it("is idempotent for a node that already exists", () => {
		const graph = buildGraph([], ["a"]);
		assert.deepEqual(insertNodeFill(graph, { toInsert: "a" }), []);
		assert.equal(graph.size, 1);
	});

	it("fills the root's free slots first", () => {
		const graph = buildGraph([], ["a"]);
		assert.deepEqual(insertNodeFill(graph, { root: ["a"], toInsert: "b" }), [
			"b",
			"a",
		]);
		assert.deepEqual(insertNodeFill(graph, { root: ["a"], toInsert: "c" }), [
			"c",
			"a",
		]);
		assert.deepEqual(neighborsOf(graph, "a"), ["b", "c"]);
		assertSymmetric(graph);
	});

	it("returns [] when no eligible node has room", () => {
		// Root a is full and its three children are leaves (degree 1, not 2),
		// so the BFS fill rule finds nowhere to place the node.
		const graph = buildGraph([
			["a", "b"],
			["a", "c"],
			["a", "d"],
		]);
		assert.deepEqual(insertNodeFill(graph, { root: ["a"], toInsert: "e" }), []);
		assert.equal(graph.has("e"), false);
	});

	it("fills an interior null slot on the root", () => {
		// Root a = [[b], null, [c]]; the free middle slot must be used.
		const graph = graphFromSlots({
			a: ["b", null, "c"],
			b: ["a", null, null],
			c: ["a", null, null],
		});
		assert.deepEqual(insertNodeFill(graph, { root: ["a"], toInsert: "e" }), [
			"e",
			"a",
		]);
		assert.deepEqual(graph.get("a"), [["b"], ["e"], ["c"]]);
		assertSymmetric(graph);
	});
});

// ---------------------------------------------------------------------------
// insertSmallestSubtree
// ---------------------------------------------------------------------------

describe("insertSmallestSubtree", () => {
	it("is idempotent for an existing node", () => {
		const graph = buildGraph([], ["a"]);
		assert.deepEqual(
			insertSmallestSubtree(
				graph,
				{ root: ["a"], toInsert: "a" },
				new Set(),
				new Map(),
			),
			[],
		);
	});

	it("places into a free slot directly on the root", () => {
		const graph = buildGraph([], ["a"]);
		const result = insertSmallestSubtree(
			graph,
			{ root: ["a"], toInsert: "b" },
			new Set(),
			new Map(),
		);
		assert.deepEqual(result, ["b", "a"]);
		assert.deepEqual(neighborsOf(graph, "a"), ["b"]);
		assertSymmetric(graph);
	});

	it("descends into the smallest subtree when the root is full", () => {
		// a is full with b, c, d. b's subtree is larger (b-b2), so the new node
		// should land under the smaller subtree (c, the first minimum), at a
		// free slot.
		const graph = buildGraph([
			["a", "b"],
			["a", "c"],
			["a", "d"],
			["b", "b2"],
		]);
		const result = insertSmallestSubtree(
			graph,
			{ root: ["a"], toInsert: "e" },
			new Set(),
			new Map(),
		);
		assert.equal(graph.has("e"), true);
		// e attaches to a leaf, not to the already-full root a.
		assert.ok(!neighborsOf(graph, "a").includes("e"));
		assert.equal(result[0], "e");
		assert.ok(neighborsOf(graph, result[1]!).includes("e"));
		assertSymmetric(graph);
	});

	it("uses an interior null slot on the root before descending", () => {
		// Root a = [[b], null, [c]]; the empty middle slot should be filled
		// directly rather than recursing into a subtree.
		const graph = graphFromSlots({
			a: ["b", null, "c"],
			b: ["a", null, null],
			c: ["a", null, null],
		});
		const result = insertSmallestSubtree(
			graph,
			{ root: ["a"], toInsert: "e" },
			new Set(),
			new Map(),
		);
		assert.deepEqual(result, ["e", "a"]);
		assert.deepEqual(graph.get("a"), [["b"], ["e"], ["c"]]);
		assertSymmetric(graph);
	});
});

// ---------------------------------------------------------------------------
// insertNode (depth/count-balanced insertion)
// ---------------------------------------------------------------------------

describe("insertNode", () => {
	const caches = () => ({
		depthCache: new Map<string, [number]>(),
		countCache: new Map<string, number>(),
	});

	it("seeds an empty graph with the node as root", () => {
		const graph: Degree3Graph<string> = new Map();
		const result = insertNode(graph, { toInsert: "a" }, new Set(), caches());
		assert.deepEqual(result, ["a"]);
		assert.deepEqual(graph.get("a"), [null, null, null]);
	});

	it("is idempotent for an existing node", () => {
		const graph = buildGraph([], ["a"]);
		assert.deepEqual(
			insertNode(graph, { toInsert: "a" }, new Set(), caches()),
			[],
		);
	});

	it("fills a free slot on the given root", () => {
		const graph = buildGraph([], ["a"]);
		const result = insertNode(
			graph,
			{ root: ["a"], toInsert: "b" },
			new Set(),
			caches(),
		);
		assert.deepEqual(result, ["b", "a"]);
		assert.deepEqual(neighborsOf(graph, "a"), ["b"]);
		assertSymmetric(graph);
	});

	it("descends into the shallowest subtree when the root is full", () => {
		// a is full; b leads to a depth-3 chain while c and d are shallow leaves.
		// Insertion should avoid the deep b subtree and land under a shallow one.
		const graph = buildGraph([
			["a", "b"],
			["a", "c"],
			["a", "d"],
			["b", "b2"],
			["b2", "b3"],
		]);
		const result = insertNode(
			graph,
			{ root: ["a"], toInsert: "e" },
			new Set(),
			caches(),
		);
		assert.equal(graph.has("e"), true);
		assert.ok(["c", "d"].includes(result[1]!));
		assert.ok(neighborsOf(graph, result[1]!).includes("e"));
		assertSymmetric(graph);
	});

	it("fills an interior null slot on the root", () => {
		// Root a = [[b], null, [c]]; the slot-fill loop must take the middle
		// gap and not fall through to the balanced-descent path.
		const graph = graphFromSlots({
			a: ["b", null, "c"],
			b: ["a", null, null],
			c: ["a", null, null],
		});
		const result = insertNode(
			graph,
			{ root: ["a"], toInsert: "e" },
			new Set(),
			caches(),
		);
		assert.deepEqual(result, ["e", "a"]);
		assert.deepEqual(graph.get("a"), [["b"], ["e"], ["c"]]);
		assertSymmetric(graph);
	});
});

// ---------------------------------------------------------------------------
// findCentroid
// ---------------------------------------------------------------------------

describe("findCentroid", () => {
	it("returns the only node of a singleton graph", () => {
		const graph = buildGraph([], ["a"]);
		assert.equal(findCentroid(graph, "a"), "a");
	});

	it("finds the middle of a chain regardless of starting root", () => {
		// a - b - c, centroid is b
		const graph = buildGraph([
			["a", "b"],
			["b", "c"],
		]);
		assert.equal(findCentroid(graph, "a"), "b");
		assert.equal(findCentroid(graph, "c"), "b");
	});

	it("returns the hub of a star", () => {
		const graph = buildGraph([
			["c", "l1"],
			["c", "l2"],
			["c", "l3"],
		]);
		assert.equal(findCentroid(graph, "l1"), "c");
	});
});

// ---------------------------------------------------------------------------
// deleteNode
// ---------------------------------------------------------------------------

describe("deleteNode", () => {
	it("is idempotent on an empty graph", () => {
		const graph: Degree3Graph<string> = new Map();
		assert.deepEqual(deleteNode(graph, "a"), []);
	});

	it("is idempotent for a node that does not exist", () => {
		const graph = buildGraph([], ["a"]);
		assert.deepEqual(deleteNode(graph, "missing"), []);
		assert.equal(graph.size, 1);
	});

	it("removes a leaf and detaches it from its parent", () => {
		const graph = buildGraph([["a", "b"]]);
		const modified = deleteNode(graph, "b");
		assert.equal(graph.has("b"), false);
		assert.deepEqual(neighborsOf(graph, "a"), []);
		assert.deepEqual(modified, ["a"]);
	});

	it("rejoins orphaned subtrees after deleting an internal node", () => {
		// a - b - c : deleting b orphans a and c, which get rejoined.
		const graph = buildGraph([
			["a", "b"],
			["b", "c"],
		]);
		deleteNode(graph, "b");
		assert.equal(graph.has("b"), false);
		assert.equal(graph.size, 2);
		// a and c must end up connected so the graph stays a single tree.
		assert.ok(neighborsOf(graph, "a").includes("c"));
		assert.ok(neighborsOf(graph, "c").includes("a"));
		assertSymmetric(graph);
	});

	it("keeps the graph connected when deleting a hub", () => {
		// star with 4 leaves; remove the hub and the leaves should rejoin
		const graph = buildGraph([
			["c", "l1"],
			["c", "l2"],
			["c", "l3"],
		]);
		deleteNode(graph, "c");
		assert.equal(graph.has("c"), false);
		assert.equal(graph.size, 3);
		assertSymmetric(graph);
		// Every remaining node should be reachable from any other (one component).
		const root = graph.keys().next().value!;
		const reached = new Set<string>();
		for (const { key } of depthFirstTraverse(graph, root, new Set())) {
			reached.add(key);
		}
		assert.equal(reached.size, graph.size);
	});
});

// ---------------------------------------------------------------------------
// depthFirstTraverse
// ---------------------------------------------------------------------------

describe("depthFirstTraverse", () => {
	it("throws when the root does not exist", () => {
		const graph = buildGraph([], ["a"]);
		assert.throws(
			() => [...depthFirstTraverse(graph, "missing", new Set())],
			/does not exist/,
		);
	});

	it("yields a lone node with no neighbours", () => {
		const graph = buildGraph([], ["a"]);
		const visited = [...depthFirstTraverse(graph, "a", new Set())];
		assert.deepEqual(visited, [{ key: "a", neighbors: [] }]);
	});

	it("visits every node of a chain exactly once", () => {
		const graph = buildGraph([
			["a", "b"],
			["b", "c"],
		]);
		const keys = [...depthFirstTraverse(graph, "a", new Set())].map(
			(n) => n.key,
		);
		assert.deepEqual(keys, ["a", "b", "c"]);
	});
});

// ---------------------------------------------------------------------------
// breadthFirstTraverse
// ---------------------------------------------------------------------------

describe("breadthFirstTraverse", () => {
	it("throws when the root does not exist", () => {
		const graph = buildGraph([], ["a"]);
		assert.throws(
			() => [...breadthFirstTraverse(graph, "missing")],
			/does not exist/,
		);
	});

	it("visits nodes level by level", () => {
		// a has children b, c; b has child d
		const graph = buildGraph([
			["a", "b"],
			["a", "c"],
			["b", "d"],
		]);
		const keys = [...breadthFirstTraverse(graph, "a")].map((n) => n.key);
		assert.deepEqual(keys, ["a", "b", "c", "d"]);
	});

	it("reports the non-null neighbours of each node", () => {
		const graph = buildGraph([
			["a", "b"],
			["a", "c"],
		]);
		const byKey = new Map(
			[...breadthFirstTraverse(graph, "a")].map((n) => [n.key, n.neighbors]),
		);
		assert.deepEqual(byKey.get("a"), ["b", "c"]);
		assert.deepEqual(byKey.get("b"), ["a"]);
		assert.deepEqual(byKey.get("c"), ["a"]);
	});

	it("skips interior null slots when reporting neighbours", () => {
		// a = [[b], null, [c]]: the gap between b and c must not appear.
		const graph = graphFromSlots({
			a: ["b", null, "c"],
			b: ["a", null, null],
			c: ["a", null, null],
		});
		const byKey = new Map(
			[...breadthFirstTraverse(graph, "a")].map((n) => [n.key, n.neighbors]),
		);
		assert.deepEqual(byKey.get("a"), ["b", "c"]);
		const keys = [...breadthFirstTraverse(graph, "a")].map((n) => n.key);
		assert.deepEqual(keys, ["a", "b", "c"]);
	});
});

// ---------------------------------------------------------------------------
// edgeList
// ---------------------------------------------------------------------------

describe("edgeList", () => {
	it("yields no edges for a single node", () => {
		const graph = buildGraph([], ["a"]);
		assert.deepEqual([...edgeList(graph, "a")], []);
	});

	it("yields each undirected edge in both directions", () => {
		const graph = buildGraph([
			["a", "b"],
			["b", "c"],
		]);
		const edges = [...edgeList(graph, "a")];
		const asKeys = edges.map(([u, v]) => `${u}-${v}`).sort();
		assert.deepEqual(asKeys, ["a-b", "b-a", "b-c", "c-b"]);
	});
});
