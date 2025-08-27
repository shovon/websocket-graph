# Graph Relay Architecture

1. **Transport Layer Topology**

   - The network SHALL conform to a [star topology](https://en.wikipedia.org/wiki/Star_network), where the central hub is the server and each spoke is a client node.
   - All client communication MUST traverse the server. Direct client-to-client network links are not permitted.

2. **Application Layer Topology**

   - Despite the network-layer star topology, the server SHALL maintain an internal representation of the clients as nodes in a graph.
   - The internal graph MUST allow every node to be logically reachable from every other node.
   - The server SHALL ensure that message routing reflects the graph connectivity, regardless of the underlying client–server constraints.

3. **Reachability Guarantees**

   - At the application layer, the server MUST enforce connectivity across all nodes such that, from the perspective of the application, no node is isolated.
   - Clients in this architecture are expected to maintain a persistent session with the server such that they can be reached with real-time guarantees.

4. **Performance Expectations**

   - The system SHALL be designed under the assumption that clients and servers react without undue delay.
   - Message delivery is expected to be perceived as instantaneous at the application layer, even though the underlying network MAY exhibit latency, jitter, or packet loss.

5. **Persistent connections**

   - Session = connection. An application session MUST be strictly bound 1:1 to a single long-lived transport connection (e.g., WebSocket, HTTP/2 stream, gRPC). When that connection closes for any reason (idle timeout, heartbeat failure, FIN/RST, network error), the session MUST be torn down immediately.
