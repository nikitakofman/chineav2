'use server'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

async function ensureUserExists(authUserId: string, email: string) {
  // Check if user exists in users table
  let dbUser = await prisma.users.findUnique({
    where: { id: authUserId }
  })

  // If not, create the user
  if (!dbUser) {
    dbUser = await prisma.users.create({
      data: {
        id: authUserId,
        email: email,
        username: email.split('@')[0], // Use email prefix as username
        pass: 'supabase_auth' // Placeholder since we're using Supabase Auth
      }
    })
  }

  return dbUser
}

export async function checkUserBooks() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/connect')
  }

  // Ensure user exists in users table
  await ensureUserExists(user.id, user.email!)

  const books = await prisma.book.findMany({
    where: {
      user_id: user.id
    },
    include: {
      book_type: true
    },
    orderBy: {
      created_at: 'desc'
    }
  })

  return books
}

export async function getSelectedBookId() {
  const cookieStore = await cookies()
  const selectedBookId = cookieStore.get('selectedBookId')?.value
  
  if (selectedBookId) {
    return selectedBookId
  }
  
  // If no selected book in cookie, get the first book
  const books = await checkUserBooks()
  return books.length > 0 ? books[0].id : null
}

export async function setSelectedBookId(bookId: string) {
  const cookieStore = await cookies()
  cookieStore.set('selectedBookId', bookId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  })
}

export async function createBook(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return { error: 'Not authenticated' }
  }

  // Ensure user exists in users table
  await ensureUserExists(user.id, user.email)

  const bookTypeId = formData.get('bookTypeId') as string
  const description = formData.get('description') as string
  const reference = formData.get('reference') as string

  try {
    const book = await prisma.book.create({
      data: {
        user_id: user.id,
        book_type_id: bookTypeId,
        description,
        reference
      },
      include: {
        book_type: true
      }
    })

    return { book }
  } catch (error) {
    console.error('Failed to create book:', error)
    return { error: 'Failed to create book' }
  }
}

export async function getBookTypes() {
  const bookTypes = await prisma.book_type.findMany({
    orderBy: {
      display_name: 'asc'
    }
  })

  return bookTypes
}