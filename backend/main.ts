import WebSocket, { WebSocketServer } from "ws";
import {
	JSONRPCServer,
	JSONRPCClient,
	JSONRPCErrorCode,
	JSONRPCErrorException,
} from "json-rpc-2.0";
import { type Degree3Graph, insertNode } from "./adjacency-list";
import { z } from "zod";
import { ClientId, JSONRPCRequest } from "./types";

const jsonRpcServer = new JSONRPCServer<ClientId>();

const wss = new WebSocketServer({ port: 8080 });

const graph: Degree3Graph<string> = new Map();
const clientMapping: Map<string, WebSocket> = new Map();
const debuggerClients = new Set<WebSocket>();

const communicationClient = new JSONRPCClient<WebSocket>((r, ws) => {
	ws.send(r);
});

// Handle the send method from clients.
jsonRpcServer.addMethod("send", (message: unknown, clientId) => {
	// Client not in the graph? WTF is it doing there/ Delete.
	const neighbors = graph.get(clientId);
	if (!neighbors) {
		clientMapping.delete(clientId);
		return;
	}

	// Parse the incoming message.
	const parsed = JSONRPCRequest.safeParse(message);
	if (!parsed.success) {
		throw new JSONRPCErrorException(
			"Invalid params",
			JSONRPCErrorCode.InvalidParams,
			parsed.error,
		);
	}

	const neighborsSet = new Set(
		neighbors.filter((n): n is [string] => !!n).map(([n]) => n),
	);

	for (const [neighbor] of neighbors.filter((n): n is [string] => !!n)) {
		if (!neighborsSet.has(neighbor)) {
		} else {
			const wsClient = clientMapping.get(neighbor);
			if (wsClient) {
				communicationClient.notify("deliver", message, wsClient);
			}
		}
	}
});

const debuggerClient = new JSONRPCClient<WebSocket>((r, ws) => {
	ws.send(r);
});

let count = 0;
wss.on("connection", (ws, req) => {
	console.log(`Client connected to ${req.url}`);

	// All the debug listeners.
	if (req.url === "/debug") {
		// You know, there could have been two approaches:
		//
		// - event listeners
		// - thrown into a pile to get acted on

		debuggerClient.notify(
			"graph",
			[...graph].map(([key, nodes]) => [
				key,
				nodes.filter((n): n is [string] => n !== null).map(([n]) => n),
			]),
			ws,
		);
	} else if (req.url === "/") {
		count++;
		const id = `${count}`;

		clientMapping.set(id, ws);

		ws.on("message", (message) =>
			(async () => {
				try {
					const parsed = JSONRPCRequest.safeParse(
						JSON.parse(message.toString()),
					);
					if (!parsed.success) {
						ws.send(
							JSON.stringify({
								jsonrpc: "2.0",
								error: {
									code: -32700,
									message: "Parse error",
								},
								id: null, // Or the original request ID if it could be parsed
							}),
						);
						return;
					}

					// Process the incoming JSON-RPC request
					// The jsonRpcServer handles parsing the request and calling the appropriate method
					const response = await jsonRpcServer.receive(parsed.data);
					// If there's a response (e.g., for a method call, not a notification)
					if (response) {
						// Send the JSON-RPC response back to the client
						ws.send(JSON.stringify(response));
						console.log(`Sent response to client: ${JSON.stringify(response)}`);
					}
				} catch (error) {
					console.error("Error processing message:", error);
					// In a real application, you might send an error response back to the client
					if (ws.readyState === WebSocket.OPEN) {
						ws.send(
							JSON.stringify({
								jsonrpc: "2.0",
								error: {
									code: JSONRPCErrorCode.InternalError,
									message: "Internal server error",
								},
								id: null, // Or the original request ID if it could be parsed
							}),
						);
					}
				}
			})().catch((e) => {
				console.error(e);
			}),
		);

		ws.on(
			"close",
			((id) => () => {
				clientMapping.delete(id);
				console.log("Client disconnected.");
			})(id),
		);

		// Event listener for errors
		ws.on(
			"error",
			((id) => (error) => {
				clientMapping.delete(id);
				console.error("WebSocket error:", error);
			})(id),
		);
	} else {
		ws.close();
	}
});
