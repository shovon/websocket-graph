import WebSocket, { WebSocketServer } from "ws";
import { Degree3Graph } from "../adjacency-list";
import { JSONRPCClient, JSONRPCErrorCode, JSONRPCServer } from "json-rpc-2.0";
import { ClientId, ClientMapping, JSONRPCRequest } from "./types";

export function createServer({
	graph,
	jsonRpcServer,
	clientMapping,
}: {
	graph: Degree3Graph<string>;
	jsonRpcServer: JSONRPCServer<ClientId>;
	clientMapping: ClientMapping;
}): WebSocketServer {
	const wss = new WebSocketServer({ port: 8080 });

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
			//
			//

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
							console.log(
								`Sent response to client: ${JSON.stringify(response)}`,
							);
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

	return wss;
}
