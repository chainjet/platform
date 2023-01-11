import { IntegrationAction } from 'apps/api/src/integration-actions/entities/integration-action'
import { IntegrationTrigger } from 'apps/api/src/integration-triggers/entities/integration-trigger'
import { JSONSchema7 } from 'json-schema'
import { GetAsyncSchemasProps } from './definition'
import { AsyncSchema } from './types/AsyncSchema'
import { OperationType } from './types/OperationType'

export abstract class Operation {
  abstract type: OperationType
  abstract key: string
  abstract name: string
  abstract description: string
  abstract version: string
  abstract inputs: JSONSchema7
  outputs: JSONSchema7 = {}
  asyncSchemas: AsyncSchema[] = []
  deprecated = false
  skipAuth = false
  learnResponseIntegration = false
  learnResponseWorkflow = false
  metadata: object

  /**
   * see definition.getAsyncSchemas
   */
  async getAsyncSchemas(
    operation: IntegrationAction | IntegrationTrigger,
  ): Promise<{ [key: string]: (props: GetAsyncSchemasProps) => Promise<JSONSchema7> }> {
    return {}
  }

  /**
   * see definition.getAsyncSchemaExtension
   */
  async getAsyncSchemaExtension(
    operation: IntegrationAction | IntegrationTrigger,
    props: GetAsyncSchemasProps,
  ): Promise<JSONSchema7> {
    return {}
  }
}
