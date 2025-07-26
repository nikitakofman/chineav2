'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, CheckCheck, AlertCircle, Info, AlertTriangle, CheckCircle, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/app/actions/notifications'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useRouter, useParams } from 'next/navigation'

interface Notification {
  id: string
  message: string
  type: string | null
  user_read: boolean | null
  is_targeted: boolean
  created_at: Date | null
}

interface NotificationDropdownProps {
  unreadCount: number
  isActive?: boolean
}

export function NotificationDropdown({ unreadCount: initialUnreadCount, isActive = false }: NotificationDropdownProps) {
  const t = useTranslations()
  const router = useRouter()
  const params = useParams()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)

  useEffect(() => {
    if (open) {
      loadNotifications()
    }
  }, [open])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const data = await getUserNotifications()
      console.log('Loaded notifications:', data) // Debug log
      setNotifications(data)
      // Update unread count
      const unread = data.filter(n => !n.user_read).length
      setUnreadCount(unread)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, user_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead()
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, user_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const getNotificationIcon = (type: string | null) => {
    switch (type) {
      case 'OFFER':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'UPDATES':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'GENERAL':
      default:
        return <Info className="h-4 w-4 text-blue-500" />
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

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={isActive ? "default" : "ghost"} 
          size="icon" 
          className="relative"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-3">
          <h3 className="font-semibold">{t('notifications.title', 'Notifications')}</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto p-1 text-xs"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              {t('notifications.markAllRead', 'Mark all read')}
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              {t('notifications.loading', 'Loading...')}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {t('notifications.empty', 'No notifications')}
              </p>
            </div>
          ) : (
            <div className="py-2">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-3 group hover:bg-accent/10 focus:bg-accent/10 hover:text-foreground focus:text-foreground",
                    !notification.user_read && "bg-muted/50"
                  )}
                  onSelect={(e) => e.preventDefault()}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div 
                    className="flex-1 space-y-1 cursor-pointer"
                    onClick={() => !notification.user_read && handleMarkAsRead(notification.id)}
                  >
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
                    </div>
                    <p className="text-sm">{notification.message}</p>
                    {notification.created_at && (
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                  {!notification.user_read && (
                    <div className="flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1 hover:bg-accent"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkAsRead(notification.id)
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button 
                variant="ghost" 
                className="w-full justify-center text-sm"
                onClick={() => {
                  setOpen(false)
                  router.push(`/${params.locale}/dashboard/notifications`)
                }}
              >
                {t('notifications.viewAll', 'View all notifications')}
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}