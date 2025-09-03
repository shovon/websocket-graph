# Graph Relay RPC High-Level Spec: JSON-RPC 2.0-Based Protocol in Semi-Reliable and Reliable Mediums

## Introduction

This document narrows the specification of an RPC-based format to work within the graph relay architecture, in mediums that are assumed to be semi and fully-reliable. However, this document will not outline the implementation details, but rather a blueprint for how implementers should be able to implement the graph, both at the server level, and at the application level.

What's considered a "reliable medium" to deliver the outlined format is beyond the scope of this document.

Reliability refers to:

- delivery guarantees (analogous to TCP/IP)
- integrity of messages (e.g. via checksums, MACs, and signatures)
- message authentication (via a MAC)
- message deduplication
- message ordering guarantees

That said, there are provisions to allow nodes to reconcile discrepancy with the current state of the "neighborhood" relative to a node, even though, in environments like WebSocket, if things aren't truly up-to-date, the problem is much deeper than failing to deliver messages; it could be a failure of the delivery medium, or it could be a problem with the implementation. Regardless, this specification will include scenarios where the protocol MAY operate in unreliable environments, albeit "best effort" reliability coconciliation (an arguably "loose" definition of "reliable"). Additionally, some of these methods outlined in the protocol exist with the assumption that the server cannot be relied on, even in highly reliable environments.

## Specification

Both servers and clients SHOULD be fully compliant with the JSON-RPC 2.0 spec.

## Methods

### Client methods

These methods MAY be implemented by clients. Servers invoke them when necessary.

| Method             | Params                                   | Result | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------ | ---------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `adjacencyChanged` | `{ "neighbors": ClientId }`              | void   | This notifies the client that the adjacency in the graph has changed. Servers invoking this method MAY invoke it purely as a notification, and not as a request. JSON-RPC 2.0-compliant clients MUST respond to requests, if the method was invoked as a request.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `receiveMessage`   | `{"from": ClientId, "message": unknown}` | void   | Relays message to the intended recipients. Servers SHOULD invoke this method as a request, in order to receive responses that imply an error raised, such as the event that the message received was from a node that isn't in its adjacency. Clients SHOULD NOT immediately reject messages from senders that aren't in its adjacency; instead, they SHOULD first invoke a `getAdjacency` method request. If the response from `getAdjacency` indeed does not have the sender in the adjacency list, then the client SHOULD reject the message. Otherwise, if the sender is in the response, then the client SHOULD NOT reject the message; the client SHOULD accept the messsage. JSON-RPC 2.0-compliant clients SHOULD NOT respond to notifications. |

## Server methods

These methods SHOULD be implemented by servers. Clients invoke them when necessary.

| Method         | Params | Result       | Description |
| -------------- | ------ | ------------ | ----------- |
| `getAdjacency` |        | `ClientId[]` |             |

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
