import { createServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import {
  insertNode,
  type Degree3Graph,
  type Degree3Adjacencies,
  findCentroid,
  deleteNode,
} from "./src/adjacency-list.mts";
import * as h from "./hyperguard.mts";

const server = createServer((_, res) => {
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

  get isEmpty(): boolean {
    return this.graph.size <= 0;
  }
}

interface GraphMeta {
  graph: CentroidGraph<WebSocket>;
}

// Graphs.
const graphs = new Map<string, GraphMeta>();

let count = 0;
let ids = new WeakMap<WebSocket, string>();

// A JSON string is just another value to validate: parse it (transform catches
// the throw), then hand the parsed value to the inner validator (chain). No
// bespoke try/catch — the primitives already compose into exactly this.
const json = <T,>(validator: h.Validator<T>): h.Validator<T> =>
  h.chain(
    h.transform(h.string(), (text) => JSON.parse(text)),
    validator,
  );

// §6: a receiver SHOULD tolerate trailing arguments and ignore them, so a
// `Send` is a *prefix* match, not a fixed-arity one. `tuple` alone is too
// strict — it rejects on length mismatch (hyperguard §tuple), which would also
// reject a future append-only extension (Shape §6). So we don't write
// `if (len > n)`; we compose the meaning we want: assert it's an array
// (arrayOf + unknown), slice it to the prefix we care about (transform, a pure
// total function), then validate that prefix (tuple). The arity floor falls
// out for free — a too-short array slices to itself and fails tuple's own
// length check, which is exactly "missing required argument". Trailing
// elements are sliced off and ignored, precisely as §6 asks.
const prefix = <T extends h.Validator<unknown>[]>(...validators: [...T]) =>
  h.chain(
    h.transform(h.arrayOf(h.unknown()), (arr) =>
      arr.slice(0, validators.length),
    ),
    h.tuple(validators),
  );

const sendSchema = prefix(h.exact("Send"), h.string(), h.string());

const sendMessage = json(sendSchema);

// const isSendMessage = (value: unknown): value is ["Send", string, string] => {
//   return (
//     Array.isArray(value) &&
//     value.length >= 3 &&
//     value[0] === "Send" &&
//     typeof value[1] === "string" &&
//     typeof value[2] === "string"
//   );
// };

// const validateSendMessage = (value: unknown) => {
//   if (!isSendMessage(value)) return null;
//   return [value] satisfies [typeof value];
// };

// const parseSendMessage = (value: string) => {
//   try {
//     const parsed = JSON.parse(value);
//     return validateSendMessage(parsed);
//   } catch {
//     return null;
//   }
// };

wss.on("connection", (ws, req) => {
  // req.url is path + query only (e.g. "/graph/abc123"), so use a dummy base.
  const { pathname } = new URL(req.url ?? "", "http://localhost");

  // Expect /graph/:id
  const match = pathname.match(/^\/graph\/([^/]+)$/);
  if (!match?.[1]) {
    ws.close(1008, "Invalid path");
    return;
  }

  // /graph/:id

  const graphId = decodeURIComponent(match[1]);

  let graphMeta: GraphMeta | undefined = graphs.get(graphId);
  if (!graphMeta) {
    graphMeta = { graph: new CentroidGraph<WebSocket>() };
  }
  const localNodeId = `${count++}`;

  const deleteNode = () => {
    graphMeta.graph.deleteValue(ws);
    if (graphMeta.graph.isEmpty) {
      graphs.delete(graphId);
    }
  };

  const addNode = () => {
    graphMeta.graph.insertValue(ws);
    ids.set(ws, localNodeId);
  };

  addNode();

  const onClose = deleteNode;

  ws.on("message", (data) => {
    const result = sendMessage.validate(data.toString());
    // §6/§7: anything not acceptable is discarded silently — no response,
    // no log, no throw. A failed validation is a non-event.
    if (!result.isValid) return;

    const [, designator, payload] = result.value;
    // designator: §3.1 Designator, payload: §3.2 opaque Payload — relay below.
    void designator;
    void payload;
  });

  ws.on("close", onClose);
});
