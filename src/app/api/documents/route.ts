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
      documentTypeId,
      entityType, 
      entityId, 
      url, 
      filePath, 
      originalName,
      fileName, 
      fileSize, 
      mimeType,
      title,
      description,
      issuedBy,
      issuedDate,
      documentNumber,
      expiryDate
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
        
      case 'person':
        const person = await prisma.person.findFirst({
          where: {
            id: entityId,
            user_id: user.id
          }
        })
        hasAccess = !!person
        break
        
      default:
        return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Entity not found or access denied' }, { status: 404 })
    }

    const document = await prisma.documents.create({
      data: {
        document_type_id: documentTypeId,
        entity_type: entityType,
        entity_id: entityId,
        title: title || originalName,
        original_name: originalName,
        file_name: fileName,
        file_path: filePath,
        file_size: fileSize ? BigInt(fileSize) : null,
        mime_type: mimeType,
        storage_provider: 'supabase',
        storage_url: url,
        description: description || null,
        issued_by: issuedBy || null,
        issued_date: issuedDate ? new Date(issuedDate) : null,
        document_number: documentNumber || null,
        expiry_date: expiryDate ? new Date(expiryDate) : null
      }
    })

    // Convert BigInt to string for JSON serialization
    const serializedDocument = {
      ...document,
      file_size: document.file_size?.toString() || null
    }

    return NextResponse.json({ success: true, document: serializedDocument })
  } catch (error) {
    console.error('Error saving document:', error)
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
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
    }

    // Get the document with ownership verification
    const document = await prisma.documents.findFirst({
      where: {
        id: documentId,
        is_deleted: false
      }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Verify ownership based on entity type
    let hasAccess = false
    
    switch (document.entity_type) {
      case 'item':
        const item = await prisma.items.findFirst({
          where: {
            id: document.entity_id,
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
            id: document.entity_id,
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
        hasAccess = document.entity_id === user.id
        break
        
      case 'person':
        const person = await prisma.person.findFirst({
          where: {
            id: document.entity_id,
            user_id: user.id
          }
        })
        hasAccess = !!person
        break
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete from Supabase storage
    const deleteResult = await deleteFile(document.file_path)
    if (!deleteResult.success) {
      console.error('Failed to delete from storage:', deleteResult.error)
      // Continue with database deletion even if storage deletion fails
    }

    // Soft delete from database
    await prisma.documents.update({
      where: { id: documentId },
      data: { 
        is_deleted: true,
        deleted_at: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
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
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'Entity type and ID required' }, { status: 400 })
    }

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
        
      case 'person':
        const person = await prisma.person.findFirst({
          where: {
            id: entityId,
            user_id: user.id
          }
        })
        hasAccess = !!person
        break
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Entity not found or access denied' }, { status: 404 })
    }

    const documents = await prisma.documents.findMany({
      where: {
        entity_type: entityType,
        entity_id: entityId,
        is_deleted: false
      },
      include: {
        document_type: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Convert BigInt to string for JSON serialization
    const serializedDocuments = documents.map(doc => ({
      ...doc,
      file_size: doc.file_size?.toString() || null
    }))

    return NextResponse.json({ documents: serializedDocuments })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}