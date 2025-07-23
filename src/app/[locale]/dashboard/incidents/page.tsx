import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { checkUserBooks, getSelectedBookId } from '@/app/actions/books'
import { redirect } from 'next/navigation'
import { IncidentsPageClient } from '@/components/items/incidents-page-client'

export default async function IncidentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Check if user has any books
  const books = await checkUserBooks()
  if (books.length === 0) {
    redirect('/books/setup')
  }

  // Get selected book ID from cookie or use first book
  const selectedBookId = await getSelectedBookId()
  
  if (!selectedBookId) {
    redirect('/books/setup')
  }

  // Fetch incidents for items in the selected book
  const incidents = await prisma.item_incidents.findMany({
    where: {
      items: {
        book_id: selectedBookId
      }
    },
    include: {
      items: {
        include: {
          category: true
        }
      }
    },
    orderBy: {
      incident_date: 'desc'
    }
  })

  // Get categories for filters
  const categories = await prisma.category.findMany({
    where: {
      user_id: user.id
    },
    orderBy: {
      name: 'asc'
    }
  })

  return (
    <div className="p-4 md:p-6">
      <IncidentsPageClient incidents={incidents} categories={categories} />
    </div>
  )
}