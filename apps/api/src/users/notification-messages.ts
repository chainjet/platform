import { Workflow } from '../workflows/entities/workflow'

export const NotificationMessages = {
  contactsExceeded:
    'Your ChainJet workflow just tried to create a new contact, but you have reached the maximum number allowed by your plan. Please upgrade your plan to add more.',
  workflowDisabled(workflow: Workflow, consecutiveFailures: number) {
    return `Your ChainJet workflow has failed ${consecutiveFailures} consecutive times and it was disabled.\n\nYou can see the logs here: https://chainjet.io/workflows/${workflow.id}\n\nIf you have any questions or need asistance, feel free to reach out by replying this message.`
  },
}
