'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/routing'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export function BillingSection() {
  const t = useTranslations('account')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isManaging, setIsManaging] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<'free' | 'premium'>('free')
  const supabase = createClient()

  useEffect(() => {
    // Check for canceled params
    if (searchParams.get('canceled') === 'true') {
      toast.error(locale === 'fr' ? 'Paiement annulé' : 'Payment canceled')
      router.replace('/dashboard/subscription')
    }
  }, [searchParams, router, locale])

  useEffect(() => {
    // Check user's subscription status from database
    const checkSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // Check subscription table
      const response = await fetch('/api/subscription/status')
      if (response.ok) {
        const { hasActiveSubscription } = await response.json()
        if (hasActiveSubscription) {
          setCurrentPlan('premium')
        }
      }
    }
    checkSubscription()
  }, [supabase.auth])

  const plans = [
    {
      id: 'free',
      name: locale === 'fr' ? 'Gratuit' : 'Free',
      price: '0',
      currency: locale === 'fr' ? '€' : '$',
      period: locale === 'fr' ? '/mois' : '/month',
      features: [
        locale === 'fr' ? "Jusqu'à 50 articles" : 'Up to 50 items',
        locale === 'fr' ? 'Support basique' : 'Basic support',
        locale === 'fr' ? 'Analyses basiques' : 'Basic analytics',
        locale === 'fr' ? 'Traitement standard' : 'Standard processing',
      ],
      buttonText: locale === 'fr' ? 'Plan Actuel' : 'Current Plan',
      current: currentPlan === 'free',
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '23.98',
      currency: '€',
      period: locale === 'fr' ? '/mois' : '/month',
      features: [
        locale === 'fr' ? 'Articles illimités' : 'Unlimited items',
        locale === 'fr' ? 'Support prioritaire' : 'Priority support',
        locale === 'fr' ? 'Analyses avancées' : 'Advanced analytics',
        locale === 'fr' ? 'Traitement prioritaire' : 'Priority processing',
      ],
      buttonText: currentPlan === 'premium' 
        ? (locale === 'fr' ? 'Gérer l\'abonnement' : 'Manage Subscription')
        : (locale === 'fr' ? 'Passer à Premium' : 'Upgrade to Premium'),
      current: currentPlan === 'premium',
      recommended: currentPlan === 'free',
    },
  ]

  const handleUpgrade = async () => {
    setIsLoading(true)
    try {
      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locale: locale,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      
      // Redirect to Stripe checkout
      window.location.href = url
    } catch (error) {
      console.error('Error creating checkout session:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la création de la session' : 'Error creating checkout session')
    } finally {
      setIsLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setIsManaging(true)
    try {
      // Create Stripe portal session
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to create portal session')
      }

      const { url } = await response.json()
      
      // Redirect to Stripe customer portal
      window.location.href = url
    } catch (error) {
      console.error('Error creating portal session:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de l\'accès au portail' : 'Error accessing customer portal')
    } finally {
      setIsManaging(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {plans.map((plan) => (
        <Card key={plan.id} className={plan.recommended ? 'border-primary shadow-lg' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              {plan.recommended && (
                <Badge className="bg-primary text-primary-foreground">
                  {locale === 'fr' ? 'Plus Populaire' : 'Most Popular'}
                </Badge>
              )}
            </div>
            <CardDescription className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-bold text-foreground">
                {plan.currency}{plan.price}
              </span>
              <span className="text-muted-foreground">{plan.period}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Button 
              className="w-full" 
              variant={plan.current && plan.id === 'free' ? 'secondary' : 'default'}
              disabled={(plan.current && plan.id === 'free') || isLoading || isManaging}
              onClick={() => {
                if (plan.id === 'premium' && currentPlan === 'premium') {
                  handleManageSubscription()
                } else if (plan.id === 'premium' && currentPlan === 'free') {
                  handleUpgrade()
                }
              }}
            >
              {plan.id === 'premium' && currentPlan === 'premium' && (
                <Settings className="w-4 h-4 mr-2" />
              )}
              {plan.buttonText}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}