import { MethodAbi } from 'ethereum-types'
import { JSONSchema7 } from 'json-schema'

function mapSolidityTypeToJsonSchema(type: string) {
  if (type.endsWith('[]')) {
    return { type: 'array', items: mapSolidityTypeToJsonSchema(type.slice(0, -2)) }
  }
  switch (type) {
    case 'address':
    case 'bytes':
    case 'bytes32':
    case 'bytes64':
    case 'string':
      return {
        type: 'string',
      }
    case 'bool':
      return {
        type: 'boolean',
      }
    case 'int':
    case 'uint':
    case 'uint8':
    case 'uint16':
    case 'uint32':
    case 'uint64':
    case 'uint128':
    case 'uint256':
    case 'int8':
    case 'int16':
    case 'int32':
    case 'int64':
    case 'int128':
    case 'int256':
      return {
        type: 'integer',
      }
    default:
      return {
        type: 'string',
      }
  }
}

export function abiToInputJsonSchema(abiMethods: MethodAbi[]): JSONSchema7 {
  const schema: JSONSchema7 = {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: abiMethods.map((def) => def.name),
      },
    },
    allOf: abiMethods
      .filter((def) => def.inputs.length)
      .map((def: MethodAbi) => ({
        if: {
          required: ['operation'],
          properties: {
            operation: {
              const: def.name,
            },
          },
        },
        then: {
          properties: def.inputs.reduce((acc, input) => {
            acc[input.name] = mapSolidityTypeToJsonSchema(input.type)
            return acc
          }, {}),
        },
      })),
  }
  return schema
}

export function abiToOutputJsonSchema(abiMethod: MethodAbi): JSONSchema7 {
  const schema: JSONSchema7 = {
    type: 'object',
    properties: abiMethod.outputs.reduce((acc, output, index) => {
      let name = output.name
      if (!name) {
        name = abiMethod.outputs.length === 1 ? abiMethod.name : `output${index}`
      }
      acc[name] = mapSolidityTypeToJsonSchema(output.type)
      return acc
    }, {}),
  }
  return schema
}
