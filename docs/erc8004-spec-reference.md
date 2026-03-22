# ERC-8004 Specification Reference

Cached from https://eips.ethereum.org/EIPS/eip-8004 on 2026-03-21.

## Overview

Three registries deployed as per-chain singletons:

1. **Identity Registry** — ERC-721 based agent registration
2. **Reputation Registry** — Feedback signals from clients to agents
3. **Validation Registry** — Independent verification of agent work

## Deployed Addresses (Celo)

- Identity Registry: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- Reputation Registry: `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`
- Validation Registry: **unknown — needs discovery**

## Identity Registry

ERC-721 with URIStorage. Agent globally identified by:
- `agentRegistry`: `{namespace}:{chainId}:{identityRegistry}` (e.g., `eip155:42220:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`)
- `agentId`: ERC-721 tokenId (incremental)

### Registration

```solidity
struct MetadataEntry {
    string metadataKey;
    bytes metadataValue;
}

function register(string agentURI, MetadataEntry[] calldata metadata) external returns (uint256 agentId)
function register(string agentURI) external returns (uint256 agentId)
function register() external returns (uint256 agentId)
```

Events: `Registered(uint256 indexed agentId, string agentURI, address indexed owner)`

### Agent URI / Registration File

```json
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "myAgentName",
  "description": "...",
  "image": "https://example.com/agentimage.png",
  "services": [
    { "name": "web", "endpoint": "https://..." },
    { "name": "A2A", "endpoint": "https://.../.well-known/agent-card.json", "version": "0.3.0" },
    { "name": "MCP", "endpoint": "https://...", "version": "2025-06-18" },
    { "name": "ENS", "endpoint": "vitalik.eth", "version": "v1" },
    { "name": "DID", "endpoint": "did:method:foobar", "version": "v1" },
    { "name": "email", "endpoint": "mail@myagent.com" }
  ],
  "x402Support": false,
  "active": true,
  "registrations": [
    { "agentId": 22, "agentRegistry": "eip155:1:0x742..." }
  ],
  "supportedTrust": ["reputation", "crypto-economic", "tee-attestation"]
}
```

### Metadata

```solidity
function getMetadata(uint256 agentId, string memory metadataKey) external view returns (bytes memory)
function setMetadata(uint256 agentId, string memory metadataKey, bytes memory metadataValue) external
```

Event: `MetadataSet(uint256 indexed agentId, string indexed indexedMetadataKey, string metadataKey, bytes metadataValue)`

### Agent Wallet

Reserved metadata key `agentWallet` — requires EIP-712/ERC-1271 signature to change.

```solidity
function setAgentWallet(uint256 agentId, address newWallet, uint256 deadline, bytes calldata signature) external
function getAgentWallet(uint256 agentId) external view returns (address)
function unsetAgentWallet(uint256 agentId) external
```

### Update URI

```solidity
function setAgentURI(uint256 agentId, string calldata newURI) external
```

Event: `URIUpdated(uint256 indexed agentId, string newURI, address indexed updatedBy)`

## Reputation Registry

### Initialization

```solidity
function initialize(address identityRegistry_) external
function getIdentityRegistry() external view returns (address identityRegistry)
```

### Giving Feedback

```solidity
function giveFeedback(
    uint256 agentId,
    int128 value,
    uint8 valueDecimals,
    string calldata tag1,
    string calldata tag2,
    string calldata endpoint,
    string calldata feedbackURI,
    bytes32 feedbackHash
) external
```

Requirements:
- `agentId` must be a validly registered agent
- `valueDecimals` MUST be 0-18
- Submitter MUST NOT be agent owner or approved operator
- `tag1`, `tag2`, `endpoint`, `feedbackURI`, `feedbackHash` are OPTIONAL

Event: `NewFeedback(uint256 indexed agentId, address indexed clientAddress, uint64 feedbackIndex, int128 value, uint8 valueDecimals, string indexed indexedTag1, string tag1, string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash)`

Note: `endpoint`, `feedbackURI`, `feedbackHash` are emitted but NOT stored on-chain.

### Value Examples

| tag1 | What it measures | Example | value | valueDecimals |
|------|-----------------|---------|-------|---------------|
| starred | Quality rating (0-100) | 87/100 | 87 | 0 |
| reachable | Endpoint reachable (binary) | true | 1 | 0 |
| uptime | Endpoint uptime (%) | 99.77% | 9977 | 2 |
| successRate | Success rate (%) | 89% | 89 | 0 |
| responseTime | Response time (ms) | 560ms | 560 | 0 |

### Revoking Feedback

```solidity
function revokeFeedback(uint256 agentId, uint64 feedbackIndex) external
```

### Appending Responses

Anyone can respond to feedback:

```solidity
function appendResponse(
    uint256 agentId,
    address clientAddress,
    uint64 feedbackIndex,
    string calldata responseURI,
    bytes32 responseHash
) external
```

Event: `ResponseAppended(uint256 indexed agentId, address indexed clientAddress, uint64 feedbackIndex, address indexed responder, string responseURI, bytes32 responseHash)`

### Read Functions

```solidity
function getSummary(uint256 agentId, address[] calldata clientAddresses, string tag1, string tag2)
    external view returns (uint64 count, int128 summaryValue, uint8 summaryValueDecimals)

function readFeedback(uint256 agentId, address clientAddress, uint64 feedbackIndex)
    external view returns (int128 value, uint8 valueDecimals, string tag1, string tag2, bool isRevoked)

function readAllFeedback(uint256 agentId, address[] calldata clientAddresses, string tag1, string tag2, bool includeRevoked)
    external view returns (address[] memory clients, uint64[] memory feedbackIndexes, int128[] memory values, uint8[] memory valueDecimals, string[] memory tag1s, string[] memory tag2s, bool[] memory revokedStatuses)

function getResponseCount(uint256 agentId, address clientAddress, uint64 feedbackIndex, address[] responders)
    external view returns (uint64 count)

function getClients(uint256 agentId) external view returns (address[] memory)

function getLastIndex(uint256 agentId, address clientAddress) external view returns (uint64)
```

## Validation Registry

### Initialization

```solidity
function initialize(address identityRegistry_) external
function getIdentityRegistry() external view returns (address identityRegistry)
```

### Validation Request

Called by agent owner or operator:

```solidity
function validationRequest(
    address validatorAddress,
    uint256 agentId,
    string requestURI,
    bytes32 requestHash
) external
```

All fields mandatory. `requestHash` is keccak256 of the request payload and identifies the request.

Event: `ValidationRequest(address indexed validatorAddress, uint256 indexed agentId, string requestURI, bytes32 indexed requestHash)`

### Validation Response

Called by the `validatorAddress` specified in the original request:

```solidity
function validationResponse(
    bytes32 requestHash,
    uint8 response,
    string responseURI,
    bytes32 responseHash,
    string tag
) external
```

- Only `requestHash` and `response` are mandatory
- `response` is 0-100 (binary: 0=failed, 100=passed, or intermediate)
- Can be called multiple times for same `requestHash` (progressive validation)
- `responseURI` points to off-chain evidence
- `tag` allows categorization (e.g., "soft-finality", "hard-finality")

Event: `ValidationResponse(address indexed validatorAddress, uint256 indexed agentId, bytes32 indexed requestHash, uint8 response, string responseURI, bytes32 responseHash, string tag)`

Stored on-chain: `requestHash`, `validatorAddress`, `agentId`, `response`, `responseHash`, `lastUpdate`, `tag`

### Read Functions

```solidity
function getValidationStatus(bytes32 requestHash)
    external view returns (address validatorAddress, uint256 agentId, uint8 response, bytes32 responseHash, string tag, uint256 lastUpdate)

function getSummary(uint256 agentId, address[] calldata validatorAddresses, string tag)
    external view returns (uint64 count, uint8 averageResponse)

function getAgentValidations(uint256 agentId) external view returns (bytes32[] memory requestHashes)

function getValidatorRequests(address validatorAddress) external view returns (bytes32[] memory requestHashes)
```

## Security Notes

- Sybil attacks possible — protocol makes signals public, expects reputation systems to emerge
- On-chain pointers/hashes cannot be deleted (audit trail integrity)
- Validator incentives/slashing managed by specific validation protocols (out of scope)
- Protocol cannot guarantee advertised capabilities are functional/non-malicious
- Clients don't need to be registered (gas sponsorship via EIP-7702 possible)
