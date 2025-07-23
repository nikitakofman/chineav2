'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CreditCard, 
  Download, 
  Zap, 
  Check,
  X
} from 'lucide-react'

export function BillingSection() {
  const t = useTranslations('account')

  const currentPlan = {
    name: t('freePlan'),
    price: '$0',
    period: t('perMonth'),
    features: [
      { name: t('upTo100Items'), included: true },
      { name: t('basicReports'), included: true },
      { name: t('emailSupport'), included: true },
      { name: t('advancedAnalytics'), included: false },
      { name: t('prioritySupport'), included: false },
      { name: t('apiAccess'), included: false }
    ],
    usage: {
      items: { current: 45, limit: 100 },
      storage: { current: 1.2, limit: 5 }
    }
  }

  const plans = [
    {
      name: t('proPlan'),
      price: '$19',
      period: t('perMonth'),
      recommended: true,
      features: [
        t('unlimitedItems'),
        t('advancedReports'),
        t('prioritySupport'),
        t('apiAccess'),
        t('customExports')
      ]
    },
    {
      name: t('enterprisePlan'),
      price: '$49',
      period: t('perMonth'),
      features: [
        t('everythingInPro'),
        t('dedicatedSupport'),
        t('customIntegrations'),
        t('sla'),
        t('whiteLabel')
      ]
    }
  ]

  const invoices = [
    { id: 1, date: '2024-01-01', amount: '$0.00', status: 'paid' },
    { id: 2, date: '2023-12-01', amount: '$0.00', status: 'paid' },
    { id: 3, date: '2023-11-01', amount: '$0.00', status: 'paid' }
  ]

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>{t('currentPlan')}</CardTitle>
          <CardDescription>{t('manageBilling')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">{currentPlan.name}</h3>
              <p className="text-muted-foreground">
                <span className="text-3xl font-bold">{currentPlan.price}</span> {currentPlan.period}
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {t('active')}
            </Badge>
          </div>

          {/* Usage */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>{t('itemsUsage')}</span>
                <span className="font-medium">
                  {currentPlan.usage.items.current} / {currentPlan.usage.items.limit}
                </span>
              </div>
              <Progress 
                value={(currentPlan.usage.items.current / currentPlan.usage.items.limit) * 100} 
                className="h-2"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>{t('storageUsage')}</span>
                <span className="font-medium">
                  {currentPlan.usage.storage.current}GB / {currentPlan.usage.storage.limit}GB
                </span>
              </div>
              <Progress 
                value={(currentPlan.usage.storage.current / currentPlan.usage.storage.limit) * 100} 
                className="h-2"
              />
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2">
            {currentPlan.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                {feature.included ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={feature.included ? '' : 'text-muted-foreground'}>
                  {feature.name}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Plans */}
      <div className="grid gap-6 md:grid-cols-2">
        {plans.map((plan, index) => (
          <Card key={index} className={plan.recommended ? 'border-primary' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                {plan.recommended && (
                  <Badge className="bg-primary text-primary-foreground">
                    {t('recommended')}
                  </Badge>
                )}
              </div>
              <CardDescription>
                <span className="text-2xl font-bold text-foreground">{plan.price}</span> {plan.period}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant={plan.recommended ? 'default' : 'outline'}>
                <Zap className="mr-2 h-4 w-4" />
                {t('upgradeToPlan')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>{t('billingHistory')}</CardTitle>
          <CardDescription>{t('downloadInvoices')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('invoice')} #{invoice.id}</p>
                    <p className="text-sm text-muted-foreground">{invoice.date}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-medium">{invoice.amount}</span>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {t(invoice.status)}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}