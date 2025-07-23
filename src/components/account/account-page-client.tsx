'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  CreditCard, 
  Bell, 
  Palette,
  LogOut,
  Key,
  Globe,
  Moon,
  Sun,
  Monitor,
  ChevronRight,
  Check,
  AlertCircle,
  Calendar
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRouter } from '@/i18n/routing'
import { ProfileForm } from './profile-form'
import { PasswordForm } from './password-form'
import { NotificationSettings } from './notification-settings'
import { BillingSection } from './billing-section'
import { DangerZone } from './danger-zone'
import { cn } from '@/lib/utils'

interface AccountPageClientProps {
  user: User
}

export function AccountPageClient({ user }: AccountPageClientProps) {
  const t = useTranslations('account')
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('profile')

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
      title: t('accountType'),
      value: t('freeAccount'),
      icon: CreditCard,
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900/20'
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

  const themeOptions = [
    { value: 'light', label: t('lightTheme'), icon: Sun },
    { value: 'dark', label: t('darkTheme'), icon: Moon },
    { value: 'system', label: t('systemTheme'), icon: Monitor }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('accountSettings')}</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">{t('manageYourAccount')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 lg:grid-cols-5 h-auto p-1">
          <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <UserIcon className="w-4 h-4 mr-2" />
            {t('profile')}
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Shield className="w-4 h-4 mr-2" />
            {t('security')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Bell className="w-4 h-4 mr-2" />
            {t('notifications')}
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <CreditCard className="w-4 h-4 mr-2" />
            {t('billing')}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Palette className="w-4 h-4 mr-2" />
            {t('preferences')}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('profileInformation')}</CardTitle>
              <CardDescription>{t('updateYourProfile')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm user={user} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('changePassword')}</CardTitle>
              <CardDescription>{t('updateYourPassword')}</CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('activeSessions')}</CardTitle>
              <CardDescription>{t('manageYourSessions')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Monitor className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{t('currentSession')}</p>
                      <p className="text-sm text-muted-foreground">{t('thisDevice')}</p>
                    </div>
                  </div>
                  <Badge variant="default">{t('active')}</Badge>
                </div>
                <Button variant="outline" className="w-full">
                  {t('signOutAllDevices')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('notificationPreferences')}</CardTitle>
              <CardDescription>{t('manageNotifications')}</CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationSettings />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <BillingSection />
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('appearance')}</CardTitle>
              <CardDescription>{t('customizeAppearance')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-3 block">{t('theme')}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {themeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setTheme(option.value)}
                        className={cn(
                          "flex items-center justify-center space-x-2 p-4 rounded-lg border-2 transition-colors",
                          theme === option.value 
                            ? "border-primary bg-primary/10" 
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <option.icon className="h-5 w-5" />
                        <span className="font-medium">{option.label}</span>
                        {theme === option.value && (
                          <Check className="h-4 w-4 text-primary ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('language')}</CardTitle>
              <CardDescription>{t('chooseYourLanguage')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('currentLanguage')}</p>
                    <p className="text-sm text-muted-foreground">{t('changeInHeader')}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Danger Zone */}
      <DangerZone onSignOut={handleSignOut} />
    </div>
  )
}