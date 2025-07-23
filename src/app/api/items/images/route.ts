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
    const { itemId, url, filePath, fileName, fileSize, mimeType, isPrimary, title, altText } = body

    // Verify the item belongs to the user
    const item = await prisma.items.findFirst({
      where: {
        id: itemId,
        book: {
          user_id: user.id
        }
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Note: This endpoint is for saving already uploaded images to the database
    // For new uploads, use the centralized upload function in the frontend
    
    // Get image type ID for 'item'
    const imageType = await prisma.image_types.findUnique({
      where: { name: 'item' }
    })

    if (!imageType) {
      return NextResponse.json({ error: 'Image type "item" not configured' }, { status: 500 })
    }

    // Get the highest position for this item's images
    const highestPositionImage = await prisma.images.findFirst({
      where: { 
        entity_type: 'item',
        entity_id: itemId,
        is_deleted: false
      },
      orderBy: { position: 'desc' },
      select: { position: true }
    })
    
    const nextPosition = (highestPositionImage?.position ?? -1) + 1

    // If this is being set as primary, unset any existing primary image
    if (isPrimary) {
      await prisma.images.updateMany({
        where: {
          entity_type: 'item',
          entity_id: itemId,
          is_primary: true,
          is_deleted: false
        },
        data: {
          is_primary: false
        }
      })
    }

    const image = await prisma.images.create({
      data: {
        image_type_id: imageType.id,
        entity_type: 'item',
        entity_id: itemId,
        title: title || null,
        original_name: fileName,
        file_name: fileName,
        file_path: filePath,
        file_size: BigInt(fileSize || 0),
        mime_type: mimeType,
        storage_provider: 'supabase',
        storage_url: url,
        alt_text: altText || null,
        is_primary: isPrimary || false,
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
        is_primary: image.is_primary,
        position: image.position
      }
    })
  } catch (error) {
    console.error('Error saving image:', error)
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
        entity_type: 'item',
        is_deleted: false
      },
      include: {
        // We need to verify ownership through the item -> book -> user relationship
        // Since we can't do this directly with polymorphic relationships,
        // we'll need to fetch the item separately
      }
    })

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Verify ownership through the item
    const item = await prisma.items.findFirst({
      where: {
        id: image.entity_id,
        book: {
          user_id: user.id
        }
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Use centralized delete function
    const deleteResult = await deleteImageFromCentralized(imageId)
    
    if (!deleteResult.success) {
      return NextResponse.json({ error: deleteResult.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting image:', error)
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
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 })
    }

    // Verify ownership
    const item = await prisma.items.findFirst({
      where: {
        id: itemId,
        book: {
          user_id: user.id
        }
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found or access denied' }, { status: 404 })
    }

    // Get images using centralized function
    const images = await getImagesForEntity('item', itemId)

    // Transform to match expected format
    const transformedImages = images.map(image => ({
      id: image.id,
      url: image.storage_url || image.file_path,
      file_path: image.file_path,
      file_name: image.file_name,
      original_name: image.original_name,
      file_size: Number(image.file_size || 0),
      mime_type: image.mime_type,
      is_primary: image.is_primary,
      position: image.position || 0,
      title: image.title,
      alt_text: image.alt_text,
      created_at: image.created_at,
      updated_at: image.updated_at
    }))

    return NextResponse.json({ success: true, images: transformedImages })
  } catch (error) {
    console.error('Error fetching images:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}