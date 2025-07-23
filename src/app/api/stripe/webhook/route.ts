import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: Request) {
  console.log('🔔 Webhook received')
  
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!

  console.log('Webhook signature:', signature?.slice(0, 20) + '...')
  console.log('Webhook secret configured:', !!webhookSecret)

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    console.log('✅ Webhook verified successfully')
    console.log('Event type:', event.type)
    console.log('Event ID:', event.id)
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        console.log('📦 Processing checkout.session.completed')
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Session ID:', session.id)
        console.log('Session metadata:', session.metadata)
        console.log('Subscription ID:', session.subscription)
        console.log('Customer ID:', session.customer)
        
        const userId = session.metadata?.userId

        if (!userId) {
          console.error('❌ No userId in session metadata')
          return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
        }

        console.log('User ID from metadata:', userId)

        try {
          // Retrieve the subscription details from Stripe
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          console.log('✅ Retrieved subscription from Stripe:', subscription.id)
          console.log('Subscription status:', subscription.status)

          // Create or update subscription in database
          const dbSubscription = await prisma.subscriptions.upsert({
            where: {
              stripe_subscription_id: subscription.id,
            },
            create: {
              user_id: userId,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer as string,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000),
              current_period_end: new Date(subscription.current_period_end * 1000),
            },
            update: {
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000),
              current_period_end: new Date(subscription.current_period_end * 1000),
            },
          })
          console.log('✅ Subscription saved to database:', dbSubscription.id)
        } catch (error) {
          console.error('❌ Error processing subscription:', error)
          throw error
        }

        break
      }

      case 'customer.subscription.updated': {
        console.log('📦 Processing customer.subscription.updated')
        const subscription = event.data.object as Stripe.Subscription
        console.log('Subscription ID:', subscription.id)
        console.log('Subscription status:', subscription.status)
        console.log('Cancel at period end:', subscription.cancel_at_period_end)
        console.log('Cancel at:', subscription.cancel_at)
        console.log('Current period end:', new Date(subscription.current_period_end * 1000))

        try {
          // Check if subscription exists in database
          const existingSubscription = await prisma.subscriptions.findUnique({
            where: {
              stripe_subscription_id: subscription.id,
            }
          })
          
          if (!existingSubscription) {
            console.error('❌ Subscription not found in database:', subscription.id)
            break
          }

          // Update subscription in database
          const updatedSubscription = await prisma.subscriptions.update({
            where: {
              stripe_subscription_id: subscription.id,
            },
            data: {
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000),
              current_period_end: new Date(subscription.current_period_end * 1000),
              cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
              canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
            },
          })
          console.log('✅ Subscription updated in database:', updatedSubscription.id)
          console.log('Updated status:', updatedSubscription.status)
          console.log('Cancel at:', updatedSubscription.cancel_at)
        } catch (error) {
          console.error('❌ Error updating subscription:', error)
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Update subscription status to canceled
        await prisma.subscriptions.update({
          where: {
            stripe_subscription_id: subscription.id,
          },
          data: {
            status: 'canceled',
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : new Date(),
          },
        })

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string
        
        // Update subscription status to past_due
        if (subscriptionId) {
          await prisma.subscriptions.update({
            where: {
              stripe_subscription_id: subscriptionId,
            },
            data: {
              status: 'past_due',
            },
          })
        }
        
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string
        
        // Update subscription status to active if it was past_due
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          
          await prisma.subscriptions.update({
            where: {
              stripe_subscription_id: subscriptionId,
            },
            data: {
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000),
              current_period_end: new Date(subscription.current_period_end * 1000),
            },
          })
        }
        
        break
      }
    }

    console.log('✅ Webhook processed successfully')
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}