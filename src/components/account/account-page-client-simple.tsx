'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Mail, 
  LogOut,
  Key,
  Calendar,
  Bell,
  AlertTriangle
} from 'lucide-react'
import { useRouter } from '@/i18n/routing'
import { ProfileForm } from './profile-form'
import { PasswordForm } from './password-form'
import { NotificationSettings } from './notification-settings'
import { DangerZone } from './danger-zone'
import { cn } from '@/lib/utils'

interface AccountPageClientProps {
  user: User
}

export function AccountPageClient({ user }: AccountPageClientProps) {
  const t = useTranslations('account')
  const router = useRouter()

  const handleSignOut = async () => {
    const response = await fetch('/api/auth/signout', {
      method: 'POST',
    })
    
    if (response.ok) {
      router.push('/connect')
    }
  }

  // Stats cards data
  const stats = [
    {
      title: t('memberSince'),
      value: new Date(user.created_at).toLocaleDateString(),
      icon: Calendar,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: t('emailStatus'),
      value: user.email_confirmed_at ? t('verified') : t('unverified'),
      icon: Mail,
      color: user.email_confirmed_at ? 'text-green-600' : 'text-orange-600',
      bg: user.email_confirmed_at ? 'bg-green-100 dark:bg-green-900/20' : 'bg-orange-100 dark:bg-orange-900/20'
    },
    {
      title: t('lastSignIn'),
      value: new Date(user.last_sign_in_at || user.created_at).toLocaleDateString(),
      icon: Key,
      color: 'text-purple-600',
      bg: 'bg-purple-100 dark:bg-purple-900/20'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('accountSettings')}</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">{t('manageYourAccount')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-lg font-semibold mt-1">{stat.value}</p>
                </div>
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", stat.bg)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('profileInformation')}</CardTitle>
          <CardDescription>{t('updateYourProfile')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm user={user} />
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>{t('changePassword')}</CardTitle>
          <CardDescription>{t('updateYourPassword')}</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>{t('notificationPreferences')}</CardTitle>
          <CardDescription>{t('manageNotifications')}</CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationSettings />
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <DangerZone onSignOut={handleSignOut} />
    </div>
  )
}