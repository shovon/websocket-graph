# Distributed Adjacency and Messaging Framework

## Abstract

This specification defines a framework for client-server systems to manage adjacency relationships and messaging. It mandates specific functional capabilities but leaves protocol and method naming to implementers, who must define these in companion specifications.

## 1. Introduction

This RFC provides a blueprint for systems requiring adjacency retrieval and message exchange. It does not mandate a specific protocol, allowing flexibility for JSON-RPC, gRPC, REST, or other protocols.

## 2. Terminology

- **Neighborhood**: A relationship between entities (e.g., nodes in a graph).
- **Message**: Data exchanged between client and server.

## 3. Requirements

### 3.1 Server Requirements

- **Get Neighbors**: A method to retrieve adjacent entities for a given entity.
  - Input: Entity identifier, optional scope.
  - Output: List of adjacent entities or error.
- **Send Message**: A method to transmit a message to a specified entity.
  - Input: Recipient identifier, message payload.
  - Output: Confirmation or error.

### 3.2 Client Requirements

- **Notify Neighborhood Updates**: A method to receive updates about adjacency changes.
  - Output: Updated adjacency data.
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
	"method": "getAdjacency",
	"params": { "nodeId": "123", "scope": "local" },
	"id": 1
}
```
