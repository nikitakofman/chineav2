import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { 
  uploadImageToCentralized, 
  deleteImageFromCentralized, 
  getImagesForEntity 
} from '@/lib/storage'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { incidentId, url, filePath, fileName, fileSize, mimeType, title, altText } = body

    // Verify the incident belongs to the user's item
    const incident = await prisma.item_incidents.findFirst({
      where: {
        id: incidentId,
        items: {
          book: {
            user_id: user.id
          }
        }
      }
    })

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    // Get image type ID for 'incident'
    const imageType = await prisma.image_types.findUnique({
      where: { name: 'incident' }
    })

    if (!imageType) {
      return NextResponse.json({ error: 'Image type "incident" not configured' }, { status: 500 })
    }

    // Get the highest position for this incident's images
    const highestPositionImage = await prisma.images.findFirst({
      where: { 
        entity_type: 'incident',
        entity_id: incidentId,
        is_deleted: false
      },
      orderBy: { position: 'desc' },
      select: { position: true }
    })
    
    const nextPosition = (highestPositionImage?.position ?? -1) + 1

    const image = await prisma.images.create({
      data: {
        image_type_id: imageType.id,
        entity_type: 'incident',
        entity_id: incidentId,
        title: title || null,
        original_name: fileName,
        file_name: fileName,
        file_path: filePath,
        file_size: BigInt(fileSize || 0),
        mime_type: mimeType,
        storage_provider: 'supabase',
        storage_url: url,
        alt_text: altText || null,
        is_primary: false, // Incidents don't typically have primary images
        position: nextPosition
      }
    })

    return NextResponse.json({ 
      success: true, 
      image: {
        id: image.id,
        url: image.storage_url || url,
        file_path: image.file_path,
        file_name: image.file_name,
        original_name: image.original_name,
        file_size: Number(image.file_size),
        mime_type: image.mime_type,
        position: image.position,
        title: image.title,
        alt_text: image.alt_text,
        created_at: image.created_at,
        updated_at: image.updated_at
      }
    })
  } catch (error) {
    console.error('Error saving incident image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('imageId')

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 })
    }

    // Get the image with ownership verification
    const image = await prisma.images.findFirst({
      where: {
        id: imageId,
        entity_type: 'incident',
        is_deleted: false
      }
    })

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Verify ownership through the incident -> item -> book -> user relationship
    const incident = await prisma.item_incidents.findFirst({
      where: {
        id: image.entity_id,
        items: {
          book: {
            user_id: user.id
          }
        }
      }
    })

    if (!incident) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Use centralized delete function
    const deleteResult = await deleteImageFromCentralized(imageId)
    
    if (!deleteResult.success) {
      return NextResponse.json({ error: deleteResult.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting incident image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const incidentId = searchParams.get('incidentId')

    if (!incidentId) {
      return NextResponse.json({ error: 'Incident ID required' }, { status: 400 })
    }

    // Verify ownership
    const incident = await prisma.item_incidents.findFirst({
      where: {
        id: incidentId,
        items: {
          book: {
            user_id: user.id
          }
        }
      }
    })

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found or access denied' }, { status: 404 })
    }

    // Get images using centralized function
    const images = await getImagesForEntity('incident', incidentId)

    // Transform to match expected format
    const transformedImages = images.map(image => ({
      id: image.id,
      url: image.storage_url || image.file_path,
      file_path: image.file_path,
      file_name: image.file_name,
      original_name: image.original_name,
      file_size: Number(image.file_size || 0),
      mime_type: image.mime_type,
      position: image.position || 0,
      title: image.title,
      alt_text: image.alt_text,
      created_at: image.created_at,
      updated_at: image.updated_at
    }))

    return NextResponse.json({ success: true, images: transformedImages })
  } catch (error) {
    console.error('Error fetching incident images:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}