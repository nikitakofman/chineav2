import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import jsPDF from 'jspdf'
import { Decimal } from '@prisma/client/runtime/library'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { saleId, invoiceId } = await request.json()

    let invoice
    let items: any[] = []
    let client

    if (invoiceId) {
      // Get invoice with all related data
      invoice = await prisma.invoices.findUnique({
        where: { id: invoiceId },
        include: {
          client: true,
          item_sales: {
            include: {
              items: {
                include: {
                  category: true,
                  item_purchases: {
                    orderBy: { purchase_date: 'desc' },
                    take: 1,
                  },
                  item_attributes: {
                    include: {
                      field_definitions: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      }

      items = invoice.item_sales.map(sale => sale.items).filter(Boolean)
      client = invoice.client
    } else if (saleId) {
      // Get the sale with all related data (for backward compatibility)
      const sale = await prisma.item_sales.findUnique({
        where: { id: saleId },
        include: {
          items: {
            include: {
              category: true,
              item_purchases: {
                orderBy: { purchase_date: 'desc' },
                take: 1,
              },
              item_attributes: {
                include: {
                  field_definitions: true,
                },
              },
            },
          },
          person: true,
          invoice: true,
        },
      })

      if (!sale) {
        return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
      }

      items = [sale.items].filter(Boolean)
      client = sale.person
      invoice = sale.invoice
    } else {
      return NextResponse.json({ error: 'No saleId or invoiceId provided' }, { status: 400 })
    }

    // Create PDF
    const pdf = new jsPDF()
    
    // Company header
    pdf.setFontSize(20)
    pdf.text('INVOICE', 105, 20, { align: 'center' })
    
    // Invoice details
    pdf.setFontSize(12)
    pdf.text(`Invoice Date: ${invoice?.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : new Date().toLocaleDateString()}`, 20, 40)
    pdf.text(`Invoice Number: ${invoice?.invoice_number || `INV-${items[0]?.item_number || items[0]?.id.slice(0, 8)}`}`, 20, 50)
    
    // Client information
    if (client) {
      pdf.text('Bill To:', 20, 70)
      pdf.text(`${client.name} ${client.lastname || ''}`, 20, 80)
      if (client.address_line_1) pdf.text(client.address_line_1, 20, 90)
      if (client.address_line_2) pdf.text(client.address_line_2, 20, 100)
      if (client.zipcode || client.country) {
        pdf.text(`${client.zipcode || ''} ${client.country || ''}`.trim(), 20, 110)
      }
      if (client.phone) pdf.text(`Phone: ${client.phone}`, 20, 120)
    }
    
    // Items table
    pdf.text('Items:', 20, 140)
    pdf.line(20, 145, 190, 145)
    
    let yPos = 155
    let totalAmount = 0
    
    // Table headers
    pdf.setFontSize(10)
    pdf.text('Item #', 20, yPos)
    pdf.text('Description', 50, yPos)
    pdf.text('Category', 110, yPos)
    pdf.text('Price', 170, yPos, { align: 'right' })
    yPos += 5
    pdf.line(20, yPos, 190, yPos)
    yPos += 10
    
    // Items
    items.forEach((item, index) => {
      if (yPos > 250) {
        // Add new page if needed
        pdf.addPage()
        yPos = 20
      }
      
      const sale = invoice?.item_sales.find(s => s.item_id === item.id)
      const salePrice = sale?.sale_price ? (sale.sale_price instanceof Decimal ? sale.sale_price.toNumber() : Number(sale.sale_price)) : 0
      totalAmount += salePrice
      
      pdf.text(item.item_number || '-', 20, yPos)
      pdf.text((item.description || '-').substring(0, 30) + (item.description && item.description.length > 30 ? '...' : ''), 50, yPos)
      pdf.text(item.category?.name || '-', 110, yPos)
      pdf.text(`€${salePrice.toFixed(2)}`, 170, yPos, { align: 'right' })
      yPos += 10
    })
    
    // Total line
    yPos += 5
    pdf.line(20, yPos, 190, yPos)
    yPos += 10
    
    pdf.setFontSize(12)
    pdf.text('Total:', 140, yPos)
    pdf.setFontSize(14)
    pdf.text(`€${totalAmount.toFixed(2)}`, 170, yPos, { align: 'right' })
    
    // Footer
    pdf.setFontSize(10)
    pdf.text('Thank you for your business!', 105, 280, { align: 'center' })
    
    // Generate PDF as blob
    const pdfBlob = pdf.output('blob')
    
    // Return the PDF
    return new NextResponse(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice_${invoice?.invoice_number || 'document'}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    )
  }
}