import { JSONSchema7 } from 'json-schema'

export const BLOCKCHAIN_INPUTS: Record<string, JSONSchema7> = {
  network: {
    title: 'Network',
    type: 'integer',
    oneOf: [
      { title: 'Ethereum', const: 1 },
      { title: 'Arbitrum', const: 42161 },
      { title: 'Avalanche', const: 43114 },
      { title: 'BNB Chain (BSC)', const: 56 },
      { title: 'Celo', const: 42220 },
      { title: 'Cronos', const: 25 },
      { title: 'Fantom', const: 250 },
      { title: 'Gnosis', const: 100 },
      { title: 'Görli', const: 5 },
      { title: 'Harmony', const: 1666600000 },
      { title: 'Kovan', const: 42 },
      { title: 'Metis', const: 1088 },
      { title: 'Optimism', const: 10 },
      { title: 'Polygon', const: 137 },
      { title: 'Rinkeby', const: 4 },
      { title: 'Ropsten', const: 3 },
      { title: 'Sepolia', const: 11155111 },
      { title: 'Tomb Chain', const: 6969 },
    ],
  },
  address: {
    title: 'Contract Address',
    type: 'string',
  },
}
