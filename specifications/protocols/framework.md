# Distributed Neighborhood and Messaging Framework

## Abstract

This specification defines a framework for client-server systems to manage neighborhood relationships and messaging. The framework is meant to specify the communication medium between client-to-server and server-to-client, for the [architecture]([../architecture.md]). It mandates specific functional capabilities but leaves protocol and method naming to implementers, who must define these in companion specifications.

## 1. Introduction

This RFC provides a blueprint for systems requiring neighborhood retrieval and message exchange. It does not mandate a specific protocol, allowing flexibility for JSON-RPC, gRPC, REST, or other protocols.

## 2. Terminology

- **Neighborhood**: The set of nodes directly connected (via directed edges) to a given node.
- **Message**: Data exchanged between client and server.

## 3. Requirements

### 3.1 Server Requirements

- **Get Neighbors**: A method to retrieve adjacent entities for a given entity.
  - Input: Entity identifier, optional scope.
  - Output: List of neighboring nodes or error.
- **Send Message**: A method to transmit a message to a specified entity.
  - Input: Recipient identifier, message payload. If not recipient identifier, then broadcast
  - Output: Confirmation or error.

### 3.2 Client Requirements

- **Receive Neighborhood Updates**: A method to receive updates about neighborhood changes.
  - Output: Updated neighborhood; list of neighboring nodes.
- **Receive Message**: A method to receive messages from the server.
  - Output: Message payload.

## 4. Implementation Guidance

Implementers MUST publish a companion specification defining:

- The protocol used (e.g., JSON-RPC, gRPC).
- Method names or endpoints mapping to the required functions.
- A discovery mechanism (e.g., a schema or endpoint) for clients to learn the implementation details.

## 5. Examples (Non-Normative)

### 5.1 JSON-RPC Implementation

```json
{
	"method": "getNeighborhood",
	"params": { "nodeId": "123", "scope": "local" },
	"id": 1
}
```
