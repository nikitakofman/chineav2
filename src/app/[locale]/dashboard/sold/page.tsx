import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { checkUserBooks, getSelectedBookId } from '@/app/actions/books'
import { redirect } from 'next/navigation'
import { SoldItemsPageClient } from '@/components/items/sold-items-page-client'

export default async function SoldItemsPage() {
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

  // Fetch items for the selected book (only sold items - have sales)
  const itemsRaw = await prisma.items.findMany({
    where: {
      book_id: selectedBookId,
      item_sales: {
        some: {}
      }
    },
    include: {
      category: true,
      item_purchases: {
        include: {
          person: true
        }
      },
      item_sales: {
        include: {
          person: true
        },
        orderBy: {
          sale_date: 'desc'
        }
      },
      item_locations: {
        orderBy: {
          created_at: 'desc'
        },
        take: 1
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  })

  // Serialize Decimal values to numbers
  const items = itemsRaw.map(item => ({
    ...item,
    item_purchases: item.item_purchases.map(purchase => ({
      ...purchase,
      purchase_price: purchase.purchase_price ? purchase.purchase_price.toNumber() : null
    })),
    item_sales: item.item_sales.map(sale => ({
      ...sale,
      sale_price: sale.sale_price ? sale.sale_price.toNumber() : null
    }))
  }))

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
      <SoldItemsPageClient items={items} categories={categories} />
    </div>
  )
}