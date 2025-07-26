import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get('bookId')

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all items for the book
    const items = await prisma.items.findMany({
      where: {
        book_id: bookId,
        book: {
          user_id: user.id
        }
      },
      include: {
        category: true,
        item_purchases: {
          include: {
            person: true
          }
        },
        item_sales: {
          include: {
            person: true
          }
        },
        item_incidents: {
          orderBy: {
            incident_date: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Create CSV headers
    const headers = [
      'Item Number',
      'Description', 
      'Category',
      'Color',
      'Grade',
      'Purchase Price (€)',
      'Purchase Date',
      'Seller',
      'Sale Price (€)',
      'Sale Date',
      'Buyer',
      'Status',
      'Last Incident',
      'Created At'
    ]

    // Create CSV rows
    const rows = items.map(item => {
      const purchase = item.item_purchases?.[0]
      const sale = item.item_sales?.[0]
      const incident = item.item_incidents?.[0]
      
      let status = 'Available'
      if (sale) status = 'Sold'
      else if (incident) status = 'Incident'

      return [
        item.item_number || '',
        item.description || '',
        item.category?.name || '',
        item.color || '',
        item.grade || '',
        purchase?.purchase_price ? purchase.purchase_price.toNumber().toFixed(2) : '',
        purchase?.purchase_date ? format(new Date(purchase.purchase_date), 'yyyy-MM-dd') : '',
        purchase?.person ? `${purchase.person.name} ${purchase.person.lastname || ''}`.trim() : '',
        sale?.sale_price ? sale.sale_price.toNumber().toFixed(2) : '',
        sale?.sale_date ? format(new Date(sale.sale_date), 'yyyy-MM-dd') : '',
        sale?.person ? `${sale.person.name} ${sale.person.lastname || ''}`.trim() : '',
        status,
        incident ? incident.incident_type || 'Incident reported' : '',
        format(new Date(item.created_at), 'yyyy-MM-dd HH:mm:ss')
      ]
    })

    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(field => 
          // Escape fields that contain commas or quotes
          typeof field === 'string' && (field.includes(',') || field.includes('"')) 
            ? `"${field.replace(/"/g, '""')}"` 
            : field
        ).join(',')
      )
    ].join('\n')

    // Create response with CSV content
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="police-registry-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

    return response

  } catch (error) {
    console.error('CSV export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}