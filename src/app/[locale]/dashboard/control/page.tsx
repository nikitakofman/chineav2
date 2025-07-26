import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { checkUserBooks, getSelectedBookId } from '@/app/actions/books'
import { redirect } from 'next/navigation'
import { ControlPageClient } from '@/components/control/control-page-client'

export default async function ControlPage() {
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

  // Get selected book ID
  const selectedBookId = await getSelectedBookId()
  
  if (!selectedBookId) {
    redirect('/books/setup')
  }

  // Fetch statistics for the selected book
  const [itemsCount, soldItemsCount, incidentsCount, itemsWithPrices] = await Promise.all([
    // Total items in book
    prisma.items.count({
      where: { book_id: selectedBookId }
    }),
    
    // Sold items
    prisma.items.count({
      where: {
        book_id: selectedBookId,
        item_sales: { some: {} }
      }
    }),
    
    // Items with incidents
    prisma.items.count({
      where: {
        book_id: selectedBookId,
        item_incidents: { some: {} }
      }
    }),
    
    // Items with purchase/sale prices for value calculation
    prisma.items.findMany({
      where: { book_id: selectedBookId },
      include: {
        item_purchases: {
          select: { purchase_price: true }
        },
        item_sales: {
          select: { sale_price: true },
          where: {
            sale_date: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }
      }
    })
  ])

  // Calculate total value and monthly revenue
  const totalValue = itemsWithPrices.reduce((total, item) => {
    const purchasePrice = item.item_purchases?.[0]?.purchase_price?.toNumber() || 0
    return total + purchasePrice
  }, 0)

  const monthlyRevenue = itemsWithPrices.reduce((total, item) => {
    const salePrice = item.item_sales?.[0]?.sale_price?.toNumber() || 0
    return total + salePrice
  }, 0)

  // Mock export history for now - in the future this could be from a real table
  const exportHistory = [
    {
      id: '1',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      type: 'registry' as const,
      recipient: 'police@example.com',
      itemCount: itemsCount
    }
  ]

  const stats = {
    totalItems: itemsCount,
    soldItems: soldItemsCount,
    incidentItems: incidentsCount,
    totalValue,
    monthlyRevenue,
    lastExport: exportHistory.length > 0 ? exportHistory[0].date : null,
    registryStatus: 'up-to-date' as const
  }

  return (
    <div className="p-4 md:p-6">
      <ControlPageClient 
        stats={stats}
        exportHistory={exportHistory}
        bookId={selectedBookId}
      />
    </div>
  )
}