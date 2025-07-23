import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { deleteFile } from '@/lib/storage'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      imageTypeId,
      entityType, 
      entityId, 
      url, 
      filePath, 
      originalName,
      fileName, 
      fileSize, 
      mimeType, 
      width,
      height,
      altText,
      isPrimary,
      position,
      title 
    } = body

    // Verify entity ownership based on entity type
    let hasAccess = false
    
    switch (entityType) {
      case 'item':
        const item = await prisma.items.findFirst({
          where: {
            id: entityId,
            book: {
              user_id: user.id
            }
          }
        })
        hasAccess = !!item
        break
        
      case 'incident':
        const incident = await prisma.item_incidents.findFirst({
          where: {
            id: entityId,
            items: {
              book: {
                user_id: user.id
              }
            }
          }
        })
        hasAccess = !!incident
        break
        
      case 'user':
        hasAccess = entityId === user.id
        break
        
      default:
        return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Entity not found or access denied' }, { status: 404 })
    }

    // If this is being set as primary, unset any existing primary image for this entity
    if (isPrimary) {
      await prisma.images.updateMany({
        where: {
          entity_type: entityType,
          entity_id: entityId,
          is_primary: true,
          is_deleted: false
        },
        data: {
          is_primary: false
        }
      })
    }

    // Get the highest position for this entity's images if position not provided
    let imagePosition = position
    if (imagePosition === undefined || imagePosition === null) {
      const highestPositionImage = await prisma.images.findFirst({
        where: { 
          entity_type: entityType,
          entity_id: entityId,
          is_deleted: false
        },
        orderBy: { position: 'desc' },
        select: { position: true }
      })
      
      imagePosition = (highestPositionImage?.position ?? -1) + 1
    }

    const image = await prisma.images.create({
      data: {
        image_type_id: imageTypeId,
        entity_type: entityType,
        entity_id: entityId,
        title: title || null,
        original_name: originalName,
        file_name: fileName,
        file_path: filePath,
        file_size: fileSize ? BigInt(fileSize) : null,
        mime_type: mimeType,
        storage_provider: 'supabase',
        storage_url: url,
        width: width || null,
        height: height || null,
        alt_text: altText || null,
        is_primary: isPrimary || false,
        position: imagePosition
      }
    })

    // Convert BigInt to string for JSON serialization
    const serializedImage = {
      ...image,
      file_size: image.file_size?.toString() || null
    }

    return NextResponse.json({ success: true, image: serializedImage })
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
        is_deleted: false
      }
    })

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Verify ownership based on entity type
    let hasAccess = false
    
    switch (image.entity_type) {
      case 'item':
        const item = await prisma.items.findFirst({
          where: {
            id: image.entity_id,
            book: {
              user_id: user.id
            }
          }
        })
        hasAccess = !!item
        break
        
      case 'incident':
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
        hasAccess = !!incident
        break
        
      case 'user':
        hasAccess = image.entity_id === user.id
        break
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete from Supabase storage
    const deleteResult = await deleteFile(image.file_path)
    if (!deleteResult.success) {
      console.error('Failed to delete from storage:', deleteResult.error)
      // Continue with database deletion even if storage deletion fails
    }

    // Soft delete from database
    await prisma.images.update({
      where: { id: imageId },
      data: { 
        is_deleted: true,
        deleted_at: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { imageId, imagePositions, setPrimary, entityType, entityId } = body

    // Handle setting image as primary
    if (setPrimary && imageId && entityType && entityId) {
      // First, verify ownership of the image
      const image = await prisma.images.findFirst({
        where: {
          id: imageId,
          entity_type: entityType,
          entity_id: entityId,
          is_deleted: false
        }
      })

      if (!image) {
        return NextResponse.json({ error: 'Image not found' }, { status: 404 })
      }

      // Verify ownership based on entity type
      let hasAccess = false
      
      switch (entityType) {
        case 'item':
          const item = await prisma.items.findFirst({
            where: {
              id: entityId,
              book: {
                user_id: user.id
              }
            }
          })
          hasAccess = !!item
          break
          
        case 'incident':
          const incident = await prisma.item_incidents.findFirst({
            where: {
              id: entityId,
              items: {
                book: {
                  user_id: user.id
                }
              }
            }
          })
          hasAccess = !!incident
          break
          
        case 'user':
          hasAccess = entityId === user.id
          break
      }

      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      // Unset any existing primary image for this entity
      await prisma.images.updateMany({
        where: {
          entity_type: entityType,
          entity_id: entityId,
          is_primary: true,
          is_deleted: false
        },
        data: {
          is_primary: false
        }
      })

      // Set the new primary image
      await prisma.images.update({
        where: { id: imageId },
        data: { is_primary: true }
      })

      return NextResponse.json({ success: true })
    }

    if (imagePositions) {
      // Handle image reordering
      for (const { imageId: imgId, position } of imagePositions) {
        // Verify ownership before updating
        const image = await prisma.images.findFirst({
          where: {
            id: imgId,
            is_deleted: false
          }
        })

        if (!image) continue

        // Verify ownership based on entity type
        let hasAccess = false
        
        switch (image.entity_type) {
          case 'item':
            const item = await prisma.items.findFirst({
              where: {
                id: image.entity_id,
                book: {
                  user_id: user.id
                }
              }
            })
            hasAccess = !!item
            break
            
          case 'incident':
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
            hasAccess = !!incident
            break
            
          case 'user':
            hasAccess = image.entity_id === user.id
            break
        }

        if (hasAccess) {
          await prisma.images.update({
            where: { id: imgId },
            data: { position }
          })
        }
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'No valid operation specified' }, { status: 400 })
  } catch (error) {
    console.error('Error updating image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}