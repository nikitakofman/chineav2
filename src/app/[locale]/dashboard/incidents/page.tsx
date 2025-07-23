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
  const incidentsRaw = await prisma.item_incidents.findMany({
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

  // Get images for all incidents using the centralized system
  const incidentIds = incidentsRaw.map(incident => incident.id)
  const imagesMap = new Map()
  
  if (incidentIds.length > 0) {
    const images = await prisma.images.findMany({
      where: {
        entity_type: 'incident',
        entity_id: { in: incidentIds },
        is_deleted: false
      },
      orderBy: [
        { is_primary: 'desc' },
        { position: 'asc' },
        { created_at: 'asc' }
      ]
    })

    // Group images by incident ID
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

  // Add images to incidents
  const incidents = incidentsRaw.map(incident => {
    const incidentImages = imagesMap.get(incident.id) || []
    const primaryImage = incidentImages.find(img => img.is_primary) || incidentImages[0]
    
    return {
      ...incident,
      images: incidentImages,
      primaryImage: primaryImage ? {
        id: primaryImage.id,
        url: primaryImage.storage_url,
        alt_text: primaryImage.alt_text,
        title: primaryImage.title
      } : null,
      imageCount: incidentImages.length
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