import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OpenAPIObject, OperationObject, ParameterObject } from 'openapi3-ts'
import { OperationRunOptions } from '../../../../apps/runner/src/services/operation-runner.service'

export class SlackDefinition extends SingleIntegrationDefinition {
  integrationKey = 'slack'
  integrationVersion = '2'
  schemaUrl = 'https://raw.githubusercontent.com/slackapi/slack-api-specs/master/web-api/slack_web_openapi_v2.json'

  mapSchemaOperation (operationSchema: OperationObject): OperationObject {
    return {
      ...operationSchema,
      summary: operationSchema.summary ?? operationSchema.operationId?.replace(/_/g, ' '),
      description: operationSchema.description
    }
  }

  updateSchemaBeforeSave (schema: OpenAPIObject): Promise<OpenAPIObject> {
    // Filter out token parameters from all operations
    const filterParams = (param: ParameterObject): boolean => {
      return param.name !== 'token'
    }
    for (const [pathKey, pathValue] of Object.entries(schema.paths)) {
      if (schema.paths[pathKey].parameters) {
        schema.paths[pathKey].parameters = schema.paths[pathKey].parameters.filter(filterParams)
      }
      for (const methodKey of Object.keys(pathValue)) {
        if (schema.paths[pathKey][methodKey].parameters) {
          schema.paths[pathKey][methodKey].parameters = schema.paths[pathKey][methodKey].parameters.filter(filterParams)
        }
      }
    }

    // Slack has 3 groups of scopes which are not compatible with each other: Bot, User and Workspace
    // Currently bot scope is supported, we could offer all authentication types in the future (and filter operations)
    const botScopes = [
      'app_mentions:read',
      'calls:read',
      'calls:write',
      'channels:history',
      'channels:join',
      'channels:manage',
      'channels:read',
      'chat:write',
      'chat:write.customize',
      'chat:write.public',
      'commands',
      'dnd:read',
      'emoji:read',
      'files:read',
      'files:write',
      'groups:history',
      'groups:read',
      'groups:write',
      'im:history',
      'im:read',
      'im:write',
      'incoming-webhook',
      'links:read',
      'links:write',
      'mpim:history',
      'mpim:read',
      'mpim:write',
      'pins:read',
      'pins:write',
      'reactions:read',
      'reactions:write',
      'reminders:read',
      'reminders:write',
      'remote_files:read',
      'remote_files:share',
      'remote_files:write',
      'team:read',
      'usergroups:read',
      'usergroups:write',
      'users.profile:read',
      'users:read',
      'users:read.email',
      'users:write',
      'workflow.steps:execute'
    ]

    for (const [pathKey, pathValue] of Object.entries(schema.paths)) {
      for (const [operationKey, operationValue] of Object.entries(pathValue)) {
        const isWhitelisted = (operationValue as OperationObject).security?.[0].slackAuth
          .some(scope => {
            return !scope.includes('admin') && (scope === 'none' || botScopes.some(botScope => scope.includes(botScope)))
          })
        if (!isWhitelisted) {
          schema.paths[pathKey][operationKey]['x-ignore'] = true
        }
      }
    }

    // Use only bot scopes on authentication
    // @ts-expect-error
    schema.components.securitySchemes.slackAuth.flows.authorizationCode.scopes =
      botScopes.reduce((prev, curr) => {
        prev[curr] = curr
        return prev
      }, {})

    return Promise.resolve(schema)
  }

  async beforeOperationRun (opts: OperationRunOptions): Promise<OperationRunOptions> {
    // Slack accepts only channel IDs, we also accept channel URLs
    if (opts.inputs.channel) {
      opts.inputs.channel = opts.inputs.channel.split('/').pop().split('?')[0].split('#')[0]
    }

    return opts
  }

  async afterOperationRun (opts: OperationRunOptions, outputs: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Slack always succeeds requests, but sends an ok: false on errors.
    if (outputs.ok === false) {
      throw new Error(JSON.stringify(outputs))
    }

    return outputs
  }
}
