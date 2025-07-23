import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First, let's check if the user has a Stripe customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    })

    if (customers.data.length === 0) {
      return NextResponse.json({ 
        error: 'No Stripe customer found for this email',
        email: user.email 
      }, { status: 404 })
    }

    const customer = customers.data[0]
    console.log('Found customer:', customer.id)

    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1
    })

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ 
        error: 'No active subscription found',
        customerId: customer.id 
      }, { status: 404 })
    }

    const subscription = subscriptions.data[0]
    console.log('Found subscription:', subscription.id)

    // Create subscription in database
    const dbSubscription = await prisma.subscriptions.upsert({
      where: {
        stripe_subscription_id: subscription.id,
      },
      create: {
        user_id: user.id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customer.id,
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

    return NextResponse.json({ 
      success: true,
      subscription: dbSubscription,
      stripe: {
        customerId: customer.id,
        subscriptionId: subscription.id,
        status: subscription.status
      }
    })
  } catch (error) {
    console.error('Error creating test subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}