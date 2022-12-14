import { IntegrationDefinitionFactory } from '@app/definitions'
import { MutabilityEvm, OperationEvm, TemplateEvm, VarEvm } from '@app/definitions/operation-evm'
import { OperationType } from '@app/definitions/types/OperationType'
import { getInterpolatedValue } from '@app/definitions/utils/field.utils'
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import fs from 'fs'
import hre from 'hardhat'
import {
  TASK_COMPILE_SOLIDITY_CHECK_ERRORS,
  TASK_COMPILE_SOLIDITY_COMPILE,
  TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOBS,
  TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT,
  TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH,
  TASK_COMPILE_SOLIDITY_HANDLE_COMPILATION_JOBS_FAILURES,
  TASK_COMPILE_SOLIDITY_LOG_COMPILATION_RESULT,
} from 'hardhat/builtin-tasks/task-names'
import { CompilerInput } from 'hardhat/types'
import * as taskTypes from 'hardhat/types/builtin-tasks'
import { CompilationJob, CompilationJobsCreationResult } from 'hardhat/types/builtin-tasks'
import path from 'path'
import { IntegrationActionService } from '../integration-actions/services/integration-action.service'
import { IntegrationService } from '../integrations/services/integration.service'
import { WorkflowAction } from '../workflow-actions/entities/workflow-action'
import { WorkflowActionService } from '../workflow-actions/services/workflow-action.service'
import { Workflow } from '../workflows/entities/workflow'

@Injectable()
export class CompilerService {
  private readonly logger: Logger = new Logger(CompilerService.name)

  constructor(
    private workflowActionService: WorkflowActionService,
    private integrationService: IntegrationService,
    private integrationActionService: IntegrationActionService,
    protected integrationDefinitionFactory: IntegrationDefinitionFactory,
  ) {}

  async compile(workflow: Workflow): Promise<{ bytecode: string; abi: object[]; sourcecode: string }> {
    const workflowActions = await this.getOnChainWorkflowActions(workflow)

    const contractPath = path.join(__dirname, '../../../contracts/WorkflowTask.sol.template')
    const contractContent = (await fs.promises.readFile(contractPath, 'utf8')).toString()

    const templates: TemplateEvm[] = []
    const usedVars: VarEvm[] = []
    for (const workflowAction of workflowActions) {
      const template = await this.getTemplate(workflowAction, workflowActions, usedVars)
      usedVars.push(...template.args, ...template.vars)
      templates.push(template)
    }

    const imports = Array.from(new Set(templates.flatMap((template) => template.imports))).map(
      (importFile) => `import "${importFile}";`,
    )
    const code = templates.map((template) => template.code.trim()).join('\n')
    const mutability = templates.reduce((prev, curr) => {
      if (curr.mutability === MutabilityEvm.Modify || prev === MutabilityEvm.Modify) {
        return MutabilityEvm.Modify
      }
      return MutabilityEvm.View
    }, MutabilityEvm.View)
    const args = templates
      .flatMap((template) => template.args)
      .map((arg) => `${arg.type} ${arg.name}`)
      .join(', ')

    const sourcecode = contractContent
      .replace('/* {{imports}} */', imports.join('\n'))
      .replace('/* {{code}} */', code)
      .replace('/* {{mutability}} */', mutability)
      .replace('/* {{args}} */', args)
    const { abi, bytecode } = await this.compileSourceCode(workflow.id, sourcecode)

    return {
      abi,
      bytecode,
      sourcecode,
    }
  }

  private async getOnChainWorkflowActions(workflow: Workflow): Promise<WorkflowAction[]> {
    const actions = await this.workflowActionService.find({ workflow: workflow.id, type: OperationType.EVM })
    const routeAction = actions.find((action) => action.isContractRootAction)
    return routeAction ? this.getActionTree(actions, routeAction) : []
  }

  private getActionTree(allActions: WorkflowAction[], action?: WorkflowAction): WorkflowAction[] {
    if (!action) {
      return []
    }
    if (!action.nextActions || action.nextActions.length === 0) {
      return [action]
    }
    return [
      action,
      ...action.nextActions.flatMap((next) =>
        this.getActionTree(
          allActions,
          allActions.find((a) => a._id.toString() === next.action._id.toString()),
        ),
      ),
    ]
  }

  private async getTemplate(workflowAction: WorkflowAction, allActions: WorkflowAction[], usedVars: VarEvm[]) {
    const integrationAction = await this.integrationActionService.findById(
      workflowAction.integrationAction._id.toString(),
    )
    if (!integrationAction) {
      throw new InternalServerErrorException(`Integration action ${workflowAction.integrationAction.id} not found`)
    }
    const integration = await this.integrationService.findById(integrationAction.integration._id.toString())
    if (!integration) {
      throw new InternalServerErrorException(`Integration ${integrationAction.integration.id} not found`)
    }
    const definition = this.integrationDefinitionFactory.getDefinition(integration.parentKey ?? integration.key)
    const operationAction = definition.actions.find((action) => action.key === integrationAction.key) as OperationEvm

    // interpolate solidity variables
    const inputs = { ...workflowAction.inputs }
    for (const [key, value] of Object.entries(inputs)) {
      const interpolated = getInterpolatedValue(value)
      if (interpolated && interpolated.split('.').length === 2) {
        const id = interpolated.split('.')[0]
        const action = allActions.find((action) => action._id.toString() === id)
        if (action) {
          const varKey = interpolated.split('.')[1]
          inputs[key] = `{{solidity:${varKey}}}`
        }
      }
    }

    return operationAction.template(inputs, usedVars)
  }

  private async compileSourceCode(workflowId: string, sourcecode: string) {
    const fileName = `workflow-${workflowId}.sol`
    const contractPath = path.join(__dirname, `../../../dist/${fileName}`)
    await fs.promises.writeFile(contractPath, sourcecode)

    const sourceName = `dist/${fileName}`
    const dependencyGraph: taskTypes.DependencyGraph = await hre.run(TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH, {
      sourceNames: [sourceName],
    })

    const compilationJobsCreationResult: CompilationJobsCreationResult = await hre.run(
      TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOBS,
      {
        dependencyGraph,
      },
    )
    const compilationJobs: CompilationJob[] = compilationJobsCreationResult.jobs

    // TODO needed?
    await hre.run(TASK_COMPILE_SOLIDITY_HANDLE_COMPILATION_JOBS_FAILURES, {
      compilationJobsCreationErrors: compilationJobsCreationResult.errors,
    })

    const compilationJob = compilationJobs[0]
    this.logger.log(`Compiling workflow ${workflowId} with solidity '${compilationJob.getSolcConfig().version}'`)
    const input: CompilerInput = await hre.run(TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT, {
      compilationJob,
    })
    const { output } = await hre.run(TASK_COMPILE_SOLIDITY_COMPILE, {
      solcVersion: compilationJob.getSolcConfig().version,
      input,
      quiet: true,
      compilationJob,
      compilationJobs,
      compilationJobIndex: 0,
    })

    await hre.run(TASK_COMPILE_SOLIDITY_CHECK_ERRORS, { output, quiet: true })

    await hre.run(TASK_COMPILE_SOLIDITY_LOG_COMPILATION_RESULT, {
      compilationJobs,
      quiet: true,
    })

    return {
      abi: output.contracts[sourceName].WorkflowTask.abi,
      bytecode: output.contracts[sourceName].WorkflowTask.evm.bytecode.object,
    }
  }
}
