import { registerEnumType } from '@nestjs/graphql'

export enum WorkflowRunStartedByOptions {
  user = 'user',
  trigger = 'trigger',
  workflowFailure = 'workflowFailure'
}

// Create a GraphQL enum for WorkflowRunStatus
registerEnumType(WorkflowRunStartedByOptions, {
  name: 'WorkflowRunStartedByOptions',
  description: 'Specifies who started the workflow run'
})
