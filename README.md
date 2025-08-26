# Graph Server

The server maps clients to nodes in a graph. A client can relay messages only to clients on adjacent nodes.

## How to read this doc

Since the communication protocol uses the [JSON-RPC 2.0 spec](https://www.jsonrpc.org/specification) as an envelope for request and response cycles, as well as one-off messages, there will be a lot of data schema definitions.

For that, we're going to be using [TypeScript type notation](https://typescript-type-notation.netlify.app/).

For example, something that could represent the JSON:

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

Now, TypeScript type definitions also lack features to narrow the typeset even more, but so far, as far as the usecases within the scope of this application is concerned, TypeScript types is more than adequate.

## Technical details

The server is a WebSocket server, and, for simplicity, it will _only_ accept WebSocket connections.

There are two endpoints: the debugger endpoint, and the main endpoint.

### Debugger endpoint

The debugger endpoint is at `/debug`.

The debugger endpoint will _only_ send an adjacency list of the form, from time to time:

```typescript
type ClientId = string;

type AdjacencyList = [ClientId, ClientId[]][];
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
