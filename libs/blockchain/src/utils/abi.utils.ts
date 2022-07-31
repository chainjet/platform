import { EventAbi, MethodAbi } from 'ethereum-types'
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

/**
 * Converts an array of abi methods to a JSONSchema7 for inputs
 */
export function methodsAbiToInputJsonSchema(methodsAbi: MethodAbi[]): JSONSchema7 {
  const schema: JSONSchema7 = {
    type: 'object',
    required: ['operation'],
    properties: {
      operation: {
        type: 'string',
        enum: methodsAbi.map((def) => def.name),
      },
    },
    allOf: methodsAbi
      .filter((def) => def.inputs.length)
      .map((def) => ({
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

/**
 * Converts an array of abi methods to a JSONSchema7 for outputs
 */
export function methodsAbiToOutputJsonSchema(methodsAbi: MethodAbi): JSONSchema7 {
  const schema: JSONSchema7 = {
    type: 'object',
    properties: methodsAbi.outputs.reduce((acc, output, index) => {
      let name = output.name
      if (!name) {
        name = methodsAbi.outputs.length === 1 ? methodsAbi.name : `output${index}`
      }
      acc[name] = mapSolidityTypeToJsonSchema(output.type)
      return acc
    }, {}),
  }
  return schema
}

/**
 * Converts an array of abi events to a JSONSchema7 for inputs
 */
export function eventsAbiToInputJsonSchema(eventsAbi: EventAbi[]): JSONSchema7 {
  const schema: JSONSchema7 = {
    type: 'object',
    required: ['event'],
    properties: {
      event: {
        type: 'string',
        enum: eventsAbi.map((def) => def.name),
      },
    },
    allOf: eventsAbi
      .filter((def) => def.inputs.length)
      .map((def) => ({
        if: {
          required: ['event'],
          properties: {
            event: {
              const: def.name,
            },
          },
        },
        then: {
          properties: def.inputs.reduce((acc, input, index) => {
            if (input.indexed) {
              acc[input.name] = {
                ...mapSolidityTypeToJsonSchema(input.type),
                title: `Filter by ${input.name ?? `topic ${index}`}`,
              }
            }
            return acc
          }, {}),
        },
      })),
  }
  return schema
}

/**
 * Converts an array of abi events to a JSONSchema7 for outputs
 */
export function eventsAbiToOutputJsonSchema(eventsAbi: EventAbi): JSONSchema7 {
  const schema: JSONSchema7 = {
    type: 'object',
    properties: eventsAbi.inputs.reduce((acc, inputs, index) => {
      let name = inputs.name
      if (!name) {
        name = eventsAbi.inputs.length === 1 ? eventsAbi.name : `topic${index}`
      }
      acc[name] = mapSolidityTypeToJsonSchema(inputs.type)
      return acc
    }, {}),
  }
  return schema
}
