# Graph Relay RPC: JSON-RPC 2.0-Based Protocol

This document outlines the RPC-based format to work with the the graph relay architecture. However, this document will not outline the implementation details, but rather a blueprint for how implementers should be able to implement the graph, both at the server level, and at the application level.

## Server

### Notifying neighbour changes

```json
{
	"jsonrpc": "2.0",
	"method": "adjacencyChanged",
	"params": {
		"subject": "a",
		"sequence": 1,
		"neighbors": ["b", "c", "d"]
	}
}
```

## Client

### Requesting State

```json
{
	"jsonrpc": "2.0",
	"method": "getAdjacency",
	"params": {}
}
```
