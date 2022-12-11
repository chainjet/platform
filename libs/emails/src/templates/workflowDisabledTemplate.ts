import { WorkflowRun } from 'apps/api/src/workflow-runs/entities/workflow-run'
import { Workflow } from 'apps/api/src/workflows/entities/workflow'
import { DEFAULT_EMAIL } from '../email.consts'
import { EmailTemplate } from './emailTemplate'

export class WorkflowDisabledTemplate implements EmailTemplate {
  name = 'WorkflowDisabled'
  sendFrom = DEFAULT_EMAIL

  constructor(private workflow: Workflow, private workflowRun: WorkflowRun, private consecutiveFailures: number) {}

  getSubject(): string {
    return `Your workflow "${this.workflow.name}" is failing`
  }

  getTextBody(): string {
    return ''
  }

  getHtmlBody(): string {
    return `Your ChainJet <a href="${process.env.FRONTEND_ENDPOINT}/workflows/${this.workflow.id}">workflow</a> has failed 
    ${this.consecutiveFailures} consecutive times and it was disabled.
    You can see the workflow run logs <a href="${process.env.FRONTEND_ENDPOINT}/workflows/${this.workflow.id}/run/${this.workflowRun.id}">here</a>.<br/><br/>
    
    You can try re-connecting your accounts and re-enabling the workflow. If you have any questions or need asistance, 
    feel free to reach out on <a href="https://discord.gg/QFnSwqj9YH">Discord</a>.<br/><br/>
    
    The ChainJet Team.`
  }
}
