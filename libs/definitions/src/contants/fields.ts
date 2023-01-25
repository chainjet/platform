import { JSONSchema7 } from 'json-schema'

export const onChainNetworkField: JSONSchema7 = {
  title: 'Network',
  type: 'integer',
  oneOf: [{ title: 'Görli', const: 5 }],
}

export const APIREUM_NETWORK_FIELD: JSONSchema7 = {
  title: 'Network',
  type: 'integer',
  oneOf: [
    { title: 'Ethereum', const: 1 },
    { title: 'Arbitrum', const: 42161 },
    { title: 'Arbitrum Nova', const: 42170 },
    { title: 'Aurora', const: 1313161554 },
    { title: 'Avalanche', const: 43114 },
    { title: 'BNB Chain (BSC)', const: 56 },
    { title: 'Boba Network', const: 288 },
    { title: 'Canto', const: 7700 },
    { title: 'Celo', const: 42220 },
    { title: 'Cronos', const: 25 },
    { title: 'Dogechain', const: 2000 },
    { title: 'Evmos', const: 9001 },
    { title: 'Fantom', const: 250 },
    { title: 'Gnosis', const: 100 },
    { title: 'Görli (testnet)', const: 5 },
    { title: 'Harmony', const: 1666600000 },
    { title: 'Heco', const: 128 },
    { title: 'IoTeX', const: 4689 },
    { title: 'Kovan', const: 42 },
    { title: 'Metis', const: 1088 },
    { title: 'Moonbeam', const: 1284 },
    { title: 'Moonriver', const: 1285 },
    { title: 'Optimism', const: 10 },
    { title: 'Polygon', const: 137 },
    { title: 'Rinkeby (testnet)', const: 4 },
    { title: 'Ropsten (testnet)', const: 3 },
    { title: 'Sepolia (testnet)', const: 11155111 },
    { title: 'Tomb Chain', const: 6969 },
    { title: 'Velas', const: 106 },
  ],
}
