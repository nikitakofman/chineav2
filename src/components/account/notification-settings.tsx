'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function NotificationSettings() {
  const t = useTranslations('account')
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    general: true,
    offers: false,
    updates: true
  })

  const handleSave = async () => {
    setLoading(true)

    try {
      // TODO: Implement notification settings API call
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      toast.success(t('notificationsUpdated'), {
        description: t('notificationsUpdatedDesc'),
      })
    } catch (error) {
      toast.error(t('error'), {
        description: t('notificationsUpdateError'),
      })
    } finally {
      setLoading(false)
    }
  }

  const notificationOptions = [
    {
      id: 'general',
      label: t('general'),
      description: t('generalDesc')
    },
    {
      id: 'offers',
      label: t('offers'),
      description: t('offersDesc')
    },
    {
      id: 'updates',
      label: t('updates'),
      description: t('updatesDesc')
    }
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {notificationOptions.map((option) => (
          <div key={option.id} className="flex items-start justify-between space-x-4 p-4 border rounded-lg">
            <div className="flex-1 space-y-1">
              <Label htmlFor={option.id} className="font-medium cursor-pointer">
                {option.label}
              </Label>
              <p className="text-sm text-muted-foreground">{option.description}</p>
            </div>
            <Switch
              id={option.id}
              checked={settings[option.id as keyof typeof settings]}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, [option.id]: checked }))
              }
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="h-11">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('savePreferences')}
        </Button>
      </div>
    </div>
  )
}