import {
	JSONRPCClient,
	JSONRPCErrorCode,
	JSONRPCErrorException,
	JSONRPCServer,
} from "json-rpc-2.0";
import { ClientId, ClientMapping, JSONRPCRequest } from "./types";
import { graph } from "./graph-instance";
import WebSocket from "ws";

export function createJsonRpcServer({
	clientMapping,
}: {
	clientMapping: ClientMapping;
}): JSONRPCServer<ClientId> {
	const jsonRpcServer = new JSONRPCServer<ClientId>();

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

	return jsonRpcServer;
}
