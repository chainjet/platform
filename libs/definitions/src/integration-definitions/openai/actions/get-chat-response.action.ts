import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

export class GetChatResponseAction extends OperationOffChain {
  key = 'getChatResponse'
  name = 'Get ChatGPT Response'
  description = 'Uses ChatGPT assistant to generate a response to a message.'
  version = '1.0.0'
  inputs: JSONSchema7 = {
    required: ['system', 'message', 'temperature'],
    properties: {
      system: {
        title: 'Assistant Behavior',
        type: 'string',
        description: 'This message helps set the behavior of the assistant.',
        default: 'You are a helpful assistant.',
      },
      previous: {
        title: 'Previous Conversation',
        type: 'string',
        description:
          'Set any previous conversation between the user and the assistant. Each message should start with either `assistant:` or `user:`.',
        examples: [
          '\nuser: Who won the world series in 2020?\nassistant: The Los Angeles Dodgers won the World Series in 2020.',
        ],
        'x-ui:widget': 'textarea',
      } as JSONSchema7,
      message: {
        title: 'Chat Message',
        type: 'string',
        description: 'The message that will be sent to ChatGPT.',
        'x-ui:widget': 'textarea',
      } as JSONSchema7,
      temperature: {
        title: 'Temperature',
        type: 'number',
        default: 1,
        maximum: 2,
        minimum: 0,
        description:
          'Higher values means the model will take more risks. Try 1.8 for more creative applications, and 0 for ones with a well-defined answer. [Learn More.](https://beta.openai.com/docs/quickstart/adjust-your-settings)',
      },
      maxTokens: {
        title: 'Max Tokens',
        type: 'number',
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
      response: {
        title: 'Chat Response',
        type: 'string',
      },
      message: {
        title: 'Chat Message',
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
    const { system, previous, message, prompt, temperature, maxTokens, stop, presencePenalty, frequencyPenalty } =
      inputs
    const messages = [
      {
        role: 'system',
        content: system.trim(),
      },
      ...this.extractConversationMessages(previous),
      {
        role: 'user',
        content: message.trim(),
      },
    ]
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credentials.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
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
        response: json.choices[0].message.content,
        message,
        usage: {
          promptTokens: json.usage.prompt_tokens,
          completionTokens: json.usage.completion_tokens,
          totalTokens: json.usage.total_tokens,
        },
      },
    }
  }

  extractConversationMessages(chat: string): Array<{ role: string; content: string }> {
    if (!chat) {
      return []
    }
    const lines = chat.trim().split('\n')
    const messages: Array<{ role: string; content: string }> = []
    const validRoles = ['user', 'assistant', 'system']
    let lineIterator = 0
    while (lineIterator < lines.length) {
      const line = lines[lineIterator]
      const role = line.trim().split(':')[0]

      // ensure line starts with a valid role
      if (!validRoles.includes(role)) {
        throw new Error(`Invalid role in line: ${line}. Valid roles are: ${validRoles.join(', ')}.`)
      }

      let messageContent = line.trim().split(':').slice(1).join(':')
      lineIterator++
      while (lines[lineIterator] && !validRoles.includes(lines[lineIterator].trim().split(':')[0])) {
        messageContent += `\n` + lines[lineIterator].trim()
        lineIterator++
      }
      messages.push({
        role: role.trim(),
        content: messageContent.trim(),
      })
    }
    return messages
  }
}
