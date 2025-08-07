import WebSocket, { WebSocketServer } from "ws";
import { JSONRPCServer, JSONRPCClient } from "json-rpc-2.0";
import { type Degree3Graph, insertNode } from "./adjacency-list";

const jsonRpcServer = new JSONRPCServer();

jsonRpcServer.addMethod("broadcast", (message: unknown) => {});

const wss = new WebSocketServer({ port: 8080 });

const graph: Degree3Graph<string> = new Map();
const clientMapping: Map<string, WebSocket> = new Map();

function addClient<K>(id: K, client: WebSocket) {}

let count = 0;

wss.on("connection", (ws, req) => {
	console.log(`Client connected to ${req.url}`);

	if (req.url === "/debug") {
		// TODO: implement
	} else {
		count++;
		const id = `${count}`;
		// TODO: impelement
		clientMapping.set(id, ws);

		ws.on("message", (message) =>
			(async () => {
				// try {
				// 	// Process the incoming JSON-RPC request
				// 	// The jsonRpcServer handles parsing the request and calling the appropriate method
				// 	const response = await jsonRpcServer.receive(
				// 		JSON.parse(message.toString()),
				// 	);
				// 	// If there's a response (e.g., for a method call, not a notification)
				// 	if (response) {
				// 		// Send the JSON-RPC response back to the client
				// 		ws.send(JSON.stringify(response));
				// 		console.log(`Sent response to client: ${JSON.stringify(response)}`);
				// 	}
				// } catch (error) {
				// 	console.error("Error processing message:", error);
				// 	// In a real application, you might send an error response back to the client
				// 	if (ws.readyState === WebSocket.OPEN) {
				// 		ws.send(
				// 			JSON.stringify({
				// 				jsonrpc: "2.0",
				// 				error: {
				// 					code: -32700,
				// 					message: "Parse error or internal server error",
				// 				},
				// 				id: null, // Or the original request ID if it could be parsed
				// 			}),
				// 		);
				// 	}
				// }
			})().catch((e) => {
				throw e;
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
	}
});
