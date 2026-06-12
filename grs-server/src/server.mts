import { createServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { type Degree3Graph } from "./adjacency-list.mts";

const server = createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("OK\n");
});

const wss = new WebSocketServer({ server });

interface GraphMeta {
  count: number;
  graph: Degree3Graph<string>;
}

// Graphs.
const graphs = new Map<string, GraphMeta>();

// /graph/:id

wss.on("connection", (ws, req) => {
  // req.url is path + query only (e.g. "/graph/abc123"), so use a dummy base.
  const { pathname } = new URL(req.url ?? "", "http://localhost");

  // Expect /graph/:id
  const match = pathname.match(/^\/graph\/([^/]+)$/);
  if (!match?.[1]) {
    ws.close(1008, "Invalid path");
    return;
  }

  const id = decodeURIComponent(match[1]);
});
