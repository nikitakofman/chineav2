'use server'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getUserNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const notifications = await prisma.notifications.findMany({
    where: {
      notification_user_id: user.id
    },
    orderBy: {
      created_at: 'desc'
    },
    take: 50 // Limit to last 50 notifications
  })

  return notifications
}

export async function getUnreadNotificationCount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return 0
  }

  const count = await prisma.notifications.count({
    where: {
      notification_user_id: user.id,
      user_read: false
    }
  })

  return count
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  await prisma.notifications.update({
    where: {
      id: notificationId,
      notification_user_id: user.id // Ensure user owns this notification
    },
    data: {
      user_read: true
    }
  })

  revalidatePath('/dashboard')
  return { success: true }
}

export async function markAllNotificationsAsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  await prisma.notifications.updateMany({
    where: {
      notification_user_id: user.id,
      user_read: false
    },
    data: {
      user_read: true
    }
  })

  revalidatePath('/dashboard')
  return { success: true }
}