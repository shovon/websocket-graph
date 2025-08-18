import { JSONRPCRequest as _JSONRPCRequest, JSONRPCID } from "json-rpc-2.0";
import { z } from "zod";

/**
 * A unique identifier associated with a client.
 */
export type ClientId = string;

/**
 * The Zod schema that validates a clientId
 */
export const ClientId: z.ZodType<ClientId> = z.string();

const JSONRPCID: z.ZodType<JSONRPCID> = z.union([
	z.string(),
	z.number(),
	z.null(),
]);

export const JSONRPCRequest: z.ZodType<_JSONRPCRequest> = z.object({
	jsonrpc: z.enum(["2.0"]),
	method: z.string(),
	params: z.unknown().optional(),
	id: JSONRPCID.optional(),
});

type ClientToServerEnvelope = {
	target: ClientId[];
	message: unknown;
};

const ClientToServerEnvelope: z.ZodType<ClientToServerEnvelope> = z.object({
	target: z.array(ClientId),
	message: z.unknown(),
});

type ServerToClientEnvelope = {
	sender: ClientId;
	message: unknown;
};

const ServerToClientEnvelope: z.ZodType<ServerToClientEnvelope> = z.object({
	sender: ClientId,
	message: z.unknown(),
});

type DeliveryResult = { clientId: ClientId } & (
	| {
			status: "delivered";
	  }
	| {
			status: "failed";
			reason:
				| "not_found" // recipient unknown
				| "not_connected" // known but no WebSocket
				| "parse_error"
				| "timeout"
				| "internal_error";
	  }
);

export type DSN = {
	results: DeliveryResult[];
};
