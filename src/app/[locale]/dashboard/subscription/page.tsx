import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import BillingSectionEnhanced from '@/components/account/billing-section-enhanced'
import { getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

interface SubscriptionPageProps {
  params: Promise<{ locale: string }>
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export default async function SubscriptionPage({ params }: SubscriptionPageProps) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const t = await getTranslations('account')

  if (!user) {
    redirect('/connect')
  }

  // Fetch subscription data server-side
  const subscription = await prisma.subscriptions.findFirst({
    where: {
      user_id: user.id,
      status: {
        in: ['active', 'past_due', 'canceled']
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  })

  let invoices: any[] = []
  if (subscription) {
    try {
      const stripeInvoices = await stripe.invoices.list({
        customer: subscription.stripe_customer_id,
        limit: 100,
      })
      
      invoices = stripeInvoices.data.map(invoice => ({
        id: invoice.id,
        created: invoice.created,
        status: invoice.status,
        amount_paid: invoice.amount_paid,
        currency: invoice.currency,
        invoice_pdf: invoice.invoice_pdf,
        hosted_invoice_url: invoice.hosted_invoice_url,
        number: invoice.number,
      }))
    } catch (error) {
      console.error('Error fetching invoices:', error)
    }
  }

  const currentPlan = subscription && subscription.status !== 'canceled' ? 'premium' : 'free'
  
  // Serialize subscription data for client component
  const serializedSubscription = subscription ? {
    ...subscription,
    created_at: subscription.created_at?.toISOString(),
    updated_at: subscription.updated_at?.toISOString(),
    current_period_start: subscription.current_period_start?.toISOString(),
    current_period_end: subscription.current_period_end?.toISOString(),
    cancel_at: subscription.cancel_at?.toISOString(),
    canceled_at: subscription.canceled_at?.toISOString(),
  } : null

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('subscription')}</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">{t('manageYourSubscription')}</p>
      </div>
      
      <BillingSectionEnhanced 
        locale={locale} 
        initialPlan={currentPlan}
        initialSubscription={serializedSubscription}
        initialInvoices={invoices}
      />
    </div>
  )
}