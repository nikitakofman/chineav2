import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { checkUserBooks, getSelectedBookId } from '@/app/actions/books'
import { redirect } from 'next/navigation'
import { SoldItemsPageClient } from '@/components/items/sold-items-page-client'

export default async function SoldItemsPage({
  searchParams
}: {
  searchParams: { page?: string; search?: string }
}) {
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

  // Pagination configuration
  const ITEMS_PER_PAGE = 50
  const page = Number(searchParams.page) || 1
  const skip = (page - 1) * ITEMS_PER_PAGE

  // Build where clause with search
  const whereClause: Record<string, any> = {
    book_id: selectedBookId
  }

  // Get total count
  const totalInvoices = await prisma.invoices.count({ where: whereClause })
  const totalPages = Math.ceil(totalInvoices / ITEMS_PER_PAGE)

  // Fetch invoices with their associated items (with pagination)
  const invoicesRaw = await prisma.invoices.findMany({
    where: whereClause,
    include: {
      client: true,
      item_sales: {
        include: {
          items: {
            include: {
              category: true,
              item_purchases: {
                include: {
                  person: true
                }
              },
              item_locations: {
                orderBy: {
                  created_at: 'desc'
                },
                take: 1
              },
              item_attributes: {
                include: {
                  field_definitions: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      invoice_date: 'desc'
    },
    skip,
    take: ITEMS_PER_PAGE
  })

  // Extract all items from invoices with serialized Decimal values
  const itemsRaw = invoicesRaw.flatMap(invoice => 
    invoice.item_sales.map(sale => ({
      ...sale.items!,
      item_sales: [{
        ...sale,
        sale_price: sale.sale_price ? sale.sale_price.toNumber() : null,
        invoice_id: invoice.id,
        person: invoice.client
      }],
      item_purchases: sale.items!.item_purchases.map(purchase => ({
        ...purchase,
        purchase_price: purchase.purchase_price ? purchase.purchase_price.toNumber() : null
      }))
    }))
  )

  // Get documents and images for all items using the centralized system
  const itemIds = itemsRaw.map(item => item.id)
  const documentsMap = new Map()
  const imagesMap = new Map()
  
  if (itemIds.length > 0) {
    // Get documents
    const documents = await prisma.documents.findMany({
      where: {
        entity_type: 'item',
        entity_id: { in: itemIds },
        is_deleted: false
      },
      include: {
        document_type: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Group documents by item ID
    documents.forEach(doc => {
      if (!documentsMap.has(doc.entity_id)) {
        documentsMap.set(doc.entity_id, [])
      }
      documentsMap.get(doc.entity_id).push(doc)
    })
    
    // Get images for all items
    const images = await prisma.images.findMany({
      where: {
        entity_type: 'item',
        entity_id: { in: itemIds },
        is_deleted: false
      },
      orderBy: [
        { is_primary: 'desc' },
        { position: 'asc' },
        { created_at: 'asc' }
      ]
    })

    // Group images by item ID
    images.forEach(img => {
      if (!imagesMap.has(img.entity_id)) {
        imagesMap.set(img.entity_id, [])
      }
      imagesMap.get(img.entity_id).push({
        id: img.id,
        storage_url: img.storage_url,
        original_name: img.original_name,
        file_name: img.file_name,
        file_size: img.file_size?.toString(),
        mime_type: img.mime_type,
        is_primary: img.is_primary,
        position: img.position,
        title: img.title,
        alt_text: img.alt_text,
        width: img.width,
        height: img.height
      })
    })
  }

  // Serialize Decimal values to numbers and add documents and images
  const items = itemsRaw.map(item => {
    const itemImages = imagesMap.get(item.id) || []
    
    // Find primary image: prioritize position 0, then is_primary flag, then first image
    const primaryImage = itemImages.find(img => img.position === 0) || 
                         itemImages.find(img => img.is_primary) || 
                         itemImages[0]
    
    return {
      ...item,
      documents: documentsMap.get(item.id) || [],
      images: itemImages,
      primaryImage: primaryImage ? {
        id: primaryImage.id,
        url: primaryImage.storage_url,
        alt_text: primaryImage.alt_text,
        title: primaryImage.title
      } : null,
      imageCount: itemImages.length,
      item_purchases: item.item_purchases,
      item_sales: item.item_sales
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

  // Group items by invoice
  const invoiceGroups = invoicesRaw.map(invoice => {
    const invoiceItems = invoice.item_sales.map(sale => {
      const item = items.find(i => i.id === sale.item_id)
      return item ? {
        ...item,
        sale_price: sale.sale_price ? sale.sale_price.toNumber() : null,
        sale_date: sale.sale_date,
        sale_location: sale.sale_location,
        payment_method: sale.payment_method,
        // Item purchases are already serialized
        item_purchases: item.item_purchases
      } : null
    }).filter(Boolean)

    return {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      invoice_date: invoice.invoice_date,
      total_amount: invoice.total_amount ? invoice.total_amount.toNumber() : 0,
      client: invoice.client,
      items: invoiceItems
    }
  }).filter(group => group.items.length > 0)

  return (
    <div className="p-4 md:p-6">
      <SoldItemsPageClient 
        items={items} 
        categories={categories} 
        invoiceGroups={invoiceGroups}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalInvoices}
      />
    </div>
  )
}