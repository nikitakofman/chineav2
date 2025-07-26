'use server'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function getUsers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Admin check removed for dev mode - everyone can access

  const users = await prisma.users.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      created_at: true,
      updated_at: true,
      _count: {
        select: {
          book: true
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  })

  return users
}

export async function getNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const notifications = await prisma.notifications.findMany({
    include: {
      users: {
        select: {
          id: true,
          email: true,
          username: true
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  })

  return notifications
}

export async function createNotification(data: {
  message: string
  type: 'GENERAL' | 'OFFER' | 'UPDATES'
  targetUserId: string | null // null means send to all users
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // If targetUserId is null, create notifications for all users
  if (!data.targetUserId) {
    const allUsers = await prisma.users.findMany({
      select: { id: true }
    })

    const notifications = await prisma.notifications.createMany({
      data: allUsers.map(u => ({
        message: data.message,
        type: data.type,
        notification_user_id: u.id,
        user_read: false,
        is_targeted: false
      }))
    })

    return { success: true, count: notifications.count }
  } else {
    // Create notification for specific user
    const notification = await prisma.notifications.create({
      data: {
        message: data.message,
        type: data.type,
        notification_user_id: data.targetUserId,
        user_read: false,
        is_targeted: true
      }
    })

    return { success: true, notification }
  }
}

export async function searchUsers(query: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const users = await prisma.users.findMany({
    where: {
      OR: [
        { email: { contains: query, mode: 'insensitive' } },
        { username: { contains: query, mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      email: true,
      username: true
    },
    take: 10
  })

  return users
}