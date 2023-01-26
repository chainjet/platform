import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

export class EditPromptAction extends OperationOffChain {
  key = 'editPrompt'
  name = 'Edit Prompt'
  description = 'Edits a prompt using an instruction'
  version = '1.0.0'
  inputs: JSONSchema7 = {
    required: ['prompt'],
    properties: {
      prompt: {
        title: 'Prompt',
        type: 'string',
        description: 'The input text to classify',
        'x-ui:widget': 'textarea',
        examples: ['What day of the wek is it?'],
      } as JSONSchema7,
      instruction: {
        title: 'Instruction',
        type: 'string',
        description: 'The instruction to edit the prompt.',
        examples: ['Fix the spelling mistakes'],
      },
      model: {
        title: 'Model',
        type: 'string',
        enum: ['text-davinci-edit-001', 'code-davinci-edit-001'],
        default: 'text-davinci-edit-001',
      },
      temperature: {
        title: 'Temperature',
        type: 'number',
        default: 0.6,
        maximum: 1,
        minimum: 0,
        description:
          'Higher values means the model will take more risks. Try 0.9 for more creative applications, and 0 for ones with a well-defined answer. [Learn More.](https://beta.openai.com/docs/quickstart/adjust-your-settings)',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      text: {
        title: 'Text',
        type: 'string',
      },
      prompt: {
        title: 'Prompt',
        type: 'string',
      },
      usage: {
        title: 'Usage',
        type: 'object',
        properties: {
          promptTokens: {
            title: 'Prompt Tokens',
            type: 'number',
          },
          completionTokens: {
            title: 'Completion Tokens',
            type: 'number',
          },
          totalTokens: {
            title: 'Total Tokens',
            type: 'number',
          },
        },
      },
    },
  }

  async run({ inputs, credentials }: OperationRunOptions): Promise<RunResponse> {
    const { prompt, model, instruction, temperature } = inputs
    const res = await fetch('https://api.openai.com/v1/edits', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credentials.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: prompt,
        model,
        instruction,
        temperature,
      }),
    })
    const json = await res.json()
    return {
      outputs: {
        text: json.choices[0].text,
        prompt,
        usage: {
          promptTokens: json.usage.prompt_tokens,
          completionTokens: json.usage.completion_tokens,
          totalTokens: json.usage.total_tokens,
        },
      },
    }
  }
}
