import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: personId } = await params

    // Fetch person with all related data including invoices
    const person = await prisma.person.findFirst({
      where: {
        id: personId,
        user_id: user.id // Ensure person belongs to the authenticated user
      },
      include: {
        person_type: true,
        invoices: {
          select: {
            id: true,
            invoice_number: true,
            invoice_date: true,
            total_amount: true,
            status: true
          },
          orderBy: {
            invoice_date: 'desc'
          }
        },
        _count: {
          select: {
            item_purchases: true,
            item_sales: true,
            invoices: true
          }
        }
      }
    })

    if (!person) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 })
    }

    // Convert Decimal objects to numbers for client compatibility
    const serializedPerson = {
      ...person,
      invoices: person.invoices?.map(invoice => ({
        ...invoice,
        total_amount: Number(invoice.total_amount)
      }))
    }

    return NextResponse.json(serializedPerson)
  } catch (error) {
    console.error('Error fetching person:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: personId } = await params

    // Check if person exists and belongs to the user
    const person = await prisma.person.findFirst({
      where: {
        id: personId,
        user_id: user.id
      },
      include: {
        _count: {
          select: {
            item_purchases: true,
            item_sales: true,
            invoices: true
          }
        }
      }
    })

    if (!person) {
      return NextResponse.json(
        { error: 'Person not found' },
        { status: 404 }
      )
    }

    // Check if person has transactions (cannot delete if they do)
    const hasTransactions = person._count.item_purchases > 0 || person._count.item_sales > 0 || person._count.invoices > 0

    if (hasTransactions) {
      return NextResponse.json(
        { error: 'Cannot delete person with existing transactions' },
        { status: 400 }
      )
    }

    // Delete the person
    await prisma.person.delete({
      where: {
        id: personId
      }
    })

    return NextResponse.json(
      { message: 'Person deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error deleting person:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}