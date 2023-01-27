import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

export class GenerateImageAction extends OperationOffChain {
  key = 'generateImage'
  name = 'Generate Image From Text'
  description = 'Generates an image from any prompt (using DALL-E model).'
  version = '1.0.0'
  inputs: JSONSchema7 = {
    required: ['prompt', 'size', 'n'],
    properties: {
      prompt: {
        title: 'Prompt',
        type: 'string',
        description: 'The prompt to generate a completion from.',
        'x-ui:widget': 'textarea',
      } as JSONSchema7,
      size: {
        title: 'size',
        type: 'string',
        enum: ['256x256', '512x512', '1024x1024'],
        default: '256x256',
      },
      n: {
        title: 'Number of Images',
        type: 'number',
        default: 1,
        minimum: 1,
        maximum: 10,
        description: 'The number of images to generate. Must be between 1 and 10.',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      results: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
            },
          },
        },
      },
    },
  }

  async run({ inputs, credentials }: OperationRunOptions): Promise<RunResponse> {
    const { prompt, size, n } = inputs
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credentials.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        size,
        response_format: 'url',
        n,
      }),
    })
    const json = await res.json()
    return {
      outputs: {
        results: json.data,
      },
    }
  }
}
