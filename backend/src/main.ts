import { ClientMapping, JSONRPCRequest } from "./types";
import { createJsonRpcServer } from "./rpc-server";
import { graph } from "./graph-instance";
import { createServer } from "./server";

const clientMapping: ClientMapping = new Map();

createServer({
	graph,
	clientMapping,
	jsonRpcServer: createJsonRpcServer({
		clientMapping,
	}),
});
