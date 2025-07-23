import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')

    if (name) {
      // Get specific document type by name
      const documentType = await prisma.document_types.findUnique({
        where: { name }
      })

      if (!documentType) {
        return NextResponse.json({ error: 'Document type not found' }, { status: 404 })
      }

      return NextResponse.json({ documentType })
    }

    // Get all document types
    const documentTypes = await prisma.document_types.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ documentTypes })
  } catch (error) {
    console.error('Error fetching document types:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const documentType = await prisma.document_types.create({
      data: {
        name,
        description: description || null
      }
    })

    return NextResponse.json({ documentType })
  } catch (error) {
    console.error('Error creating document type:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}