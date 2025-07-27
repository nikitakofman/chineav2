import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { checkUserBooks, getSelectedBookId } from '@/app/actions/books'
import { redirect } from 'next/navigation'
import { ItemsPageClient } from '@/components/items/items-page-client'
import { Prisma } from '@prisma/client'

export default async function ItemsPage({
  searchParams
}: {
  searchParams: { page?: string; search?: string; category?: string }
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

  // Build where clause with filters
  const whereClause: Record<string, any> = {
    book_id: selectedBookId,
    item_sales: {
      none: {}
    }
  }

  if (searchParams.search) {
    whereClause.OR = [
      { item_number: { contains: searchParams.search, mode: 'insensitive' } },
      { description: { contains: searchParams.search, mode: 'insensitive' } }
    ]
  }

  if (searchParams.category) {
    whereClause.category_id = searchParams.category
  }

  // Get total count for pagination
  const totalItems = await prisma.items.count({ where: whereClause })
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

  // Fetch items for the selected book with pagination
  const itemsRaw = await prisma.items.findMany({
    where: whereClause,
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
    },
    orderBy: {
      created_at: 'desc'
    },
    skip,
    take: ITEMS_PER_PAGE
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
      <ItemsPageClient 
        items={items} 
        categories={categories} 
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
      />
    </div>
  )
}