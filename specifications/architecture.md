# Graph Relay Architecture

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

   - The server MUST be the medium to allow "client node"-to-"client node" communication.
   - The application MAY operate in environments that isn't traditionally considered "L4 environments" (such as TCP/IP); this document merely outlines some "client-server"-like architecture with little regard for which environment they run.

2. **Application Layer Topology and Implementation**

   - Implementations MUST define a communication medium (e.g. a medium enveloped by JSON-RPC 2.0) for clients and servers.
   - Despite the star topology in client-server environments, the server SHOULD maintain an internal representation of the clients as nodes in an alternative graph representation (such as a mesh network).
   - The internal graph SHOULD allow every node to be logically reachable from every other node.
   - The server SHOULD ensure that message routing reflects the graph connectivity, regardless of the underlying client–server constraints.
   - The server SHOULD NOT allow client nodes to communicate with non-neighbor nodes.
   - Clients SHOULD NOT accept messages from non-neighbor client nodes
     - If a client receives a message from a non-neighbor client node, then it MAY request the server for an updated view of its adjacency.
       - Servers SHOULD implement
   - Clients SHOULD NOT assume that servers store a full historical log of the graph state.
   - Clients MAY communicate with non-neighbouring nodes through another protocol enveloped by the communication medium, but clients SHOULD NOT communicate directly; they MAY only communicate through a gossip protocol that relays messages from client node to client node.
     - To sketch out a compliant under the requirement of _only_ adjacent client node communication: clients send to server → server validates next hop adjacency → server delivers to the neighbor client, repeat.
   - Client nodes MUST have an identifier
     - Clients MUST NOT assume their identifier is unique
       - Client nodes
     - Servers MUST

3. **Reachability Guarantees**

   - The server SHOULD guarantee reachability across all client nodes
     - An example valid topology of the graph can absolutely be a simple $n$-cycle directed ring (with $n$ being the total number of nodes in the graph); in such a topology, every client node is reachable from any other client node (albeit, this topology is arguably not very efficient).

4. **Performance Expectations**

   - The system MUST be real-time.
     - In other words, the system MUST be designed under the assumption that clients and servers react without unreasonable delay.
     - Implementers MAY define their own acceptance criteria for what "real-time" and "unreasonable delay" are.
   - Servers SHOULD ensure that the adjacency list remain tractable.

5. **Persistent connections**

   - Session = connection. An application session SHOULD be strictly bound 1:1 to a single long-lived transport connection (e.g., WebSocket, HTTP/2 stream, gRPC). When that connection closes for any reason (idle timeout, heartbeat failure, FIN/RST, network error), the session SHOULD be torn down immediately.
   - Clients in this architecture are expected to maintain a persistent session with the server such that they can be reached with real-time guarantees.
