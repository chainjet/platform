import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { IntegrationAccount } from 'apps/api/src/integration-accounts/entities/integration-account'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { OpenAPIObject } from 'openapi3-ts'
import { Observable } from 'rxjs'
import { RunResponse } from '../definition'
import { IntegrationAuthDefinition, IntegrationAuthType } from '../types/IntegrationAuthDefinition'
import {
  getPipedreamOperations,
  PipedreamOperation,
  runPipedreamOperation,
  updatePipedreamSchemaBeforeInstall,
  updatePipedreamSchemaBeforeSave,
} from '../utils/pipedream.utils'

export class MongoDBDefinition extends SingleIntegrationDefinition {
  integrationKey = 'mongodb'
  integrationVersion = '1'
  schemaUrl = null
  operations: PipedreamOperation[]

  protected integrationAccount: IntegrationAccount | undefined

  async createOrUpdateIntegrationAccount(): Promise<IntegrationAccount | null> {
    if (!this.integrationAccount) {
      const authDefinition: IntegrationAuthDefinition = {
        authType: IntegrationAuthType.http,
        schema: {
          type: 'object',
          required: ['username', 'password', 'hostname', 'database'],
          exposed: ['username'],
          properties: {
            username: {
              type: 'string',
              title: 'Username',
            },
            password: {
              type: 'string',
              title: 'Password',
              format: 'password',
            },
            hostname: {
              type: 'string',
              title: 'Hostname',
            },
          },
        },
      }

      this.logger.debug('Creating or updating integration account for MongoDB')
      this.integrationAccount = await this.integrationAccountService.createOrUpdateOne({
        key: this.integrationKey,
        name: 'MongoDB',
        authType: authDefinition.authType,
        fieldsSchema: authDefinition.schema,
      })
    }

    return this.integrationAccount
  }

  async updateSchemaBeforeSave(schema: OpenAPIObject): Promise<OpenAPIObject> {
    const operations = await this.getOperations()
    return updatePipedreamSchemaBeforeSave(schema, operations)
  }

  async updateSchemaBeforeInstall(schema: OpenAPIObject): Promise<OpenAPIObject> {
    const operations = await this.getOperations()
    return updatePipedreamSchemaBeforeInstall(schema, operations)
  }

  async run(opts: OperationRunOptions): Promise<RunResponse | Observable<RunResponse>> {
    const operations = await this.getOperations()
    const operation = operations.find((a) => a.key === opts.operation.key)
    if (!operation) {
      throw new Error(`Operation ${opts.operation.key} not found for integration ${opts.integration.key}`)
    }
    return runPipedreamOperation(operation, opts)
  }

  private async getOperations(): Promise<PipedreamOperation[]> {
    if (!this.operations) {
      this.operations = await getPipedreamOperations('mongodb', this.getOperation)
    }
    return this.operations
  }

  async getOperation(type: string, key: string) {
    const op = await import(`../../../../dist/pipedream/components/mongodb/${type}/${key}/${key}.mjs`)
    return op.default
  }
}
