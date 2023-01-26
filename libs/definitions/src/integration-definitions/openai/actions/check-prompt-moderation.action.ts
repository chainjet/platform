import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

export class CheckPromptModerationAction extends OperationOffChain {
  key = 'checkPromptModeration'
  name = 'Check Prompt Moderation'
  description = "Given a input text, outputs if the model classifies it as violating OpenAI's content policy"
  version = '1.0.0'
  inputs: JSONSchema7 = {
    required: ['prompt'],
    properties: {
      prompt: {
        title: 'Prompt',
        type: 'string',
        description: 'The input text to classify',
        'x-ui:widget': 'textarea',
      } as JSONSchema7,
      model: {
        title: 'Model',
        type: 'string',
        enum: ['text-moderation-stable', 'text-moderation-latest'],
        default: 'text-moderation-latest',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      id: {
        type: 'string',
      },
      flagged: {
        type: 'boolean',
      },
      hate: {
        type: 'boolean',
      },
      hate_score: {
        type: 'number',
      },
      hate_threatening: {
        type: 'boolean',
      },
      hate_threatening_score: {
        type: 'number',
      },
      self_harm: {
        type: 'boolean',
      },
      self_harm_score: {
        type: 'number',
      },
      sexual: {
        type: 'boolean',
      },
      sexual_score: {
        type: 'number',
      },
      violence: {
        type: 'boolean',
      },
      violence_score: {
        type: 'number',
      },
    },
  }

  async run({ inputs, credentials }: OperationRunOptions): Promise<RunResponse> {
    const { prompt, model } = inputs
    const res = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credentials.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: prompt,
        model,
      }),
    })
    const json = await res.json()
    console.log(`json:`, JSON.stringify(json, null, 2))
    return {
      outputs: {
        id: json.id,
        flagged: json.results[0].flagged,
        hate: json.results[0].categories.hate,
        hate_score: json.results[0].category_scores.hate,
        hate_threatening: json.results[0].categories['hate/threatening'],
        hate_threatening_score: json.results[0].category_scores['hate/threatening'],
        self_harm: json.results[0].categories['self-harm'],
        self_harm_score: json.results[0].category_scores['self-harm'],
        sexual: json.results[0].categories.sexual,
        sexual_score: json.results[0].category_scores.sexual,
        violence: json.results[0].categories.violence,
        violence_score: json.results[0].category_scores.violence,
      },
    }
  }
}
