import { createServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import {
  insertNode,
  type Degree3Graph,
  type Degree3Adjacencies,
  findCentroid,
  deleteNode,
} from "./adjacency-list.mts";

const server = createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("OK\n");
});

const wss = new WebSocketServer({ server });

class CentroidGraph<K> {
  root: [K] | null = null;
  graph: Degree3Graph<K> = new Map();

  insertValue(value: K) {
    insertNode(
      this.graph,
      {
        root: this.root,
        toInsert: value,
      },
      new Set(),
      { depthCache: new Map(), countCache: new Map() },
    );
    this.root = [findCentroid(this.graph, value)];
  }

  deleteValue(value: K) {
    deleteNode(this.graph, value);
    this.root = [findCentroid(this.graph, value)];
  }
}

interface GraphMeta {
  count: number;
  graph: CentroidGraph<WebSocket>;
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

  let graphMeta: GraphMeta | undefined = graphs.get(id);
  if (!graphMeta) {
    graphMeta = { count: 0, graph: new CentroidGraph<WebSocket>() };
  }
  const localNodeId = `${graphMeta.count}`;
  graphMeta.count++;

  const deleteNode = () => {
    graphMeta.graph.deleteValue(ws);
  };

  const addNode = () => {
    graphMeta.graph.insertValue(ws);
  };

  const onClose = deleteNode;

  wss.on("close", onClose);
});
