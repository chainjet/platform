import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { StaticRunner } from 'apps/runner/src/services/static-runner.service'
import { JSONSchema7 } from 'json-schema'
import * as vm from 'vm'

export class RunInternalCodeAction extends OperationOffChain {
  unlisted: boolean = true
  key = 'runInternalCode'
  name = 'Run Workflow'
  description = 'Run code'
  version = '1.0.0'
  inputs: JSONSchema7 = {
    required: ['code'],
    properties: {
      code: {
        title: 'Code',
        type: 'string',
        'x-ui:widget': 'textarea',
      } as JSONSchema7,
      actions: {
        title: 'Actions',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            integrationKey: {
              title: 'Integration Key',
              type: 'string',
            },
            actionKey: {
              title: 'Action Key',
              type: 'string',
            },
            params: {
              title: 'Params',
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      result: {
        title: 'Result',
        type: 'object',
        description: 'The result of the JavaScript code',
        additionalProperties: true,
      },
    },
  }

  async run(opts: OperationRunOptions): Promise<RunResponse> {
    const { inputs, previousOutputs, workflowOperation, integrationAccount } = opts

    const actions = (inputs.actions ?? []).reduce((acc, action) => {
      acc[action.integrationKey] = acc[action.integrationKey] || {}
      acc[action.integrationKey][action.actionKey] = async (...params: any[]) => {
        const inputs = action.params.reduce((acc, param, index) => {
          acc[param] = params[index]
          return acc
        }, {})
        const definition = StaticRunner.instance.integrationDefinitionFactory.getDefinition(
          action.integrationKey,
        ) as SingleIntegrationDefinition
        await StaticRunner.instance.runAction({
          definition,
          actionKey: action.actionKey,
          inputs,
          accountCredential: workflowOperation?.store?.credentialIds?.[action.integrationKey],
        })
      }
      return acc
    }, {})

    const context = vm.createContext({
      trigger: previousOutputs?.trigger ?? {},
      ...actions,
    })

    const wrappedCode = `
      (async function() {
        ${inputs.code}
        try {
          return await run(trigger);
        } catch (e) {
          return { cj_error: e.message }
        }
      })()
    `

    const result = await vm.runInNewContext(wrappedCode, context)
    if (result?.cj_error) {
      throw new Error(result.cj_error)
    }
    return {
      outputs: {
        result,
      },
    }
  }
}
