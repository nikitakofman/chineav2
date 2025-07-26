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

    const { id: invoiceId } = await params

    // First verify the invoice belongs to the user
    const invoice = await prisma.invoices.findFirst({
      where: {
        id: invoiceId,
        user_id: user.id
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Fetch all items that belong to this invoice
    const invoiceItems = await prisma.item_sales.findMany({
      where: {
        invoice_id: invoiceId
      },
      include: {
        items: {
          include: {
            category: true,
            item_images: {
              where: {
                is_primary: true
              },
              take: 1
            }
          }
        }
      }
    })

    // Transform the data to match the expected format
    const formattedItems = invoiceItems.map(sale => ({
      id: sale.items?.id,
      item_number: sale.items?.item_number,
      description: sale.items?.description,
      category: sale.items?.category,
      color: sale.items?.color,
      grade: sale.items?.grade,
      sale_price: sale.sale_price ? Number(sale.sale_price) : null,
      sale_date: sale.sale_date,
      sale_location: sale.sale_location,
      payment_method: sale.payment_method,
      primaryImage: sale.items?.item_images?.[0] ? {
        url: sale.items.item_images[0].url,
        alt_text: sale.items.item_images[0].file_name
      } : null,
      images: sale.items?.item_images || []
    }))

    return NextResponse.json(formattedItems)
  } catch (error) {
    console.error('Error fetching invoice items:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}