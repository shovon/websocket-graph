# Graph Server

The server maps clients to nodes in a graph. A client MAY have its messages relayed only to clients on adjacent nodes, and SHALL NOT communicate directly with nodes that it is not adjacent to.

## How to read this doc

Since the communication protocol uses the [JSON-RPC 2.0 spec](https://www.jsonrpc.org/specification) as an envelope for request and response cycles, as well as one-off messages, there will be a lot of data schema definitions.

For that, we're going to be using [TypeScript type notation](https://tstypes.org/).

For example, something that could represent the [JSON](https://www.json.org/json-en.html):

```json
{
	"hello": "world"
}
```

Could be represented as:

```typescript
type ExampleObject = {
	hello: string;
};
```

The TypeScript type notation is valuable, because the above JSON is just an example; it doesn't provide much details about the constraints of each field. Is the field for `hello` generally a string, or only a specific set of strings are allowed? JSON examples don't provide much details, but TypeScript type definitions do.

Now, TypeScript type definitions also lack features to narrow the typeset even more, but so far, as far as the usecases within the scope of this application is concerned, TypeScript types are more than adequate.

This document has been split into several categories:

- architecture
- specification
- implementation

## Specification

### Architecture

1. **Network Layer Topology**

   - The network SHALL conform to a [star topology](https://en.wikipedia.org/wiki/Star_network), where the central hub is the server and each spoke is a client node.
   - All client communication MUST traverse the server. Direct client-to-client network links are not permitted.

2. **Application Layer Topology**

   - Despite the network-layer star topology, the server SHALL maintain an internal representation of the clients as nodes in a graph.
   - The internal graph MUST allow every node to be logically reachable from every other node.
   - The server SHALL ensure that message routing reflects the graph connectivity, regardless of the underlying client–server constraints.

3. **Reachability Guarantees**

   - The server MUST enforce connectivity across all nodes such that, from the perspective of the application, no node is isolated.
   - Logical communication paths SHALL be preserved even if the underlying network is intermittent or unreliable.

4. **Performance Expectations**

   - Implementers SHOULD be aware of the [Eight Fallacies of Distributed Computing](https://en.wikipedia.org/wiki/Fallacies_of_distributed_computing).
   - Nevertheless, the system SHALL be designed under the assumption that clients and servers react without undue delay.
   - Message delivery is expected to be perceived as instantaneous at the application layer, even though the underlying network MAY exhibit latency, jitter, or packet loss.

### Debugger endpoint

The debugger endpoint is at `/debug`.

The debugger endpoint will send several things at once

```typescript
type ClientId = string;

type EdgeList = [ClientId, ClientId][];
```

In words, the adjacency list is an array of pairs of client ID key on the left, and an array of client IDs on the right.

Example:

```json
[
	["1", ["2", "3", "4"]],
	["2", ["1"]],
	["3", ["1"]],
	["4", ["1"]]
];
```

### Main endpoint

The main endpoint is at `/`.

Due to the back and forth nature of this endpoint, we elected to use the JSON-RPC 2.0 spec. This is because there are several implementations that we can draw from, especially in the form of packages that can be consumed by the programming environment at hand.
