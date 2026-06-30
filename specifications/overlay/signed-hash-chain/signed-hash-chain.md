# A self-certifying ID chain for path provenance

This is a hash chain of public keys with signed links — a cryptographic provenance chain. As a message floods a graph, each node it traverses appends its own self-certifying identifier together with the out-edge it forwarded along. The result is a verifiable proof of the exact path taken, requiring no certificate authority.

## 1. Primitives

Each party $P_i$, holds a keypair $\big( s_i, p_i \big)$ for an asymmetric signature scheme (e.g. Ed25519). The _self-certifying ID_ is the public key itself, or some derivation thereof so that the ID _is_ the means of checking signatures from $P_i$.

The metadata $m_i$ is the _out-edge designator_ chosen by $P_i$ — the edge along which $P_i$ forwarded the message to $P_{i + 1}$.

**Encoding convention.** Throughout, $H$, $\text{Sign}$, and $\text{Vrfy}$ are _variadic over the individual components_, never over a single pre-concatenated string. The arguments are combined by an unambiguous, injective encoding — length-prefixed, or otherwise self-delimiting — so that distinct argument tuples never collide on the same input. [`length-prefixed-encoding.md`](./length-prefixed-encoding.md) fixes that encoding concretely. Concretely, $H(\text{"AB"}, \text{"C"}) \ne H(\text{"A"}, \text{"BC"})$. Plain concatenation ($a \mathbin\Vert b$) does **not** qualify and must not be used: it lets an adversary slide bytes across a field boundary, yielding a different logical tuple with an identical hashed-or-signed input — defeating exactly the splicing- and reordering-resistance the chain exists to provide. (In this construction $h_{i-1}$, $p_i$, and $\sigma_i$ are fixed-length and only the trailing $m_i$ varies, so naive concatenation happens to be unambiguous here — but $m_i$ is the one attacker-chosen field, so relying on that coincidence rather than stating the convention is a trap.)

## 2. The chain

Define the chain inductively. Let the genesis link be

$$
L_0 = \big( p_0, m_0, \sigma_0 \big),\qquad \sigma_0 = \text{Sign}_{s_0}(h_{-1}, p_0, m_0),
$$

Eacn subsequent party $P_i$ (for i \geq 1) receives the chain $C_{i - 1} = \big( L_0,L_1,\ldots,L_{i - 1} \big)$ and appends

$$
L_i = \big( p_i, m_i, \sigma_i \big)
$$

where the signature commits to its own contribution and binds it to everything before it:

$$
\sigma_i = \text{Sign}_{s_i}(h_{i-1}, p_i, m_i),\qquad h_i = H(h_{i-1}, p_i, m_i, \sigma_i)
$$

with $h_{-1} = \epsilon$ (the empty string, or a fixed domain-separation constant). The rrolling hash $h_{i-1}$ is the "existing link" each party appends to, so that reordering, splicing, or truncation breaks verification.

The full chain after $n$ hops is

$$
C_n = \big( L_0,L_1,\ldots,L_n \big)
$$

## 3. Verification

A verifier recomputes the rolling hash from scratch and checks every link:

$$
\forall i : \quad \text{Vrfy}_{p_i}((h_{i - 1}, p_i, m_i), \sigma_i) \overset{?}{=} 1
$$

If all checks pass, you have proof that ech $P_i$, in order, committed to forwarding along edge $m_i$, and that the path is exactly

$$
P_0 \overset{m_0}{\longrightarrow} P_1 \overset{m_1}{\longrightarrow}\cdots\overset{m_{n-1}}{\longrightarrow}P_n
$$

## 4. Notes on design

- **"Only the sending node cares about $m_i$."** Correct, and it falls out naturally: $m_i $ is signed by $P_i$ alone. $P_{i + 1}$ does not need to interpret it; it is an opaque commitment from $P_i$'s perspective, simply carried along.
- **Self-certifying.** Because ID is based on $p_i$, anyone can verify a link against its claimed ID without external trust. This is the Mazièrs/SFS sense of "self-certifying."
- **Append-only integrity.** Chaining via $h_{i-1}$ inside each signature is what stops a malicious intermediate node from rewriting history, or a relay from reordering links. Each signature is a commitment to the _entire prefix_.

## 5. Caveat

This proves _path provenance_, not freshness. Without a nonce or timestamp in $L_0$, a chain can be replayed. If replay matters in your flooding protocol, fold a session nonce into $h_{-1}$ — is, seed the chain with it instead of the empty string.
