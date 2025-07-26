'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Bell, Send, Search, Users, User, Calendar, Check, X } from 'lucide-react'
import { createNotification, searchUsers } from '@/app/actions/admin'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Notification {
  id: string
  message: string
  type: string | null
  notification_user_id: string | null
  user_read: boolean | null
  created_at: Date | null
  updated_at: Date | null
  users: {
    id: string
    email: string
    username: string
  } | null
}

interface NotificationsManagementProps {
  notifications: Notification[]
}

export function NotificationsManagement({ notifications }: NotificationsManagementProps) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [type, setType] = useState('GENERAL')
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ id: string; email: string; username: string }>>([])
  const [selectedUser, setSelectedUser] = useState<{ id: string; email: string; username: string } | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const results = await searchUsers(searchQuery)
      setSearchResults(results)
    } catch (error) {
      toast.error('Failed to search users')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSendNotification = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }

    if (targetType === 'specific' && !selectedUser) {
      toast.error('Please select a user')
      return
    }

    setIsSending(true)
    try {
      const result = await createNotification({
        message: message.trim(),
        type,
        targetUserId: targetType === 'all' ? null : selectedUser?.id || null
      })

      if (result.success) {
        toast.success(
          targetType === 'all' 
            ? `Notification sent to ${result.count} users` 
            : 'Notification sent successfully'
        )
        
        // Reset form
        setMessage('')
        setType('GENERAL')
        setTargetType('all')
        setSearchQuery('')
        setSearchResults([])
        setSelectedUser(null)
        
        // Refresh the page to show new notification
        router.refresh()
      }
    } catch (error) {
      toast.error('Failed to send notification')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Create Notification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Create Notification
          </CardTitle>
          <CardDescription>Send notifications to all users or specific users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter notification message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GENERAL">General</SelectItem>
                <SelectItem value="OFFER">Offer</SelectItem>
                <SelectItem value="UPDATES">Updates</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target */}
          <div className="space-y-4">
            <Label>Target</Label>
            <RadioGroup value={targetType} onValueChange={(value: 'all' | 'specific') => setTargetType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="font-normal cursor-pointer flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Send to all users
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specific" id="specific" />
                <Label htmlFor="specific" className="font-normal cursor-pointer flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Send to specific user
                </Label>
              </div>
            </RadioGroup>

            {/* User Search */}
            {targetType === 'specific' && (
              <div className="space-y-4 pt-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by email or username..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10"
                    />
                  </div>
                  <Button 
                    onClick={handleSearch} 
                    disabled={isSearching}
                    variant="secondary"
                  >
                    Search
                  </Button>
                </div>

                {/* Selected User */}
                {selectedUser && (
                  <div className="p-3 border rounded-lg bg-primary/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{selectedUser.username}</p>
                        <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedUser(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Search Results */}
                {searchResults.length > 0 && !selectedUser && (
                  <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="p-3 hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedUser(user)
                          setSearchResults([])
                        }}
                      >
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Send Button */}
          <Button 
            onClick={handleSendNotification} 
            disabled={isSending || !message.trim() || (targetType === 'specific' && !selectedUser)}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSending ? 'Sending...' : 'Send Notification'}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>View recently sent notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.slice(0, 10).map((notification) => (
              <div key={notification.id} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      notification.type === 'OFFER' ? 'secondary' :
                      notification.type === 'UPDATES' ? 'default' :
                      'outline'
                    }>
                      {notification.type || 'GENERAL'}
                    </Badge>
                    {notification.users ? (
                      <span className="text-sm text-muted-foreground">
                        to {notification.users.username} ({notification.users.email})
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        to all users
                      </span>
                    )}
                  </div>
                  <p className="text-sm">{notification.message}</p>
                  {notification.created_at && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(notification.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  )}
                </div>
                <div className="flex items-center">
                  {notification.user_read ? (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Read
                    </Badge>
                  ) : (
                    <Badge variant="outline">Unread</Badge>
                  )}
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">
                No notifications sent yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}