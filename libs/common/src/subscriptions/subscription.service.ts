import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { User } from 'apps/api/src/users/entities/user'
import Stripe from 'stripe'

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name)
  private readonly stripe: Stripe

  constructor(private configService: ConfigService) {
    const secretKey = configService.get<string>('STRIPE_SECRET_KEY')
    if (secretKey) {
      this.stripe = new Stripe(secretKey, { apiVersion: '2022-11-15' })
    }
  }

  async createCheckoutSession(user: User, priceId: string, successUrl: string, cancelUrl: string): Promise<string> {
    const stripePrice = await this.stripe.prices.retrieve(priceId)
    if (!stripePrice) {
      throw new Error('Price not found')
    }
    if (stripePrice.product === user.plan) {
      throw new Error('You already have this plan')
    }
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      client_reference_id: user.id,
      customer: user.stripeCustomerId,
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    return session.id
  }

  async resumeSubscription(user: User): Promise<void> {
    const subscription = await this.stripe.subscriptions.retrieve(user.stripeSubscriptionId!)
    if (!subscription) {
      throw new Error('Subscription not found')
    }
    if (subscription.cancel_at_period_end) {
      await this.stripe.subscriptions.update(user.stripeSubscriptionId!, {
        cancel_at_period_end: false,
      })
    }
  }

  async cancelSubscription(user: User): Promise<void> {
    if (!user.stripeSubscriptionId) {
      throw new Error('You do not have an active subscription')
    }
    // Cancel subscription at the end of the billing cycle
    await this.stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    })
  }

  async changeSubscription(user: User, priceId: string): Promise<string> {
    if (!user.stripeSubscriptionId) {
      throw new Error('You do not have an active subscription')
    }
    const stripePrice = await this.stripe.prices.retrieve(priceId)
    if (!stripePrice) {
      throw new Error('Price not found')
    }
    if (stripePrice.product === user.plan) {
      throw new Error('You already have this plan')
    }
    const currentSubscription = await this.stripe.subscriptions.retrieve(user.stripeSubscriptionId)
    if (!currentSubscription) {
      throw new Error(`Subscription ${user.stripeSubscriptionId} not found`)
    }
    await this.stripe.subscriptions.update(user.stripeSubscriptionId, {
      items: [
        {
          id: currentSubscription.items.data[0].id,
          price: priceId,
        },
      ],
    })
    return stripePrice.product.toString()
  }

  async getWebhookEvent(payload: any, signature: string): Promise<Stripe.Event | null> {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET')!,
    )
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.retrieve(subscriptionId)
  }
}
