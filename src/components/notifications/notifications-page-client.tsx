'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, Calendar, Check, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/app/actions/notifications'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Notification {
  id: string
  message: string
  type: string | null
  user_read: boolean | null
  is_targeted: boolean
  created_at: Date | null
}

interface NotificationsPageClientProps {
  notifications: Notification[]
}

export function NotificationsPageClient({ notifications: initialNotifications }: NotificationsPageClientProps) {
  const t = useTranslations()
  const router = useRouter()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [loading, setLoading] = useState(false)

  const unreadNotifications = notifications.filter(n => !n.user_read)
  const readNotifications = notifications.filter(n => n.user_read)

  const getNotificationIcon = (type: string | null) => {
    switch (type) {
      case 'OFFER':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'UPDATES':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'GENERAL':
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getNotificationBadgeVariant = (type: string | null) => {
    switch (type) {
      case 'OFFER':
        return 'secondary'
      case 'UPDATES':
        return 'default'
      default:
        return 'outline'
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, user_read: true } : n)
      )
      router.refresh()
    } catch (error) {
      toast.error('Failed to mark notification as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    setLoading(true)
    try {
      await markAllNotificationsAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, user_read: true })))
      router.refresh()
      toast.success('All notifications marked as read')
    } catch (error) {
      toast.error('Failed to mark all notifications as read')
    } finally {
      setLoading(false)
    }
  }

  const NotificationItem = ({ notification }: { notification: Notification }) => (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-lg border transition-colors",
        !notification.user_read && "bg-muted/50"
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Badge 
            variant={getNotificationBadgeVariant(notification.type)}
            className="text-xs"
          >
            {t(`notifications.types.${(notification.type || 'GENERAL').toLowerCase()}`, notification.type || 'GENERAL')}
          </Badge>
          {!notification.user_read && (
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
          )}
          {notification.is_targeted && (
            <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
              <User className="h-3 w-3 mr-1" />
              {t('notifications.targeted', 'Targeted')}
            </Badge>
          )}
          {notification.created_at && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </span>
          )}
        </div>
        <p className="text-sm">{notification.message}</p>
      </div>
      {!notification.user_read && (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-2"
          onClick={() => handleMarkAsRead(notification.id)}
        >
          <Check className="h-4 w-4" />
        </Button>
      )}
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('notifications.allNotifications', 'All Notifications')}
            </CardTitle>
            <CardDescription>
              {t('notifications.description', 'Manage and view all your notifications')}
            </CardDescription>
          </div>
          {unreadNotifications.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={loading}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              {t('notifications.markAllRead', 'Mark all read')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">
              {t('notifications.all', 'All')} ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              {t('notifications.unread', 'Unread')} ({unreadNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="read">
              {t('notifications.read', 'Read')} ({readNotifications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {t('notifications.empty', 'No notifications')}
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="unread" className="space-y-4">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-2">
                {unreadNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {t('notifications.noUnread', 'No unread notifications')}
                    </p>
                  </div>
                ) : (
                  unreadNotifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="read" className="space-y-4">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-2">
                {readNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {t('notifications.noRead', 'No read notifications')}
                    </p>
                  </div>
                ) : (
                  readNotifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}