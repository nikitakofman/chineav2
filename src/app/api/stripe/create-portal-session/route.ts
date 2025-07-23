import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export async function POST(request: Request) {
  try {
    const { locale } = await request.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get customer ID from subscription table
    const subscription = await prisma.subscriptions.findFirst({
      where: {
        user_id: user.id,
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
    }

    const customerId = subscription.stripe_customer_id

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/${locale || 'en'}/dashboard/subscription`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Error creating portal session:', error)
    
    // Check if it's a Stripe configuration error
    if (error?.type === 'StripeInvalidRequestError' && error?.raw?.message?.includes('portal')) {
      return NextResponse.json(
        { error: 'Stripe Customer Portal is not configured. Please activate it in your Stripe Dashboard at https://dashboard.stripe.com/test/settings/billing/portal' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}