# Graph Relay RPC: JSON-RPC 2.0-Based Protocol in Reliable Mediums

This document outlines the RPC-based format to work with the the graph relay architecture. However, this document will not outline the implementation details, but rather a blueprint for how implementers should be able to implement the graph, both at the server level, and at the application level.

What reliable medium to implement the outlined format is beyond the scope of this document.

## Server

### Notifying neighbour changes

```json
{
	"jsonrpc": "2.0",
	"method": "adjacencyChanged",
	"params": {
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
	"id": 1
}
```

Response from server:

```json
{
	"jsonrpc": "2.0",
	"result": ["b", "c", "d"],
	"id": 1
}
```

### Sending a message to a node (fire and forget)

```json
{
	"jsonrpc": "2.0",
	"method": "sendTo",
	"params": {
		"to": ["b"],
		"payload": "message"
	}
}
```

### Sending a message to a node (delivery receipt)

```json
{
	"jsonrpc": "2.0",
	"method": "sendTo",
	"params": {
		"to": ["b"],
		"payload": "message"
	},
	"id": 1
}
```

Response:

```json
{
	"jsonrpc": "2.0",
	"result": "success",
	"id": 1
}
```
