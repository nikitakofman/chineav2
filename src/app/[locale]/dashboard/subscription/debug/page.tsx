'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function SubscriptionDebugPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testCreateSubscription = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/subscription/test-create', {
        method: 'POST',
      })
      const data = await response.json()
      setResult(data)
      
      if (response.ok) {
        toast.success('Subscription created/updated in database!')
      } else {
        toast.error(data.error || 'Failed to create subscription')
      }
    } catch (error) {
      toast.error('Error calling API')
      setResult({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  const checkWebhookEndpoint = () => {
    const webhookUrl = `${window.location.origin}/api/stripe/webhook`
    navigator.clipboard.writeText(webhookUrl)
    toast.success('Webhook URL copied to clipboard!')
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription Debug</h1>
        <p className="text-muted-foreground">Debug tools for subscription setup</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Webhook Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Make sure you have configured the webhook in Stripe Dashboard:
          </p>
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="font-mono text-sm">{`${typeof window !== 'undefined' ? window.location.origin : ''}/api/stripe/webhook`}</p>
            <Button onClick={checkWebhookEndpoint} size="sm">
              Copy Webhook URL
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Events to configure: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Manual Subscription Sync</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            If you have already subscribed but the database is empty, click below to sync:
          </p>
          <Button onClick={testCreateSubscription} disabled={loading}>
            {loading ? 'Syncing...' : 'Sync Subscription from Stripe'}
          </Button>
          
          {result && (
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>✅ STRIPE_SECRET_KEY: {process.env.STRIPE_SECRET_KEY ? 'Set' : '❌ Missing'}</p>
            <p>✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Set' : '❌ Missing'}</p>
            <p>⚠️ STRIPE_WEBHOOK_SECRET: {process.env.STRIPE_WEBHOOK_SECRET === 'whsec_placeholder' ? '❌ Using placeholder!' : 'Set'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}