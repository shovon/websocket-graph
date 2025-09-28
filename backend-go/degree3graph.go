package main

import (
	"errors"
	"fmt"
)

// Degree3Graph represents a graph where each node has at most 3 connections
// The value is an array of 3 pointers to keys, where nil represents no connection
type Degree3Graph[K comparable] map[K][3]*K

// NodeInfo represents a node and its neighbors for traversal
type NodeInfo[K comparable] struct {
	Key       K
	Neighbors []K
}

// SubtreeDetails holds information about a subtree for insertion logic
type subtreeDetails[K comparable] struct {
	NodeID     K
	Count      int
	Depth      int
	DepthCache map[K]int
	CountCache map[K]int
}

// GetDepth calculates the maximum depth from a given root node
func (graph Degree3Graph[K]) GetDepth(
	root K,
	visited map[K]bool,
	cache map[K]int,
) (int, error) {
	if cached, exists := cache[root]; exists {
		return cached, nil
	}

	// If root node doesn't exist in graph, return error
	node, exists := graph[root]
	if !exists {
		return 0, errors.New("root node not found")
	}

	// If we've already visited this node, return 0 to avoid cycles
	if visited[root] {
		return 0, nil
	}

	// Mark current node as visited
	visited[root] = true

	// Get depths of all non-nil neighbors
	var neighborDepths []int
	for _, neighbor := range node {
		if neighbor != nil {
			depth, err := graph.GetDepth(*neighbor, visited, cache)
			if err != nil {
				continue // Skip nodes that don't exist
			}
			neighborDepths = append(neighborDepths, depth)
		}
	}

	// Return 1 (for current level) plus max depth of subtrees
	result := 1
	if len(neighborDepths) > 0 {
		maxDepth := neighborDepths[0]
		for _, depth := range neighborDepths[1:] {
			if depth > maxDepth {
				maxDepth = depth
			}
		}
		result += maxDepth
	}

	cache[root] = result
	return result, nil
}

// GetCount returns the total count of nodes reachable from root
func (graph Degree3Graph[K]) GetCount(
	root K,
	visited map[K]bool,
	cache map[K]int,
) (int, error) {
	if cached, exists := cache[root]; exists {
		return cached, nil
	}

	// If root node doesn't exist in graph, return error
	node, exists := graph[root]
	if !exists {
		return 0, errors.New("root node not found")
	}

	// If we've already visited this node, return 0 to avoid double counting
	if visited[root] {
		return 0, nil
	}

	// Mark current node as visited
	visited[root] = true

	// Start count at 1 to count current node
	count := 1

	// Recursively traverse each non-nil neighbor
	for _, neighbor := range node {
		if neighbor != nil {
			neighborCount, err := graph.GetCount(*neighbor, visited, cache)
			if err != nil {
				continue // Skip nodes that don't exist
			}
			count += neighborCount
		}
	}

	cache[root] = count
	return count, nil
}

// FindSparseNode finds a node with at least one nil child (available slot)
func (graph Degree3Graph[K]) FindSparseNode(root K) (K, error) {
	// If the root node has any nil child, return root
	node, exists := graph[root]
	if !exists {
		return root, errors.New("root node should exist")
	}

	for _, child := range node {
		if child == nil {
			return root, nil
		}
	}

	// Otherwise, perform BFS to find a node with a nil child
	visited := make(map[K]bool)
	queue := []K{root}
	visited[root] = true

	for len(queue) > 0 {
		current := queue[0]
		queue = queue[1:]
		currentNode := graph[current]

		for _, child := range currentNode {
			if child == nil {
				return current, nil
			}
		}

		for _, neighbor := range currentNode {
			if neighbor != nil && !visited[*neighbor] {
				visited[*neighbor] = true
				queue = append(queue, *neighbor)
			}
		}
	}

	return root, errors.New("graph is not a tree")
}

// JoinNodes connects two nodes by finding sparse nodes and linking them
func (graph Degree3Graph[K]) JoinNodes(a, b K) ([]K, error) {
	if _, exists := graph[a]; !exists {
		return nil, errors.New("node a must exist in the graph")
	}
	if _, exists := graph[b]; !exists {
		return nil, errors.New("node b must exist in the graph")
	}

	sparseA, err := graph.FindSparseNode(a)
	if err != nil {
		return nil, err
	}
	sparseB, err := graph.FindSparseNode(b)
	if err != nil {
		return nil, err
	}

	aNeighbors := graph[sparseA]
	bNeighbors := graph[sparseB]

	for i, aNeighbor := range aNeighbors {
		if aNeighbor == nil {
			for j, bNeighbor := range bNeighbors {
				if bNeighbor == nil {
					// Now connect them
					aNeighbors[i] = &sparseB
					bNeighbors[j] = &sparseA
					graph[sparseA] = aNeighbors
					graph[sparseB] = bNeighbors
					return []K{sparseA, sparseB}, nil
				}
			}
		}
	}

	return nil, errors.New("unable to find available slots to join nodes")
}

// InsertNodeFill inserts a node by finding the first available slot
func (graph Degree3Graph[K]) InsertNodeFill(
	root *K,
	toInsert K,
) []K {
	// Check if node already exists (idempotence)
	if _, exists := graph[toInsert]; exists {
		return []K{}
	}

	if root != nil && len(graph) == 0 {
		panic("The specified root doesn't exist")
	}

	if root == nil && len(graph) == 0 {
		// If the graph is empty and no root is specified, just insert the node as root
		graph[toInsert] = [3]*K{nil, nil, nil}
		return []K{toInsert}
	}

	// Get first node as root if none specified
	if root == nil {
		for k := range graph {
			root = &k
			break
		}
	}

	if root == nil {
		panic("No root available")
	}

	for nodeInfo := range graph.BreadthFirstTraverse(*root) {
		key := nodeInfo.Key
		neighbors := nodeInfo.Neighbors

		if (key == *root && len(neighbors) < 3) || len(neighbors) == 2 {
			children := graph[key]
			for i, child := range children {
				if child == nil {
					children[i] = &toInsert
					graph[key] = children
					graph[toInsert] = [3]*K{&key, nil, nil}
					return []K{toInsert, key}
				}
			}
			panic("Not supposed to be here")
		}
	}

	return []K{}
}

// InsertSmallestSubtree inserts a node into the smallest subtree
func (graph Degree3Graph[K]) InsertSmallestSubtree(
	root *K,
	toInsert K,
	visited map[K]bool,
	sizeCache map[K]int,
) []K {
	// Check if node already exists (idempotence)
	if _, exists := graph[toInsert]; exists {
		return []K{}
	}

	if root != nil && len(graph) == 0 {
		panic("The specified root doesn't exist")
	}

	// Get first node as root if none specified
	if root == nil {
		for k := range graph {
			root = &k
			break
		}
	}

	if root == nil {
		panic("No root available")
	}

	visited[*root] = true

	// Iterate over the neighbors
	children := graph[*root]
	var smallestSubtree *struct {
		Key   K
		Count int
	}

	for i, child := range children {
		if child == nil {
			// If there is an empty slot in the root's children, insert the new node there
			children[i] = &toInsert
			graph[*root] = children
			graph[toInsert] = [3]*K{root, nil, nil}
			return []K{toInsert, *root}
		} else {
			// Get the size of the subtree
			visitedCopy := make(map[K]bool)
			visitedCopy[*root] = true
			subtreeSize, err := graph.GetCount(*child, visitedCopy, sizeCache)
			if err != nil {
				panic("The subtree should have existed")
			}

			if smallestSubtree == nil || subtreeSize < smallestSubtree.Count {
				smallestSubtree = &struct {
					Key   K
					Count int
				}{*child, subtreeSize}
			}
		}
	}

	if smallestSubtree == nil {
		panic("A subtree should have been defined")
	}

	return graph.InsertSmallestSubtree(&smallestSubtree.Key, toInsert, visited, sizeCache)
}

// InsertNode inserts a node using a sophisticated algorithm that considers depth and count
func (graph Degree3Graph[K]) InsertNode(
	root *K,
	toInsert K,
	visited map[K]bool,
	depthCache map[K]int,
	countCache map[K]int,
) []K {
	// Check if node already exists (idempotence)
	if _, exists := graph[toInsert]; exists {
		return []K{}
	}

	// Don't bother with invalid inputs
	if root != nil && len(graph) == 0 {
		panic("The specified root doesn't exist")
	}

	if root != nil {
		visited[*root] = true
	}

	// Empty graphs just get something handed to them
	if len(graph) == 0 {
		graph[toInsert] = [3]*K{nil, nil, nil}
		return []K{toInsert}
	}

	// Get first node as root if none specified
	if root == nil {
		for k := range graph {
			root = &k
			break
		}
	}

	if root == nil {
		panic("No root available")
	}

	children := graph[*root]

	// Check for available slots
	for i, child := range children {
		if child == nil {
			children[i] = &toInsert
			graph[*root] = children
			if _, exists := graph[toInsert]; !exists {
				graph[toInsert] = [3]*K{root, nil, nil}
			}
			return []K{toInsert, *root}
		}
	}

	// All slots are filled, need to recurse
	type countDepth struct {
		count int
		depth int
	}

	var details []subtreeDetails[K]

	for _, child := range children {
		if child != nil && !visited[*child] {
			visitedCopy := make(map[K]bool)
			visitedCopy[*root] = true

			count, err := graph.GetCount(*child, visitedCopy, countCache)
			if err != nil {
				panic(fmt.Sprintf("The node %v not found", *child))
			}

			visitedCopy2 := make(map[K]bool)
			visitedCopy2[*root] = true
			depth, err := graph.GetDepth(*child, visitedCopy2, depthCache)
			if err != nil {
				panic(fmt.Sprintf("The node %v not found", *child))
			}

			detail := subtreeDetails[K]{
				NodeID:     *child,
				Count:      count,
				Depth:      depth,
				CountCache: countCache,
				DepthCache: depthCache,
			}
			details = append(details, detail)
		}
	}

	// Sort by depth first, then by count
	for i := 0; i < len(details)-1; i++ {
		for j := i + 1; j < len(details); j++ {
			a, b := details[i], details[j]
			if a.Depth > b.Depth || (a.Depth == b.Depth && a.Count > b.Count) {
				details[i], details[j] = details[j], details[i]
			}
		}
	}

	if len(details) == 0 {
		return []K{}
	}

	return graph.InsertNode(&details[0].NodeID, toInsert, visited, depthCache, countCache)
}

// FindCentroid finds the centroid of the tree
func (graph Degree3Graph[K]) FindCentroid(root K) (K, error) {
	totalSize, err := graph.GetCount(root, make(map[K]bool), make(map[K]int))
	if err != nil {
		return root, errors.New("fatal error: could not determine graph size")
	}

	return graph.findCentroidRecursive(root, nil, totalSize)
}

func (graph Degree3Graph[K]) findCentroidRecursive(
	currentNode K,
	parent *K,
	totalSize int,
) (K, error) {
	neighbors, exists := graph[currentNode]
	if !exists {
		return currentNode, errors.New("current node not found in graph")
	}

	for _, neighborPtr := range neighbors {
		if neighborPtr == nil {
			continue
		}

		neighborNode := *neighborPtr
		if parent != nil && neighborNode == *parent {
			continue
		}

		visited := make(map[K]bool)
		visited[currentNode] = true
		subtreeSize, err := graph.GetCount(neighborNode, visited, make(map[K]int))
		if err != nil {
			return currentNode, errors.New("fatal error: subtree size calculation failed")
		}

		if subtreeSize > totalSize/2 {
			return graph.findCentroidRecursive(neighborNode, &currentNode, totalSize)
		}
	}

	return currentNode, nil
}

// DeleteNode removes a node from the graph and reconnects orphaned subtrees
func (graph Degree3Graph[K]) DeleteNode(toDelete K) []K {
	modifiedNodes := make(map[K]bool)

	if len(graph) == 0 {
		return []K{} // Idempotence
	}

	children, exists := graph[toDelete]
	if !exists {
		return []K{} // Idempotence
	}

	// Update all children to remove reference to toDelete
	for _, child := range children {
		if child != nil {
			neighbors := graph[*child]
			for i, neighbor := range neighbors {
				if neighbor != nil && *neighbor == toDelete {
					neighbors[i] = nil
					graph[*child] = neighbors
					modifiedNodes[*child] = true
				}
			}
		}
	}

	delete(graph, toDelete)

	// Collect orphans (non-nil children)
	var orphans []K
	for _, child := range children {
		if child != nil {
			orphans = append(orphans, *child)
		}
	}

	if len(orphans) <= 1 {
		result := make([]K, 0, len(modifiedNodes))
		for k := range modifiedNodes {
			result = append(result, k)
		}
		return result
	}

	// Find centroid of the largest subtree and connect others to it
	dominant := orphans[0]
	subordinates := orphans[1:]

	dominantCentroid, err := graph.FindCentroid(dominant)
	if err != nil {
		panic(err)
	}

	for _, sub := range subordinates {
		joined, err := graph.JoinNodes(dominantCentroid, sub)
		if err != nil {
			panic(err)
		}
		for _, node := range joined {
			modifiedNodes[node] = true
		}
	}

	result := make([]K, 0, len(modifiedNodes))
	for k := range modifiedNodes {
		result = append(result, k)
	}
	return result
}

// DepthFirstTraverse performs depth-first traversal of the graph
func (graph Degree3Graph[K]) DepthFirstTraverse(root K) <-chan NodeInfo[K] {
	ch := make(chan NodeInfo[K])
	visited := make(map[K]bool)

	go func() {
		defer close(ch)
		graph.depthFirstTraverseRecursive(root, visited, ch)
	}()

	return ch
}

func (graph Degree3Graph[K]) depthFirstTraverseRecursive(
	root K,
	visited map[K]bool,
	ch chan<- NodeInfo[K],
) {
	children, exists := graph[root]
	if !exists {
		panic("Node at root does not exist")
	}

	visited[root] = true

	var neighbors []K
	for _, child := range children {
		if child != nil {
			neighbors = append(neighbors, *child)
		}
	}

	ch <- NodeInfo[K]{Key: root, Neighbors: neighbors}

	for _, child := range children {
		if child != nil && !visited[*child] {
			graph.depthFirstTraverseRecursive(*child, visited, ch)
		}
	}
}

// BreadthFirstTraverse performs breadth-first traversal of the graph
func (graph Degree3Graph[K]) BreadthFirstTraverse(root K) <-chan NodeInfo[K] {
	ch := make(chan NodeInfo[K])

	go func() {
		defer close(ch)

		_, exists := graph[root]
		if !exists {
			panic("Node at root does not exist")
		}

		queue := []K{root}
		visited := make(map[K]bool)

		for len(queue) > 0 {
			next := queue[0]
			queue = queue[1:]

			neighbors, exists := graph[next]
			if !exists {
				panic(fmt.Sprintf("Node at %v not found", next))
			}

			visited[next] = true

			var neighborKeys []K
			for _, toVisit := range neighbors {
				if toVisit != nil {
					neighborKeys = append(neighborKeys, *toVisit)
					if !visited[*toVisit] {
						queue = append(queue, *toVisit)
					}
				}
			}

			ch <- NodeInfo[K]{Key: next, Neighbors: neighborKeys}
		}
	}()

	return ch
}

// EdgeList returns all edges in the graph as pairs
func (graph Degree3Graph[K]) EdgeList(root K) <-chan [2]K {
	ch := make(chan [2]K)

	go func() {
		defer close(ch)

		for nodeInfo := range graph.DepthFirstTraverse(root) {
			key := nodeInfo.Key
			for _, neighbor := range nodeInfo.Neighbors {
				ch <- [2]K{key, neighbor}
			}
		}
	}()

	return ch
}
