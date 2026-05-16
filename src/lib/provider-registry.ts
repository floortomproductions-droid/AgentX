/**
 * AgentX Provider Registry - Maps provider IDs to actual wallet addresses per chain
 * This allows x402 payments to resolve to real blockchain addresses
 */

export interface WalletAddress {
  address: string;
  destinationTag?: string; // For chains like XRP that need tags
}

export interface ProviderRecord {
  provider_id: string;
  name: string;
  wallets: Record<string, WalletAddress>; // chain -> wallet mapping
}

// AgentX Provider Registry - Maps provider IDs to their actual wallet addresses
const PROVIDER_REGISTRY: Record<string, ProviderRecord> = {
  "agentx:agentx": {
    provider_id: "agentx:agentx",
    name: "AgentX Marketplace",
    wallets: {
      "solana": { address: "CL4gJQMCuBNLoRPdbEgwdRkyH6RLC2Eak6yombja4vD9" },
      "eip155:501": { address: "CL4gJQMCuBNLoRPdbEgwdRkyH6RLC2Eak6yombja4vD9" },
      "base": { address: "0xAaA8ABD423254AeBFb51014F863E9da9F123aEbC" },
      "eip155:8453": { address: "0xAaA8ABD423254AeBFb51014F863E9da9F123aEbC" },
      "ethereum": { address: "0xAaA8ABD423254AeBFb51014F863E9da9F123aEbC" },
      "eip155:1": { address: "0xAaA8ABD423254AeBFb51014F863E9da9F123aEbC" },
      "bitcoin": { address: "bc1qxtav4h7cl7p6uk4l0j3cfhugd730pktl4e6v7w" },
      "bnb": { address: "0x7129ad7e761967b64a7e54c486a22884a774bfe8" },
      "xrp": { address: "rpvijHi2nVY9WWAJhojsAX5tJmHdmLtFhq", destinationTag: "436803643" },
      "ton": { address: "UQCiwOHpM_-Ws2fE1APCngj0DDo7pzI9eDApjDGYQQdJEYB_" },
      "doge": { address: "D8dP9zeEit2P9jZ9ZPoqjncdU4PmBHaGix" },
    }
  },
  "agentx:floortom": {
    provider_id: "agentx:floortom",
    name: "Floortom Studio",
    wallets: {
      "solana": { address: "CL4gJQMCuBNLoRPdbEgwdRkyH6RLC2Eak6yombja4vD9" },
      "eip155:501": { address: "CL4gJQMCuBNLoRPdbEgwdRkyH6RLC2Eak6yombja4vD9" }, // CAIP-2 for Solana
      "base": { address: "0xAaA8ABD423254AeBFb51014F863E9da9F123aEbC" },
      "eip155:8453": { address: "0xAaA8ABD423254AeBFb51014F863E9da9F123aEbC" }, // CAIP-2 for Base
      "ethereum": { address: "0xAaA8ABD423254AeBFb51014F863E9da9F123aEbC" },
      "eip155:1": { address: "0xAaA8ABD423254AeBFb51014F863E9da9F123aEbC" }, // CAIP-2 for Ethereum
      "bitcoin": { address: "bc1qxtav4h7cl7p6uk4l0j3cfhugd730pktl4e6v7w" },
      "bnb": { address: "0x7129ad7e761967b64a7e54c486a22884a774bfe8" },
      "xrp": { address: "rpvijHi2nVY9WWAJhojsAX5tJmHdmLtFhq", destinationTag: "436803643" },
      "ton": { address: "UQCiwOHpM_-Ws2fE1APCngj0DDo7pzI9eDApjDGYQQdJEYB_" },
      "doge": { address: "D8dP9zeEit2P9jZ9ZPoqjncdU4PmBHaGix" },
    }
  },
  "agentx:openai": {
    provider_id: "agentx:openai",
    name: "OpenAI",
    wallets: {
      // Example - would need real addresses from OpenAI
      "solana": { address: "placeholder-openai-solana" },
      "base": { address: "0x0000000000000000000000000000000000000000" },
    }
  },
  "agentx:anthropic": {
    provider_id: "agentx:anthropic",
    name: "Anthropic",
    wallets: {
      // Example - would need real addresses
      "solana": { address: "placeholder-anthropic-solana" },
    }
  }
};

/**
 * Resolve a provider ID to a wallet address for a specific chain
 */
export function resolveProviderWallet(providerId: string, chainId: string): WalletAddress | null {
  const record = PROVIDER_REGISTRY[providerId];
  if (!record) return null;
  
  // Try exact chain match first
  if (record.wallets[chainId]) {
    return record.wallets[chainId];
  }
  
  // Try normalized chain name
  const normalizedChain = chainId.toLowerCase().replace("eip155:", "");
  if (record.wallets[normalizedChain]) {
    return record.wallets[normalizedChain];
  }
  
  return null;
}

/**
 * Check if a provider ID exists in the registry
 */
export function isProviderRegistered(providerId: string): boolean {
  return providerId in PROVIDER_REGISTRY;
}

/**
 * Get all supported chains for a provider ID
 */
export function getProviderChains(providerId: string): string[] {
  const record = PROVIDER_REGISTRY[providerId];
  return record ? Object.keys(record.wallets) : [];
}
