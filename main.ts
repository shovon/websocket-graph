import { WebSocket, WebSocketServer } from "ws";
import { JSONRPCServer, JSONRPCClient } from "json-rpc-2.0";

const jsonRpcServer = new JSONRPCServer();

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
  console.log("Client connected.");

  const jsonRpcClient = new JSONRPCClient((request) => {
    ws.send(JSON.stringify(request));
  });

  ws.on("message", (message) =>
    (async () => {
      try {
        // Process the incoming JSON-RPC request
        // The jsonRpcServer handles parsing the request and calling the appropriate method
        const response = await jsonRpcServer.receive(
          JSON.parse(message.toString())
        );

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
                code: -32700,
                message: "Parse error or internal server error",
              },
              id: null, // Or the original request ID if it could be parsed
            })
          );
        }
      }
    })().catch((e) => {
      throw e;
    })
  );

  ws.on("close", () => {
    console.log("Client disconnected.");
  });

  // Event listener for errors
  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});
