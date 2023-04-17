import { OperationOffChain } from '@app/definitions/opertion-offchain'

export class SendTweetAction extends OperationOffChain {
  key = 'sendTweet'
  name = 'Send Tweet'
  description = 'Send a tweet'
  version = '1.0.0'
  inputs: JSONSchema7 = {
    required: ['content', 'imageUrl'],
    properties: {
      content: {
        type: 'string',
        title: 'Tweet Content',
        description: 'The content of the tweet.',
      },
      imageUrl: {
        type: 'string',
        title: 'Image URL',
        description: 'The URL of the image to attach to the tweet.',
      },
    },
  }
  outputs: JSONSchema7 = {
    type: 'object',
    properties: {
      tweetId: {
        type: 'string',
      },
      tweetUrl: {
        type: 'string',
      },
    },
  }

  async run({ inputs, credentials }: OperationRunOptions): Promise<RunResponse> {
    const client = TwitterLib.getClient(credentials)
    const res = await client.tweets.send({
      content: inputs.content,
      imageUrl: inputs.imageUrl,
    })
    return {
      outputs: {
        tweetId: res.id,
        tweetUrl: res.url,
      },
    }
  }
}
