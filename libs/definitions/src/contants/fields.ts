import { JSONSchema7 } from 'json-schema'

export const onChainNetworkField: JSONSchema7 = {
  title: 'Network',
  type: 'integer',
  oneOf: [{ title: 'Görli', const: 5 }],
}
