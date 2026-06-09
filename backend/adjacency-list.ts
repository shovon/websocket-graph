export type Degree3Graph<K> = Map<K, [[K] | null, [K] | null, [K] | null]>;

function isNil(value: unknown) {
	return value === null || value === undefined;
}

export function getDepth<K>(
	graph: Degree3Graph<K>,
	root: K,
	visited: Set<K>,
	cache: Map<K, [number]>,
): number | null {
	const cached = cache.get(root);
	if (!isNil(cached)) return cached[0];

	// If root node doesn't exist in graph, return null
	const node = graph.get(root);
	if (!node) return null;

	// If we've already visited this node, return 0 to avoid cycles
	if (visited.has(root)) return 0;

	// Mark current node as visited
	visited.add(root);

	// Get depths of all non-null neighbors
	const neighborDepths: number[] = [];
	for (const neighbor of node) {
		if (neighbor) {
			const depth = getDepth(graph, neighbor[0], visited, cache);
			if (depth !== null) {
				neighborDepths.push(depth);
			}
		}
	}

	// Return 1 (for current level) plus max depth of subtrees
	// If no neighbors, just return 1 for current node
	const result = 1 + (neighborDepths.length ? Math.max(...neighborDepths) : 0);
	cache.set(root, [result]);
	return result;
}

/**
 * Gets the count of
 * @param graph The graph to traverse
 * @param root The root from which to traverse from
 * @param visited A cache of visited nodes
 * @param cache A cache of counts from all nodes visited
 * @returns The count of all nodes (including the root); if root doesn't exist,
 *   then null.
 */
export function getCount<K>(
	graph: Degree3Graph<K>,
	root: K,
	visited: Set<K>,
	cache: Map<K, number>,
): number | null {
	const cached = cache.get(root);
	if (!isNil(cached)) return cached;

	// If root node doesn't exist in graph, return null
	const node = graph.get(root);
	if (!node) return null;

	// If we've already visited this node, return 0 to avoid double counting
	if (visited.has(root)) return 0;

	// Mark current node as visited
	visited.add(root);

	// Start count at 1 to count current node
	let count = 1;

	// Recursively traverse each non-null neighbor
	for (const neighbor of node) {
		if (neighbor) {
			const neighborCount = getCount(graph, neighbor[0], visited, cache);
			if (neighborCount !== null) {
				count += neighborCount;
			}
		}
	}

	cache.set(root, count);
	return count;
}

export function findSparseNode<K>(graph: Degree3Graph<K>, root: K): K {
	// If the root node has any null child, return root
	const node = graph.get(root);
	if (!node) throw new Error("All node should exist");
	if (node.some((child) => child === null)) {
		return root;
	}

	// Otherwise, perform BFS to find a node with a null child
	const visited = new Set<K>();
	const queue: K[] = [root];
	visited.add(root);

	while (queue.length > 0) {
		const current = queue.shift()!;
		const currentNode = graph.get(current);
		if (!currentNode) throw new Error("All nodes should exist.");

		if (currentNode.some((child) => child === null)) {
			return current;
		}

		for (const neighbor of currentNode) {
			if (neighbor && !visited.has(neighbor[0])) {
				visited.add(neighbor[0]);
				queue.push(neighbor[0]);
			}
		}
	}

	throw new Error("Graph is not a tree.");
}

export function joinNodes<K>(graph: Degree3Graph<K>, a: K, b: K): K[] {
	if (!graph.has(a) || !graph.has(b))
		throw new Error("Supplied nodes must exist in the graph");

	a = findSparseNode(graph, a);
	b = findSparseNode(graph, b);

	const aNeighbors = graph.get(a);
	if (!aNeighbors) throw new Error("Node not found");

	const bNeighbors = graph.get(b);
	if (!bNeighbors) throw new Error("Node not found");

	for (let i = 0; i < aNeighbors.length; i++) {
		const aNeighbor = aNeighbors[i];
		if (aNeighbor === null) {
			for (let j = 0; j < bNeighbors.length; j++) {
				const bNeighbor = bNeighbors[j];
				if (bNeighbor === null) {
					// Now kiss
					aNeighbors[i] = [b];
					bNeighbors[j] = [a];
					return [a, b];
				}
			}
		}
	}

	throw new Error("Not supposed to be here.");
}

export function insertNodeFill<K>(
	graph: Degree3Graph<K>,
	{ root, toInsert }: { root?: [K] | null; toInsert: K },
): K[] {
	// Eh, idempotence is not a medical conditiono
	if (graph.has(toInsert)) return [];

	if (root && graph.size <= 0)
		throw new Error("The specified root doesn't exist");

	if (!root && graph.size <= 0) {
		// If the graph is empty and no root is specified, just insert the node as
		// the root.
		graph.set(toInsert, [null, null, null]);
		// console.log("Filling tree");
		return [toInsert];
	}

	const next = graph.entries().next();
	if (!next.value) throw new Error("Graph is empty");
	root = root ?? [next.value[0]];

	if (!root) throw new Error("No root available");

	for (const { key, neighbors } of breadthFirstTraverse(graph, root[0])) {
		if ((key === root[0] && neighbors.length < 3) || neighbors.length === 2) {
			const children = graph.get(key);
			if (!children) throw new Error(`Node at ${key} not found`);
			for (const [i, child] of children.entries()) {
				if (child === null) {
					children[i] = [toInsert];
					graph.set(toInsert, [[key], null, null]);
					// console.log("Filling tree");
					return [toInsert, key];
				}
			}
			throw new Error("Not supposed to be here");
		}
	}

	return [];
}

export function insertSmallestSubtree<K>(
	graph: Degree3Graph<K>,
	{ root, toInsert }: { root?: [K] | null; toInsert: K },
	visited: Set<K>,
	sizeCache: Map<K, number>,
) {
	// Eh, idempotence is not a medical conditiono
	if (graph.has(toInsert)) return [];

	// console.log("Inserting into smallest subtree");

	if (root && graph.size <= 0)
		throw new Error("The specified root doesn't exist");

	const next = graph.entries().next();
	if (!next.value) throw new Error("Graph is empty");
	root = root ?? [next.value[0]];

	if (!root) throw new Error("No root available");

	visited.add(root[0]);

	// Iterate over the neighbors
	const children = graph.get(root[0]);
	if (!children) throw new Error("The specified root doesn't exist");

	let smallestSubtree: {
		key: K;
		count: number;
	} | null = null;

	for (const [i, child] of children.entries()) {
		if (child === null) {
			// If there is an empty slot in the root's children, insert the new node there.
			children[i] = [toInsert];
			graph.set(toInsert, [root, null, null]);
			return [toInsert, root[0]];
		} else {
			// Get the size of the subtree immediately succeeding the child node
			// Use the getCount method
			const subtreeSize = getCount(
				graph,
				child[0],
				new Set([root[0]]),
				sizeCache,
			);
			if (subtreeSize === null)
				throw new Error("The subtree should have existed.");
			if (smallestSubtree === null) {
				smallestSubtree = {
					key: child[0],
					count: subtreeSize,
				};
			} else if (subtreeSize < smallestSubtree.count) {
				smallestSubtree = {
					key: child[0],
					count: subtreeSize,
				};
			}
		}
	}

	if (smallestSubtree === null)
		throw new Error("A subtree should have been defined");

	return insertSmallestSubtree(
		graph,
		{
			root: [smallestSubtree.key],
			toInsert,
		},
		visited,
		sizeCache,
	);
}

/**
 * The purpose of this functon is to insert a new node (not used for joining two
 * unconnected graphs).
 * @param graph The graph to insert to
 * @param rootAndToInsert The root node and the node to inser.t
 * @param visited A cache of all visited nodes, to avoid revisiting nodes.
 * @param countCaches Cashes that holds the depth and count; used for dynamic
 *     programming
 * @returns
 */
export function insertNode<K>(
	graph: Degree3Graph<K>,
	{ root, toInsert }: { root?: [K] | null; toInsert: K },
	visited: Set<K>,
	{
		depthCache,
		countCache,
	}: { depthCache: Map<K, [number]>; countCache: Map<K, number> },
): K[] {
	if (graph.has(toInsert)) return []; // Eh, idempotence is not a medical condition

	// Don't bother with trolls.
	if (root && graph.size <= 0)
		throw new Error("The specified root doesn't exist");

	if (root !== null && root !== undefined) visited.add(root[0]);

	// Empty graphs just get something handed to them.
	if (graph.size <= 0) {
		graph.set(toInsert, [null, null, null]);
		return [toInsert];
	}

	// This is where all the fun stuff begins.

	const next = graph.entries().next();
	if (!next.value) throw new Error("Graph is empty");
	root = root ?? [next.value[0]];

	if (!root) throw new Error("No root available");

	const children = graph.get(root[0]);
	if (!children) throw new Error("The specified root doesn't exist");

	for (let i = 0; i < children.length; i++) {
		if (children[i] === null) {
			children[i] = [toInsert];
			const childrenOfToInsert = graph.get(toInsert);
			if (!childrenOfToInsert) {
				graph.set(toInsert, [root, null, null]);
			}
			return [toInsert, root[0]];
		}
	}

	const provabllyNonNullChildren: [[K], [K], [K]] = children as [[K], [K], [K]];

	type CountDepth = {
		count: number;
		depth: number;
	};

	type SubtreeDetails = {
		nodeId: K;
		depthCache: Map<K, [number]>;
		countCache: Map<K, number>;
	} & CountDepth;

	function sortByDetail(a: CountDepth, b: CountDepth): number {
		if (a.depth < b.depth) return -1;
		if (a.depth > b.depth) return 1;

		if (a.count < b.count) return -1;
		if (a.count > b.count) return 1;

		return 0;
	}

	const details: SubtreeDetails[] = provabllyNonNullChildren
		.filter(([c]) => !visited.has(c))
		.map((c) => {
			const count = getCount(graph, c[0], new Set([root[0]]), countCache);

			if (count === null) {
				throw new Error(`The node ${c} not found`);
			}

			const depth = getDepth(graph, c[0], new Set([root[0]]), depthCache);

			if (depth === null) {
				throw new Error(`The node ${c} not found`);
			}

			const details: SubtreeDetails = {
				nodeId: c[0],
				countCache,
				count,

				depthCache,
				depth,
			};

			return details;
		});

	details.sort(sortByDetail);

	return insertNode(graph, { root: [details[0].nodeId], toInsert }, visited, {
		depthCache: depthCache,
		countCache: countCache,
	});
}

function findCentroidRecursive<K>(
	graph: Degree3Graph<K>,
	currentNode: K,
	parent: K | null,
	totalSize: number,
): K {
	const neighbors = graph.get(currentNode);
	if (!neighbors) throw new Error("Current node not found in graph");

	for (const neighborTuple of neighbors) {
		if (neighborTuple === null) continue;

		const neighborNode = neighborTuple[0];
		if (neighborNode === parent) continue;

		const subtreeSize = getCount(
			graph,
			neighborNode,
			new Set([currentNode]),
			new Map(),
		);
		if (subtreeSize === null) {
			throw new Error("Fatal error: subtree size calculation failed");
		}

		if (subtreeSize > totalSize / 2) {
			return findCentroidRecursive(graph, neighborNode, currentNode, totalSize);
		}
	}

	return currentNode;
}

export function findCentroid<K>(graph: Degree3Graph<K>, root: K): K {
	const totalSize = getCount(graph, root, new Set(), new Map());
	if (totalSize === null)
		throw new Error("Fatal error: could not determine graph size");

	return findCentroidRecursive(graph, root, null, totalSize);
}

export function deleteNode<K>(graph: Degree3Graph<K>, toDelete: K): K[] {
	const modifiedNodes: Set<K> = new Set();

	if (graph.size <= 0) return []; // Idempotence is not a medical condition.

	const children = graph.get(toDelete);

	if (!children) return []; // Idempotence is not a medical condition.

	// Iterate through each of these children, and for each child, get their
	// neighbours, and any neighbour that equals to the `toDelete` node, set it
	// to null.
	for (const child of children) {
		if (child !== null) {
			const neighbors = graph.get(child[0]);
			if (!neighbors)
				throw new Error("Why doesn't the given node exist it exist?");
			for (let i = 0; i < neighbors.length; i++) {
				const neighbor = neighbors[i];
				if (neighbor !== null) {
					if (neighbor[0] === toDelete) {
						neighbors[i] = null;
						modifiedNodes.add(child[0]);
					}
				}
			}
		}
	}

	graph.delete(toDelete);

	// Deleted, but now we have a bunch of orphans.

	const orphans = (children.filter((c) => c !== null) as [K][]).sort(
		(a, b) => b.length - a.length,
	);

	if (orphans.length <= 1) return [...modifiedNodes];

	const [dominant, ...subordinates] = orphans;

	const dominantCentroid = findCentroid<K>(graph, dominant[0]);

	for (const [sub] of subordinates) {
		const joined = joinNodes(graph, dominantCentroid, sub);
		for (const node of joined) {
			modifiedNodes.add(node);
		}
	}

	return [...modifiedNodes];
}

export function* depthFirstTraverse<K>(
	graph: Degree3Graph<K>,
	root: K,
	visited: Set<K> = new Set<K>(),
): IterableIterator<{ key: K; neighbors: K[] }> {
	const children = graph.get(root);
	if (!children) throw new Error("Node at root does not exist");
	visited.add(root);
	yield {
		key: root,
		neighbors: children.filter((k): k is [K] => !!k).map(([k]) => k),
	};
	for (const child of children) {
		if (child !== null) {
			if (visited.has(child[0])) continue;
			yield* depthFirstTraverse(graph, child[0], visited);
		}
	}
}

export function* breadthFirstTraverse<K>(
	graph: Degree3Graph<K>,
	root: K,
): IterableIterator<{ key: K; neighbors: K[] }> {
	const children = graph.get(root);
	if (!children) throw new Error("Node at root does not exist");

	const queue: K[] = [root];
	const visited = new Set<K>();
	while (queue.length > 0) {
		const next = queue[0];
		queue.shift();
		const neighbors = graph.get(next);
		if (!neighbors) throw new Error(`Node at ${next} not found`);
		visited.add(next);
		for (const toVisit of neighbors) {
			if (toVisit) {
				if (!visited.has(toVisit[0])) queue.push(toVisit[0]);
			}
		}
		yield {
			key: next,
			neighbors: neighbors.filter((c): c is [K] => c !== null).map(([c]) => c),
		};
	}
}

export function* edgeList<K>(
	graph: Degree3Graph<K>,
	root: K,
): IterableIterator<[K, K]> {
	for (const node of depthFirstTraverse(graph, root, new Set())) {
		const { key, neighbors } = node;
		for (const neighbor of neighbors) {
			yield [key, neighbor];
		}
	}
}
