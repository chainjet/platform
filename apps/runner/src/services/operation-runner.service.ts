import { AuthenticationError } from '@app/common/errors/authentication-error'
import { MetricService } from '@app/common/metrics/metric.service'
import { UserEventService } from '@app/common/metrics/user-event.service'
import { convertObservableToRunResponse, wait } from '@app/common/utils/async.utils'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { OperationType } from '@app/definitions/types/OperationType'
import { forwardRef, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common'
import { PlanConfig } from 'apps/api/src/users/config/plans.config'
import { WorkflowAction } from 'apps/api/src/workflow-actions/entities/workflow-action'
import { WorkflowTrigger } from 'apps/api/src/workflow-triggers/entities/workflow-trigger'
import { Workflow } from 'apps/api/src/workflows/entities/workflow'
import { HttpStatusCode } from 'axios'
import { ObjectId } from 'mongodb'
import { OAuth } from 'oauth'
import { OpenAPIObject } from 'openapi3-ts'
import request from 'request'
import SwaggerClient from 'swagger-client'
import { isEmptyObj } from '../../../../libs/common/src/utils/object.utils'
import {
  Definition,
  IntegrationDefinitionFactory,
  RequestInterceptorOptions,
  RunResponse,
  StepInputs,
} from '../../../../libs/definitions/src'
import { SchemaUtils } from '../../../../libs/definitions/src/schema/utils/schema.utils'
import { IntegrationAuthType } from '../../../../libs/definitions/src/types/IntegrationAuthDefinition'
import { AccountCredential } from '../../../api/src/account-credentials/entities/account-credential'
import { AccountCredentialService } from '../../../api/src/account-credentials/services/account-credentials.service'
import { OAuthStrategyFactory } from '../../../api/src/auth/external-oauth/oauth-strategy.factory'
import { IntegrationAccount } from '../../../api/src/integration-accounts/entities/integration-account'
import { IntegrationAction } from '../../../api/src/integration-actions/entities/integration-action'
import { IntegrationActionService } from '../../../api/src/integration-actions/services/integration-action.service'
import { IntegrationTrigger } from '../../../api/src/integration-triggers/entities/integration-trigger'
import { Integration } from '../../../api/src/integrations/entities/integration'
import { OperationDailyLimitError } from '../errors/operation-daily-limit.error'
import { EvmRunnerService } from './evm-runner.service'

export type BaseRunOptions = {
  integration: Integration
  integrationAccount: IntegrationAccount | null
  inputs: StepInputs
  credentials: StepInputs // TODO we could remove this and read it from accountCredentials
  accountCredential: AccountCredential | null // needed to store refreshed access token
  user?: {
    id: string
    address: string
    email?: string
    limits?: Record<string, number>
    planConfig: PlanConfig
  }
}

export type OperationRunOptions = BaseRunOptions & {
  operation: IntegrationAction | IntegrationTrigger
  workflow?: Workflow
  workflowOperation?: WorkflowAction | WorkflowTrigger
  fetchAll?: boolean
  cursor?: string
}

export type RunActionByKeyOptions = BaseRunOptions & {
  key: string
}

@Injectable()
export class OperationRunnerService {
  protected readonly logger: Logger = new Logger(OperationRunnerService.name)

  constructor(
    private readonly oauthStrategyFactory: OAuthStrategyFactory,
    private readonly integrationActionService: IntegrationActionService,
    @Inject(forwardRef(() => IntegrationDefinitionFactory))
    protected integrationDefinitionFactory: IntegrationDefinitionFactory,
    @Inject(forwardRef(() => AccountCredentialService)) protected accountCredentialService: AccountCredentialService,
    private readonly metricService: MetricService,
    private readonly evmRunnerService: EvmRunnerService,
    private readonly userEventService: UserEventService,
  ) {}

  async runTriggerCheck(definition: Definition, opts: OperationRunOptions): Promise<RunResponse> {
    this.logger.debug(
      `Running trigger ${opts.operation.key} of ${opts.integration.key} with inputs "${JSON.stringify(opts.inputs)}"`,
    )

    // If the definition has its own run definition, use it
    const runResponse = await this.runDefinitionWithRefreshCredentials(definition, opts)
    if (runResponse && !isEmptyObj(runResponse)) {
      const doPagination =
        opts.fetchAll &&
        runResponse.cursor &&
        (definition.operations.find((op) => op.key === opts.operation.key) as OperationTrigger).supportsPagination
      if (!doPagination) {
        return runResponse
      }

      // fetch all the items paginating the response
      let itResponse = runResponse
      let cursor = ''
      while ((itResponse.outputs?.items as [])?.length && itResponse.cursor && itResponse.cursor !== cursor) {
        cursor = itResponse.cursor!
        const nextRunResponse = await this.runDefinitionWithRefreshCredentials(definition, {
          ...opts,
          cursor,
        })
        if (nextRunResponse?.outputs?.items) {
          itResponse = {
            ...itResponse,
            ...nextRunResponse,
            outputs: {
              items: [...(itResponse.outputs.items as []), ...(nextRunResponse.outputs.items as [])],
            },
          }
        }
      }
      return itResponse!
    }

    return this.runOpenApiOperation(definition, opts)
  }

  async runAction(definition: Definition, opts: OperationRunOptions): Promise<RunResponse> {
    if (
      opts.workflowOperation &&
      'type' in opts.workflowOperation &&
      opts.workflowOperation.type === OperationType.EVM
    ) {
      return this.evmRunnerService.run(definition, opts)
    }

    const limits = definition.limits(opts)
    if (limits?.daily && opts.user) {
      const usedToday = await this.userEventService.findOne({
        user: opts.user.id,
        key: `run-${opts.operation._id.toString()}`,
        date: new Date().toISOString().split('T')[0],
      })
      if (usedToday && usedToday.value >= limits.daily) {
        throw new OperationDailyLimitError(
          `Daily limit reached for ${opts.operation.key} on ${opts.integration.name}. Please consider upgrading your plan.`,
        )
      }
    }

    this.logger.debug(
      `Running action ${opts.operation.key} of ${opts.integration.key} with inputs "${JSON.stringify(opts.inputs)}"`,
    )

    // If the definition has its own run definition, use it
    const definitionRunOutputs = await this.runDefinitionWithRefreshCredentials(definition, opts)
    if (definitionRunOutputs && !isEmptyObj(definitionRunOutputs)) {
      if (limits?.daily && opts.user) {
        await this.userEventService.log(new ObjectId(opts.user.id), `run-${opts.operation._id.toString()}`)
      }
      return definitionRunOutputs
    }

    return this.runOpenApiOperation(definition, opts)
  }

  private async runOpenApiOperation(
    definition: Definition,
    opts: OperationRunOptions,
    retryCount: number = 0,
  ): Promise<RunResponse> {
    const { integration, integrationAccount, operation, inputs, credentials, accountCredential } =
      await definition.beforeOperationRun(opts)

    if (!operation.schemaId || !operation.schemaPath || !operation.schemaMethod) {
      throw new InternalServerErrorException(`Operation ${operation.key} does not have schema data`)
    }

    // set refreshed credentials if the credentials changed on beforeOperationRun
    let refreshedCredentials: Record<string, any> | undefined = undefined
    if (
      credentials.accessToken !== opts.credentials.accessToken ||
      credentials.refreshToken !== opts.credentials.refreshToken
    ) {
      refreshedCredentials = {
        ...opts.credentials,
        ...credentials,
      }
    }

    // TODO can we avoid fetching the entire schema from disk? can we generate it dynamically from our db?
    // Get the schema without specifying URL because we should never fetch external schemas on runtime
    const schema = await SchemaUtils.getSchema({
      integrationKey: integration.key,
      integrationVersion: integration.version,
    })

    // Get query, path and header parameter from inputs
    const parameters = Object.entries(operation.schemaRequest.properties ?? {}).reduce((prev, [paramKey, param]) => {
      if (typeof param === 'object' && ['query', 'path', 'header'].includes(param['x-in'])) {
        // Autocomplete required enum params with 1 possible option (i.e. X-Amz-Target)
        if (operation.schemaRequest.required?.includes(paramKey) && param.enum?.length === 1) {
          prev[paramKey] = param.enum[0] as string
        }

        if (inputs[paramKey]) {
          prev[paramKey] = inputs[paramKey]
        }
      }
      return prev
    }, {})

    const options: Record<string, unknown> = this.getServerUrl(schema, opts) ?? {}

    // Inputs that weren't added as parameters, should go into the request body
    if (!['get', 'head'].includes(operation.schemaMethod.toLowerCase())) {
      const body: Record<string, any> = {}
      for (const inputKey of Object.keys(inputs)) {
        if (!parameters[inputKey]) {
          body[inputKey] = inputs[inputKey]
        }
      }
      // Some APIs like AWS fail with empty objects
      if (!isEmptyObj(body)) {
        options.requestBody = body
      }
    }

    // Build authorizations options for Swagger Client
    let authorizations: any
    if (integrationAccount?.securitySchemeKey) {
      switch (integrationAccount.authType) {
        case IntegrationAuthType.oauth2:
          authorizations = {
            [integrationAccount.securitySchemeKey]: {
              token: {
                access_token: credentials.accessToken,
              },
            },
          }
          break
        case IntegrationAuthType.apiKey:
          if (integrationAccount.securitySchema?.name) {
            authorizations = {
              [integrationAccount.securitySchemeKey]: credentials[integrationAccount.securitySchema?.name],
            }
          }
          break
        case IntegrationAuthType.http:
          if (integrationAccount.securitySchema?.scheme === 'basic') {
            authorizations = {
              [integrationAccount.securitySchemeKey]: {
                username: credentials.username,
                password: credentials.password,
              },
            }
          } else {
            authorizations = {
              [integrationAccount.securitySchemeKey]: {
                value: credentials.token,
              },
            }
          }
          break
        // OAuth 1 is not supported by OpenAPI 3.0, so authentication gets handled by requestInterceptor
        case IntegrationAuthType.oauth1:
          break
      }
    }

    const client = await new SwaggerClient({
      spec: schema,
      authorizations,
      requestInterceptor: (req: request.OptionsWithUrl) =>
        this.requestInterceptor(definition, {
          req,
          schema,
          integration: integration,
          integrationAccount,
          action: operation,
          inputs,
          credentials,
          authorizations,
        }),
    })

    const tag = operation.category ?? 'default'

    // Regex from https://github.com/swagger-api/swagger-js/blob/3b5cc18fd7c738f3954609b0820459ef57e15c11/src/helpers.js
    const apiId = operation.schemaId.replace(/[\s!@#$%^&*()_+=[{\]};:<>|./?,\\'""-]/g, '_')

    try {
      const res = await client.apis[tag][apiId](parameters, options)
      this.logger.debug(`Completed ${operation.key} of ${integration.key} with status ${res?.status as number}`)
      const outputs = await definition.afterOperationRun(opts, res?.body || {})
      this.emitOperationRunMetric(true)
      return { outputs, refreshedCredentials }
    } catch (e) {
      const statusCode = e.status ?? e.statusCode
      // retry once 401 errors (authorization)
      if (
        !retryCount &&
        statusCode === 401 &&
        credentials.refreshToken &&
        integrationAccount?.key &&
        integrationAccount.authType === IntegrationAuthType.oauth2
      ) {
        opts.credentials.accessToken = await this.oauthStrategyFactory.refreshOauth2AccessToken(
          integrationAccount.key,
          accountCredential,
          credentials,
        )
        return this.runOpenApiOperation(definition, opts, retryCount + 1)
      }
      // retry once 429 errors (rate limiting) and 500 errors (server errors)
      if (!retryCount && (statusCode === 429 || statusCode >= 500)) {
        // if rate limited, wait 500ms before retrying
        if (statusCode === 429) {
          await wait(500)
        }
        return this.runOpenApiOperation(definition, opts, retryCount + 1)
      }
      this.emitOperationRunMetric(false)
      // throw 401 errors as AuthenticationError so account credentials are marked as expired
      if (statusCode === 401) {
        const error = new AuthenticationError(e?.message)
        error.stack = e?.stack
        throw error
      }
      throw e
    }
  }

  async runActionByKey(definition: Definition, opts: RunActionByKeyOptions): Promise<RunResponse> {
    const operation = await this.integrationActionService.findOne({
      integration: opts.integration.id,
      key: opts.key,
    })
    if (!operation) {
      throw new NotFoundException(`Integration Action ${opts.key} not found`)
    }
    return this.runAction(definition, { ...opts, operation })
  }

  private async runDefinitionWithRefreshCredentials(
    definition: Definition,
    opts: OperationRunOptions,
    maxRetries = 3, // only for 429 errors, other errors retry once
    retryCount = 0,
  ): Promise<RunResponse | null> {
    try {
      const runResponse = await definition.run(opts)
      if (runResponse) {
        return await convertObservableToRunResponse(runResponse)
      }
      return runResponse
    } catch (err) {
      // if rate limited, retry up to maxRetries using exponential backoff
      if (err.status === HttpStatusCode.TooManyRequests) {
        await wait(3000 * Math.pow(2, retryCount) + 1000 * Math.random())
        if (retryCount < maxRetries) {
          return this.runDefinitionWithRefreshCredentials(definition, opts, maxRetries, retryCount + 1)
        }
      }

      // for other errors, refresh credentials and retry once
      if (opts.integrationAccount?.authType === IntegrationAuthType.oauth2) {
        opts.credentials.accessToken = await this.oauthStrategyFactory.refreshOauth2AccessToken(
          opts.integrationAccount.key,
          opts.accountCredential,
          opts.credentials,
        )
      }
      const res = await definition.run(opts)
      if (res) {
        return await convertObservableToRunResponse(res)
      }
      return res
    }
  }

  requestInterceptor(definition: Definition, opts: RequestInterceptorOptions): request.OptionsWithUrl {
    const { req, integrationAccount, credentials, authorizations } = opts
    req.headers = req.headers ?? {}

    // Set Authorization header for OAuth 1
    if (integrationAccount?.authType === IntegrationAuthType.oauth1) {
      const consumerKey = process.env[`${integrationAccount.key.toUpperCase()}_CONSUMER_KEY`] ?? ''
      const consumerSecret = process.env[`${integrationAccount.key.toUpperCase()}_CONSUMER_SECRET`] ?? ''
      const requestTokenURL = integrationAccount.securitySchema?.['x-requestTokenURL']
      const accessTokenURL = integrationAccount.securitySchema?.['x-accessTokenURL']
      const signatureMethod = integrationAccount.securitySchema?.['x-signatureMethod']
      req.headers = req.headers ?? {}
      req.headers.Authorization = new OAuth(
        requestTokenURL,
        accessTokenURL,
        consumerKey,
        consumerSecret,
        '1.0',
        '',
        signatureMethod,
      ).authHeader(req.url.toString(), credentials.token, credentials.tokenSecret, req.method)
    }

    // Make sure access tokenis included in the request headers
    if (integrationAccount?.authType === IntegrationAuthType.oauth2 && !req.headers.Authorization && authorizations) {
      const keys = Object.keys(authorizations)
      if (keys.length === 1) {
        req.headers.Authorization = `Bearer ${authorizations[keys[0]].token.access_token}`
      }
    }

    if (!req.headers.Accept) {
      req.headers.Accept = 'application/json'
    }
    if (!req.headers['Content-Type']) {
      req.headers['Content-Type'] = 'application/json'
    }

    return definition.requestInterceptor({
      ...opts,
      req,
    })
  }

  /**
   * Find server url matching inputs variables
   */
  getServerUrl(
    schema: OpenAPIObject,
    opts: OperationRunOptions,
  ): { server: string; serverVariables: Record<string, string> } | null {
    const inputs = opts.inputs
    const servers = (schema.servers ?? []).filter((server) => {
      if (!server.variables) {
        return true
      }
      const vars: string[] = [...server.url.matchAll(/{([^}]+)}/g)].map((x) => x[1])
      for (const variable of vars) {
        const value = inputs[variable] || opts.credentials[variable] || server.variables[variable].default
        if (server.variables[variable].enum) {
          const serverOptions = (server.variables[variable].enum ?? []) as string[]
          if (!serverOptions.includes(value)) {
            return false
          }
        }
        return true
      }
      return true
    })

    // Prefer https servers
    let server
    if (servers.length > 1) {
      server = servers.find((server) => server.url.startsWith('https')) ?? servers[0]
    } else {
      server = servers[0]
    }

    if (server?.url) {
      const vars: string[] = [...server.url.matchAll(/{([^}]+)}/g)].map((x) => x[1])
      const serverVariables: Record<string, string> = {}
      for (const variable of vars) {
        serverVariables[variable] = inputs[variable] || opts.credentials[variable] || server.variables[variable].default
      }
      return {
        server: server.url,
        serverVariables,
      }
    }
    return null
  }

  async runOperationAfterAccountCreated(opts: {
    integration: Integration
    integrationAccount: IntegrationAccount | null
    credentials: StepInputs
    accountCredential: AccountCredential | null
  }): Promise<void> {
    const { integration } = opts
    const definition = this.integrationDefinitionFactory.getDefinition(integration.parentKey ?? integration.key)
    const operationRunOptions = await definition.getInitOperationOptions(opts)
    if (operationRunOptions) {
      const runResponse = await this.runAction(definition, operationRunOptions)
      const result = await definition.afterInitOperationRun(runResponse.outputs, operationRunOptions)
      if (result.accountCredential) {
        await this.accountCredentialService.updateById(result.accountCredential._id, { ...result.accountCredential })
      }
    }
  }

  private emitOperationRunMetric(success: boolean) {
    this.metricService.emit({
      nameSpace: 'Runner',
      metricName: 'OperationRun',
      value: success ? 1 : 0,
    })
  }
}
