import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Stripe from 'stripe'

@Injectable()
export class SubscriptionService {
  private readonly stripe: Stripe

  constructor(private configService: ConfigService) {
    const secretKey = configService.get<string>('STRIPE_SECRET_KEY')
    if (secretKey) {
      this.stripe = new Stripe(secretKey, { apiVersion: '2022-11-15' })
    }
  }

  async createCheckoutSession(userId: string, planId: string, successUrl: string, cancelUrl: string): Promise<string> {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: planId,
          quantity: 1,
        },
      ],
      client_reference_id: userId,
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    return session.id
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
