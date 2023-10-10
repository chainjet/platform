import { Workflow } from '../workflows/entities/workflow'
import { User } from './entities/user'

export const NotificationMessages = {
  contactsExceeded(user: User) {
    return (
      `You've reached the maximum number of contacts (${user.planConfig.maxContacts}) allowed by your current plan. Please upgrade to add more.\n\n` +
      `ChainJet contacts enable you to build an audience to which you can send message campaigns.\n\n` +
      `You can see our plan options and upgrade here: https://chainjet.io/pricing\n\n` +
      `If you have any questions, please reply this message, we're happy to help.\n\n` +
      `Best,\n` +
      `The ChainJet Team`
    )
  },
  workflowDisabled(workflow: Workflow, consecutiveFailures: number) {
    return `Your ChainJet workflow has failed ${consecutiveFailures} consecutive times and it was disabled.\n\nYou can see the logs here: https://chainjet.io/workflows/${workflow.id}\n\nIf you have any questions or need asistance, feel free to reach out by replying this message.`
  },
}
