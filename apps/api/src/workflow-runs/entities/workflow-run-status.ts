import { registerEnumType } from '@nestjs/graphql'

export enum WorkflowRunStatus {
  running = 'running',
  sleeping = 'sleeping',
  completed = 'completed',
  failed = 'failed',
}

// Create a GraphQL enum for WorkflowRunStatus
registerEnumType(WorkflowRunStatus, {
  name: 'WorkflowRunStatus',
  description: 'Status of a workflow run',
})
