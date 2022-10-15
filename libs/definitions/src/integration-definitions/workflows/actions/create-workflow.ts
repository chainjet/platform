import { GetAsyncSchemasProps, RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { AsyncSchema } from '@app/definitions/types/AsyncSchema'
import { WorkflowService } from 'apps/api/src/workflows/services/workflow.service'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import { Types } from 'mongoose'

export class CreateWorkflowAction extends OperationOffChain {
  key = 'createWorkflow'
  name = 'Create Workflow'
  description = 'Create a ChainJet Workflow'
  version = '1.0.0'
  inputs: JSONSchema7 = {
    required: ['template'],
    properties: {
      name: {
        title: 'Name',
        type: 'string',
      },
      template: {
        title: 'Template',
        type: 'string',
      },
      templateInputs: {
        title: 'Template Inputs',
        'x-hidden': true,
      } as JSONSchema7Definition,
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      workflowId: { type: 'string' },
    },
  }
  asyncSchemas: AsyncSchema[] = [{ name: 'template' }, { name: 'templateInputs', dependencies: ['template'] }]

  async run({ inputs, user }: OperationRunOptions): Promise<RunResponse> {
    if (!user?.id) {
      throw new Error(`Unexpected error: user is not defined`)
    }
    if (!inputs.template) {
      throw new Error(`Template is required`)
    }
    const template = await WorkflowService.instance.findOne({ owner: user.id, _id: inputs.template })
    if (!template) {
      throw new Error(`Template with id ${inputs.template} not found`)
    }
    const { TemplateService } = await import('apps/api/src/templates/services/template.service')
    const workflow = await TemplateService.instance.createFromTemplate({
      userId: new Types.ObjectId(user.id),
      name: inputs.name,
      template,
      inputs: inputs.templateInputs ?? {},
    })
    return {
      outputs: {
        workflowId: workflow.id,
      },
    }
  }

  async getAsyncSchemas() {
    return {
      template: async ({ user }: GetAsyncSchemasProps): Promise<JSONSchema7> => {
        if (!user?.id) {
          throw new Error(`Unexpected error: user is not defined`)
        }
        const templates = await WorkflowService.instance.find({ owner: user.id, isTemplate: true })
        return {
          oneOf: templates.map((template) => ({
            title: `${template.name} (${template.id})`,
            const: template.id,
          })),
        }
      },
      templateInputs: async ({ user, inputs }: GetAsyncSchemasProps): Promise<JSONSchema7> => {
        if (!user?.id) {
          throw new Error(`Unexpected error: user is not defined`)
        }
        if (!inputs.template) {
          return {}
        }
        const template = await WorkflowService.instance.findOne({ owner: user.id, _id: inputs.template })
        if (!template) {
          return {}
        }
        return {
          'x-hidden': false,
          ...(template.templateSchema ?? {}),
        } as JSONSchema7
      },
    }
  }
}
