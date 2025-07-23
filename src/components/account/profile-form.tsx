'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface ProfileFormProps {
  user: User
}

export function ProfileForm({ user }: ProfileFormProps) {
  const t = useTranslations('account')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: user.email || '',
    fullName: user.user_metadata?.full_name || '',
    phone: user.phone || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // TODO: Implement profile update API call
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      toast.success(t('profileUpdated'), {
        description: t('profileUpdatedDesc'),
      })
    } catch (error) {
      toast.error(t('error'), {
        description: t('profileUpdateError'),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">{t('email')}</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">{t('emailCannotChange')}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName">{t('fullName')}</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder={t('enterFullName')}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{t('phoneNumber')}</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder={t('enterPhoneNumber')}
            className="h-11"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="h-11">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('saveChanges')}
        </Button>
      </div>
    </form>
  )
}