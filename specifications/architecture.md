# Graph Relay Architecture

This document outlines an aspirational architecture for a graph relay system.

This document will not outline implementation details. This is left up to the implementers of this architecture design.

More specifically, the following is beyond the scope of this document:

- guarantees
- security
- performance
- topology
- protocols
- integrity

The purpose of this document was written with the assumptions that:

- network is unreliable.
- nodes in any network will not act in good faith, and that nodes must negotiate strategies of ensuring integrity.
- any assumption and assertions come with risk. Assertions are not discouraged, but the nature of this document makes no assertions. Assertions are left entirely up to implementors.

Any other details, such as protocols, shall be discussed in other documents.

Hence why the document uses more "SHOULD" and "MAY", as opposed to "MUST". "MUST" is reserved for reasonable assumptions required for this document to make any sense (for example, the requirement that implementors agree on a protocol format).

Potential derivatives of this document MAY introduce more liberal (stricter) assumptions, in spite of the precariousness of malicious nodes and an unreliable network.

## Terminology

- **Server**: The central system that maintains the graph topology and facilitates communication between clients. The server acts as both a connection manager and message router.

- **Client**: An application instance that connects to the server and participates in the graph relay network. Each client maintains a persistent connection to the server.

- **Client Node**: A logical representation of a client within the server's internal graph topology. A client node has a 1:1 relationship with a connected client and may have edges (connections) to other client nodes according to the graph structure.

- **Neighbor**: A client node that is directly connected to another client node via an edge in the graph topology. Neighbors represent the immediate connections available for direct communication between clients.

- **Neighborhood**: The set of all neighbor nodes directly connected to a given client node. A node's neighborhood defines its local communication scope - it can only directly interact with nodes in its neighborhood. The size and composition of a node's neighborhood may change over time as the graph topology evolves.

- **Adjacency**: The relationship between two client nodes that are directly connected in the graph topology. Adjacency is:
  - Bidirectional - if node A is adjacent to node B, then node B is adjacent to node A
  - Non-transitive - if node A is adjacent to node B, and node B is adjacent to node C, node A is not necessarily adjacent to node C
  - Dynamic - the server may add or remove adjacencies between nodes over time as the graph topology evolves
  - Local - nodes can only directly communicate with their adjacent neighbors, requiring multi-hop relay for non-adjacent communication

## Architecture

1. **Client-Server Topology**

   - The system MUST operate over a client-server architecture
   - The application MAY operate in environments that isn't traditionally considered "L4 environments" (such as TCP/IP); this document merely outlines some "client-server"-like architecture with little regard for which environment they run.

2. **Application Layer Topology and Implementation**

   - Implementations MUST define a communication medium (e.g. a medium enveloped by JSON-RPC 2.0) for clients and servers.
   - Despite the star topology in client-server environments, the server SHOULD maintain an internal representation of the clients as nodes in an alternative graph representation (such as a mesh network).
   - The internal graph SHOULD allow every node to be logically reachable from every other node.
     - An example valid topology of the graph can absolutely be a simple $n$-cycle directed ring (with $n$ being the total number of nodes in the graph); in such a topology, every client node is reachable from any other client node (albeit, this topology is arguably not very efficient).
   - The server SHOULD ensure that message routing reflects the graph connectivity, regardless of the underlying client–server constraints.
   - The server (through the agreed communication medium) SHOULD NOT allow client nodes to communicate with non-neighbor nodes.
   - Clients (through the agreed communication medium) SHOULD NOT accept messages from non-neighbor client nodes.
     - If a client receives a message from a non-neighbor client node, then it MAY request the server for an updated view of its adjacency.
       - Servers SHOULD implement an endpoint that respects request for receiving the latest state.
   - Clients SHOULD NOT assume that servers store a full historical log of the graph state.
   - Clients (within the client-server network) SHOULD only communicate with non-neighboring nodes through another protocol enveloped by the communication medium, but clients SHOULD NOT communicate directly; they MAY only communicate through a gossip protocol that relays messages from client node to client node.
     - To sketch out a proceedure that is compliant under the requirement of _only_ adjacent client node communication: clients send to server → server validates next hop adjacency → server delivers to the neighbor client, repeat.
   - Client nodes MUST have an identifier
     - Clients SHOULD NOT assume their identifier is unique in the entire graph.
       - Implementations of servers MAY ensure that identifiers are unique across the entire graph; how uniqueness is enforced, is beyond the scope of this document.
     - Clients SHOULD assume that their identifier is unique within its adjacency list.
       - Clients SHOULD reject any servers that they connect to that fails to ensure uniqueness within its local adjacency.
     - Servers SHOULD ensure identifiers are unique at least at the immediate adjacency level, but duplicates MAY exist in the entirety of the graph, as far as node identifier is concerned.
     - Implementations MAY have clients choose their identifier, or have the server choose the identifiers on the client's behalf
       - In the former case, the server SHOULD ensure that client IDs are unique within the client's adjacency list
   - Implementations SHOULD define some strategies to keep the server's view and each client node's view of each node's adjacency

3. **Performance Expectations**

   - The system MUST be real-time.
     - In other words, the system MUST be designed under the assumption that clients and servers react without unreasonable delay.
       - A strategy to be compliant is to simply use WebSocket, or communicating via UDP
         - If an implementation opts for requiring clients to poll, then there needs to exist some agreed-upon staleness heuristic, which is beyond the scope of this specification
     - Implementers MAY define their own acceptance criteria for what "real-time" and "unreasonable delay" are.
       - Implementers SHOULD define contingencies for delivery guarantees (e.g. sequence numbers for deduplications in environments that implement specifications that implement ARQ).
   - Servers SHOULD ensure that the adjacency list remain tractable.

4. **Persistent connections**

   - Session = connection. An application session SHOULD be strictly bound 1:1 to a single long-lived transport connection (e.g., WebSocket, HTTP/2 stream, gRPC). When that connection closes for any reason (idle timeout, heartbeat failure, FIN/RST, network error), the session SHOULD be torn down immediately.
   - Clients in this architecture are expected to maintain a persistent session with the server such that they can be reached with real-time guarantees.
