# Graph Relay RPC: JSON-RPC 2.0-Based Protocol in Reliable Mediums

## Introduction

This document outlines the RPC-based format to work with the graph relay architecture, in mediums that are assumed to be reliable. However, this document will not outline the implementation details, but rather a blueprint for how implementers should be able to implement the graph, both at the server level, and at the application level.

What's considered a "reliable medium" to deliver the outlined format is beyond the scope of this document.

That said, there are provisions to allow nodes to reconcile discrepancy with the current state of the "neighborhood" relative to a node, even though, in environments like WebSocket, if things aren't truly up-to-date, the problem is much deeper than failing to deliver messages; it could be a failure of the delivery medium, or it could be a problem with the implementation. Regardless, this specification will include scenarios where the protocol MAY operate in unreliable environments, albeit "best effort" reliability coconciliation (an arguably "loose" definition of "reliable"). Additionally, some of these methods outlined in the protocol exist with the assumption that the server cannot be relied on, even in highly reliable environments.

## Methods

### Client methods

These methods MAY be implemented by clients. Servers invoke them when necessary.

| Method             | Params                      | Result | Description                                                                                                                                                        |
| ------------------ | --------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `adjacencyChanged` | `{ "neighbors": string[] }` | void   | This notifies the client that the adjacency in the graph has changed. Servers invoking this method SHOULD invoke it purely as a notification, and not as a request |

## Server methods

These methods SHOULD be implemented by client. Servers invoke them when necessary.

### Requesting current neighborhood status

```json
{
	"jsonrpc": "2.0",
	"method": "getAdjacency",
	"id": 1
}
```

Response from server:

This SHOULD be implemented by servers.

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
