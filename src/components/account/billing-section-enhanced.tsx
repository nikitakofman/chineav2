'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { Download, Calendar, CreditCard, Clock, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface BillingSectionEnhancedProps {
  locale?: string
  initialPlan: 'free' | 'premium'
  initialSubscription: any
  initialInvoices: Invoice[]
}

interface Invoice {
  id: string
  created: number
  status: string | null
  amount_paid: number
  currency: string
  invoice_pdf: string | null
  hosted_invoice_url: string | null
  number: string | null
}

export default function BillingSectionEnhanced({ 
  locale = 'en',
  initialPlan,
  initialSubscription,
  initialInvoices
}: BillingSectionEnhancedProps) {
  const t = useTranslations('dashboard.account.billing')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  // Use initial values from server-side props
  const currentPlan = initialPlan
  const subscription = initialSubscription
  const invoices = initialInvoices

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error(t('error.not_authenticated'))
        router.push(`/${locale}/auth/signin`)
        return
      }

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM,
          userId: user.id,
          email: user.email,
          locale: locale,
        }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error(t('error.upgrade_failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create portal session')
      }
    } catch (error: any) {
      console.error('Error:', error)
      const errorMessage = error?.message || t('error.manage_failed')
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: number, showTime = false) => {
    const dateLocale = locale === 'fr' ? fr : enUS
    const d = new Date(timestamp * 1000)
    const formatStr = showTime ? 'dd MMM yyyy HH:mm' : 'dd MMM yyyy'
    return format(d, formatStr, { locale: dateLocale })
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(amount / 100)
  }

  const plans = [
    {
      id: 'free',
      name: locale === 'fr' ? 'Gratuit' : 'Free',
      price: '0',
      currency: locale === 'fr' ? '€' : '$',
      period: locale === 'fr' ? '/mois' : '/month',
      features: [
        locale === 'fr' ? "Jusqu'à 50 articles" : 'Up to 50 articles',
        locale === 'fr' ? 'Support basique' : 'Basic support',
        locale === 'fr' ? 'Analyses basiques' : 'Basic analytics',
        locale === 'fr' ? 'Traitement standard' : 'Standard processing',
      ],
      current: currentPlan === 'free',
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '23.98',
      currency: '€',
      period: locale === 'fr' ? '/mois' : '/month',
      features: [
        locale === 'fr' ? 'Articles illimités' : 'Unlimited articles',
        locale === 'fr' ? 'Support prioritaire' : 'Priority support',
        locale === 'fr' ? 'Analyses avancées' : 'Advanced analytics',
        locale === 'fr' ? 'Traitement prioritaire' : 'Priority processing',
      ],
      current: currentPlan === 'premium',
      popular: true,
    },
  ]

  // Show the premium view if they have a subscription record, even if canceled
  if (subscription) {
    const nextBillingDate = subscription.current_period_end 
      ? new Date(subscription.current_period_end) 
      : null

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('title')}</CardTitle>
                <CardDescription>{t('description')}</CardDescription>
              </div>
              <Button 
                onClick={handleManageSubscription} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading 
                  ? (locale === 'fr' ? 'Chargement...' : 'Loading...')
                  : (locale === 'fr' ? 'Gérer mon abonnement' : 'Manage subscription')
                }
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Plan Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">Premium Plan</h3>
                  <p className="text-sm text-muted-foreground">€23.98{locale === 'fr' ? '/mois' : '/month'}</p>
                </div>
                <Badge 
                  variant={subscription.status === 'active' ? 'default' : subscription.status === 'canceled' ? 'secondary' : 'destructive'}
                  className={
                    subscription.status === 'active' ? 'bg-green-500 hover:bg-green-600' :
                    subscription.status === 'canceled' ? '' : 'bg-orange-500 hover:bg-orange-600'
                  }
                >
                  {subscription.status === 'active' 
                    ? (locale === 'fr' ? 'Actif' : 'Active')
                    : subscription.status === 'canceled'
                    ? (locale === 'fr' ? 'Annulé' : 'Canceled')
                    : (locale === 'fr' ? 'En retard' : 'Past Due')
                  }
                </Badge>
              </div>

              {subscription.status === 'past_due' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {locale === 'fr' 
                      ? 'Votre paiement a échoué. Veuillez mettre à jour vos informations de paiement.'
                      : 'Your payment failed. Please update your payment information.'
                    }
                  </AlertDescription>
                </Alert>
              )}
              
              {subscription.status === 'canceled' && subscription.cancel_at && new Date(subscription.cancel_at) > new Date() && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {locale === 'fr' 
                      ? `Votre abonnement est annulé et se terminera le ${formatDate(new Date(subscription.cancel_at).getTime() / 1000)}.`
                      : `Your subscription is canceled and will end on ${formatDate(new Date(subscription.cancel_at).getTime() / 1000)}.`
                    }
                  </AlertDescription>
                </Alert>
              )}
              
              {subscription.status === 'canceled' && (!subscription.cancel_at || new Date(subscription.cancel_at) <= new Date()) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {locale === 'fr' 
                      ? 'Votre abonnement a été annulé.'
                      : 'Your subscription has been canceled.'
                    }
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{locale === 'fr' ? 'Membre depuis' : 'Member since'}</p>
                    <p className="text-sm text-muted-foreground">
                      {subscription.created_at ? formatDate(new Date(subscription.created_at).getTime() / 1000) : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{locale === 'fr' ? 'Prochaine facturation' : 'Next billing'}</p>
                    <p className="text-sm text-muted-foreground">
                      {nextBillingDate ? formatDate(nextBillingDate.getTime() / 1000) : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{locale === 'fr' ? 'Méthode de paiement' : 'Payment method'}</p>
                    <p className="text-sm text-muted-foreground">****</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Billing History */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {locale === 'fr' ? 'Historique de facturation' : 'Billing history'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {locale === 'fr' 
                    ? 'Téléchargez vos factures et reçus'
                    : 'Download your invoices and receipts'
                  }
                </p>
              </div>

              {invoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{locale === 'fr' ? 'Date' : 'Date'}</TableHead>
                      <TableHead>{locale === 'fr' ? 'Numéro' : 'Number'}</TableHead>
                      <TableHead>{locale === 'fr' ? 'Montant' : 'Amount'}</TableHead>
                      <TableHead>{locale === 'fr' ? 'Statut' : 'Status'}</TableHead>
                      <TableHead className="text-right">{locale === 'fr' ? 'Actions' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{formatDate(invoice.created)}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {invoice.number || '-'}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(invoice.amount_paid, invoice.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                            {invoice.status === 'paid' 
                              ? (locale === 'fr' ? 'Payé' : 'Paid')
                              : invoice.status || '-'
                            }
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {invoice.invoice_pdf && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(invoice.invoice_pdf!, '_blank')}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              {locale === 'fr' ? 'Télécharger' : 'Download'}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {locale === 'fr' 
                    ? 'Aucune facture trouvée'
                    : 'No invoices found'
                  }
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Free plan view
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {plans.map((plan) => (
              <Card key={plan.id} className={plan.current ? 'border-primary' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{plan.name}</CardTitle>
                    {plan.popular && (
                      <Badge variant="default">
                        {locale === 'fr' ? 'Plus Populaire' : 'Most Popular'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                      {plan.currency}{plan.price}
                    </span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.current ? (
                    <Button variant="outline" disabled className="w-full">
                      {locale === 'fr' ? 'Plan Actuel' : 'Current Plan'}
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleUpgrade} 
                      disabled={loading}
                      className="w-full"
                    >
                      {loading 
                        ? (locale === 'fr' ? 'Chargement...' : 'Loading...')
                        : (locale === 'fr' ? 'Passer à Premium' : 'Upgrade to Premium')
                      }
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}