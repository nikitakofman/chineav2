import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { updateImagePositions } from '@/lib/storage'

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { itemId, imagePositions } = body
    

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

    // Verify all images belong to this item and are not deleted
    const existingImages = await prisma.images.findMany({
      where: {
        id: { in: imagePositions.map((ip: any) => ip.imageId) },
        entity_type: 'item',
        entity_id: itemId,
        is_deleted: false
      }
    })

    if (existingImages.length !== imagePositions.length) {
      return NextResponse.json({ error: 'Some images not found or access denied' }, { status: 400 })
    }

    // Use centralized reorder function
    const updateResult = await updateImagePositions(imagePositions)
    
    if (!updateResult.success) {
      return NextResponse.json({ error: updateResult.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering images:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}