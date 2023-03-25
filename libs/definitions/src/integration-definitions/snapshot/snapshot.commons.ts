import { JSONSchema7 } from 'json-schema'

export const SNAPSHOT_PROPOSAL_SCHEMA: JSONSchema7 = {
  properties: {
    id: { type: 'string' },
    space: { type: 'string' },
    title: { type: 'string' },
    body: { type: 'string' },
    link: { type: 'string', format: 'uri' },
    author: { type: 'string' },
    created: { type: 'string', format: 'date-time' },
    state: { type: 'string' },
    network: { type: 'string' },
    symbol: { type: 'string' },
    start: { type: 'string', format: 'date-time' },
    end: { type: 'string', format: 'date-time' },
    snapshot: { type: 'string' },
    type: { type: 'string' },
    choices: {
      type: 'array',
      items: { type: 'string' },
    },
    scores: {
      type: 'array',
      items: { type: 'number' },
    },
    scoresByStrategy: {
      type: 'array',
      items: {
        type: 'array',
        items: { type: 'number' },
      },
    },
    scoresState: { type: 'string' },
    scoresTotal: { type: 'number' },
    scoresUpdated: { type: 'string', format: 'date-time' },
    votes: { type: 'integer' },
    ipfs: { type: 'string' },
    strategies: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          params: { type: 'object' },
        },
      },
    },
    validation: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        params: { type: 'object' },
      },
    },
    plugins: { type: 'object' },
    discussion: { type: 'string', format: 'uri' },
    quorum: { type: 'number' },
    privacy: { type: 'string' },
    app: { type: 'string' },
    expire: { type: 'number' },
  },
}
