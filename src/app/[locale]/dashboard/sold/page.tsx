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
      },
      // Legacy item_documents removed - use centralized documents table query
      item_attributes: {
        include: {
          field_definitions: true
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  })

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
    const primaryImage = itemImages.find(img => img.is_primary) || itemImages[0]
    
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
      item_purchases: item.item_purchases.map(purchase => ({
        ...purchase,
        purchase_price: purchase.purchase_price ? purchase.purchase_price.toNumber() : null
      })),
      item_sales: item.item_sales.map(sale => ({
        ...sale,
        sale_price: sale.sale_price ? sale.sale_price.toNumber() : null
      }))
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
      <SoldItemsPageClient items={items} categories={categories} />
    </div>
  )
}