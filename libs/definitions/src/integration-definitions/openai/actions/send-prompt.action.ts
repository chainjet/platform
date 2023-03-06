import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

export class SendPromptAction extends OperationOffChain {
  key = 'sendPrompt'
  name = 'Send Prompt'
  description =
    'Generates a text completion from any prompt. Use it for text generation, summarization, question answering, and more.'
  version = '1.0.0'
  inputs: JSONSchema7 = {
    required: ['prompt', 'model', 'temperature', 'maxTokens', 'presencePenalty', 'frequencyPenalty'],
    properties: {
      prompt: {
        title: 'Prompt',
        type: 'string',
        description:
          'The text to generate a completion from. [Learn more](https://beta.openai.com/docs/guides/completion/introduction) or [try it out](https://beta.openai.com/playground).',
        'x-ui:widget': 'textarea',
      } as JSONSchema7,
      model: {
        title: 'Model',
        type: 'string',
        default: 'text-davinci-003',
        enum: [
          'text-davinci-003',
          'text-curie-001',
          'text-babbage-001',
          'text-ada-001',
          'text-davinci-002',
          'text-davinci-001',
          'davinci-instruct-beta',
          'davinci',
          'curie-instruct-beta',
          'curie',
          'babbage',
          'ada',
        ],
        description:
          '**text-davinci-003** is the most capable model. **text-curie-001** is a faster and cheaper option. [Learn more.](https://beta.openai.com/docs/models/gpt-3)',
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
      maxTokens: {
        title: 'Max Tokens',
        type: 'number',
        default: 256,
        description:
          'The maximum number of tokens to generate. 100 tokens are approximately 75 words. [Learn more.](https://beta.openai.com/tokenizer)',
      },
      stop: {
        title: 'Stop Sequences',
        type: 'string',
        description:
          'Up to 4 sequences where it will stop generating further tokens. The returned text will not contain the stop sequence.',
      },
      presencePenalty: {
        title: 'Presence Penalty',
        type: 'number',
        default: 0,
        maximum: 2,
        minimum: -2,
        description:
          "Number between -2 and 2. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.",
      },
      frequencyPenalty: {
        title: 'Frequency Penalty',
        type: 'number',
        default: 0,
        maximum: 2,
        minimum: -2,
        description:
          "Number between -2 and 2. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.",
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      id: {
        title: 'ID',
        type: 'string',
      },
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
    const { model, prompt, temperature, maxTokens, stop, presencePenalty, frequencyPenalty } = inputs
    const res = await fetch('https://api.openai.com/v1/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credentials.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        max_tokens: maxTokens,
        temperature,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
        stop,
      }),
    })
    const json = await res.json()
    if (json.error) {
      throw new Error(json.error?.message ?? `Bad request sent to OpenAI: ${JSON.stringify(json.error)}`)
    }
    return {
      outputs: {
        id: json.id,
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
