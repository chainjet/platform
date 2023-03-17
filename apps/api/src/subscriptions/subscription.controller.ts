import { SubscriptionService } from '@app/common/subscriptions/subscription.service'
import { BadRequestException, Controller, Logger, Post, Req } from '@nestjs/common'
import { Request } from 'express'
import Stripe from 'stripe'
import { UserService } from '../users/services/user.service'
import { WorkflowTriggerService } from '../workflow-triggers/services/workflow-trigger.service'

@Controller('/subscriptions')
export class SubscriptionController {
  private readonly logger = new Logger(SubscriptionController.name)

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private userService: UserService,
    private workflowTriggerService: WorkflowTriggerService,
  ) {}

  @Post('/stripe-webhook')
  async stripeWebhook(@Req() req: Request): Promise<any> {
    const payload = (req as any).rawBody as string
    const signature = req.headers['stripe-signature'] as string
    if (!signature) {
      throw new BadRequestException('Missing signature')
    }
    const event = await this.subscriptionService.getWebhookEvent(payload, signature)
    if (!event) {
      return {}
    }
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id
        if (!userId) {
          this.logger.error(`Missing user id in checkout session ${session.id}`)
          throw new Error('Missing user id')
        }
        const user = await this.userService.findOne({ _id: userId })
        if (!user) {
          this.logger.error(`User ${userId} not found when completing checkout session ${session.id}`)
          throw new Error('User not found')
        }
        if (!session.subscription) {
          this.logger.error(`Missing subscription id in checkout session ${session.id}`)
          throw new Error('Missing subscription id')
        }
        const subscription = await this.subscriptionService.getSubscription(session.subscription.toString())
        this.logger.log(`User ${userId} activated subscription ${subscription.id} (${session.id})`)
        const planId = subscription.items.data[0].price.id
        await this.userService.updateOneNative(
          { _id: user._id },
          {
            plan: planId,
            planExpires: new Date(subscription.current_period_end * 1000),
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            operationsUsedMonth: 0,
            operationsReset: this.subscriptionService.getNextOperationResetDate(),
          },
        )
        const subscriptionEmail = session.customer_details?.email ?? session.customer_email
        if (!user.email && subscriptionEmail) {
          await this.userService.updateOneNative({ _id: user._id }, { email: subscriptionEmail, verified: false })
        }
        await this.workflowTriggerService.unmarkUserPlanAsLimited(user._id)
    }
    return {}
  }
}
