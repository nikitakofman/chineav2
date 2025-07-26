import { getTranslations } from 'next-intl/server'
import { NotificationsPageClient } from '@/components/notifications/notifications-page-client'
import { getUserNotifications } from '@/app/actions/notifications'

export default async function NotificationsPage() {
  const t = await getTranslations()
  const notifications = await getUserNotifications()

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t('notifications.title', 'Notifications')}</h2>
      </div>
      <NotificationsPageClient notifications={notifications} />
    </div>
  )
}