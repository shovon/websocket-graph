package main

func main() {
	graph := Degree3Graph[string]{}

	root := "a"
	graph.InsertNode(nil, root, map[string]bool{}, map[string]int{}, map[string]int{})
	graph.InsertNode(&root, "b", map[string]bool{}, map[string]int{}, map[string]int{})
	graph.InsertNode(&root, "c", map[string]bool{}, map[string]int{}, map[string]int{})
	graph.InsertNode(&root, "d", map[string]bool{}, map[string]int{}, map[string]int{})
	graph.InsertNode(&root, "e", map[string]bool{}, map[string]int{}, map[string]int{})
	graph.InsertNode(&root, "f", map[string]bool{}, map[string]int{}, map[string]int{})
	graph.InsertNode(&root, "g", map[string]bool{}, map[string]int{}, map[string]int{})
	graph.InsertNode(&root, "h", map[string]bool{}, map[string]int{}, map[string]int{})
	graph.InsertNode(&root, "i", map[string]bool{}, map[string]int{}, map[string]int{})

	for nodeInfo := range graph.DepthFirstTraverse(root) {
		println("Node:", nodeInfo.Key)
	}
}
