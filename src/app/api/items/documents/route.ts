import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { deleteEntityDocument } from '@/lib/storage'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

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
      return NextResponse.json({ error: 'Item not found or access denied' }, { status: 404 })
    }

    // Get documents for this item using the centralized documents table
    const documents = await prisma.documents.findMany({
      where: {
        entity_type: 'item',
        entity_id: itemId,
        is_deleted: false
      },
      include: {
        document_type: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      itemId, 
      url, 
      filePath, 
      fileName, 
      fileSize, 
      mimeType, 
      title, 
      description,
      documentTypeId 
    } = body

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
      return NextResponse.json({ error: 'Item not found or access denied' }, { status: 404 })
    }

    // Get or create a default document type if not provided
    let finalDocumentTypeId = documentTypeId
    if (!finalDocumentTypeId) {
      let defaultDocumentType = await prisma.document_types.findFirst({
        where: { name: 'general' }
      })

      if (!defaultDocumentType) {
        defaultDocumentType = await prisma.document_types.create({
          data: {
            name: 'general',
            description: 'General documents'
          }
        })
      }
      finalDocumentTypeId = defaultDocumentType.id
    }

    // Save document metadata using the centralized documents table
    const document = await prisma.documents.create({
      data: {
        document_type_id: finalDocumentTypeId,
        entity_type: 'item',
        entity_id: itemId,
        title: title || fileName,
        original_name: fileName,
        file_name: fileName,
        file_path: filePath,
        file_size: fileSize ? BigInt(fileSize) : null,
        mime_type: mimeType,
        storage_provider: 'supabase',
        storage_url: url,
        description
      }
    })

    // Return document with document_type included
    const documentWithType = await prisma.documents.findUnique({
      where: { id: document.id },
      include: {
        document_type: true
      }
    })

    return NextResponse.json({ document: documentWithType })
  } catch (error) {
    console.error('Error saving document:', error)
    return NextResponse.json({ error: 'Failed to save document' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
    }

    // Verify the document belongs to an item owned by the user
    const document = await prisma.documents.findFirst({
      where: { 
        id: documentId,
        entity_type: 'item'
      }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Verify the item belongs to the user
    const item = await prisma.items.findFirst({
      where: { 
        id: document.entity_id,
        book: {
          user_id: user.id
        }
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete the document using the storage utility
    const deleteResult = await deleteEntityDocument(documentId)

    if (!deleteResult.success) {
      return NextResponse.json({ error: deleteResult.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}