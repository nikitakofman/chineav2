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

    const { saleIds, clientId } = await request.json()

    // Get all sales with their items
    const sales = await prisma.item_sales.findMany({
      where: { 
        id: { in: saleIds }
      },
      include: {
        items: {
          include: {
            category: true,
            item_attributes: {
              include: {
                field_definitions: true,
              },
            },
          }
        },
        person: true,
      },
      orderBy: {
        created_at: 'asc'
      }
    })

    if (sales.length === 0) {
      return NextResponse.json({ error: 'No sales found' }, { status: 404 })
    }

    // Get client data if clientId is provided
    let client = null
    if (clientId) {
      client = await prisma.person.findUnique({
        where: { id: clientId },
      })
    }

    // Create PDF
    const pdf = new jsPDF()
    
    // Company header
    pdf.setFontSize(20)
    pdf.text('INVOICE', 105, 20, { align: 'center' })
    
    // Invoice details
    pdf.setFontSize(12)
    pdf.text(`Invoice Date: ${new Date().toLocaleDateString()}`, 20, 40)
    pdf.text(`Invoice Number: INV-MULTI-${new Date().getTime().toString().slice(-8)}`, 20, 50)
    
    // Client information
    let yPos = 70
    if (client) {
      pdf.text('Bill To:', 20, yPos)
      yPos += 10
      pdf.text(`${client.name} ${client.lastname || ''}`, 20, yPos)
      yPos += 10
      if (client.address_line_1) {
        pdf.text(client.address_line_1, 20, yPos)
        yPos += 10
      }
      if (client.address_line_2) {
        pdf.text(client.address_line_2, 20, yPos)
        yPos += 10
      }
      if (client.zipcode || client.country) {
        pdf.text(`${client.zipcode || ''} ${client.country || ''}`.trim(), 20, yPos)
        yPos += 10
      }
      if (client.phone) {
        pdf.text(`Phone: ${client.phone}`, 20, yPos)
        yPos += 10
      }
    }
    
    // Items header
    yPos += 10
    pdf.text('Items:', 20, yPos)
    yPos += 5
    pdf.line(20, yPos, 190, yPos)
    yPos += 10
    
    // Table headers
    pdf.setFontSize(10)
    pdf.text('Item #', 25, yPos)
    pdf.text('Description', 50, yPos)
    pdf.text('Category', 110, yPos)
    pdf.text('Price', 170, yPos)
    yPos += 5
    pdf.line(20, yPos, 190, yPos)
    yPos += 10
    
    let totalAmount = 0
    
    // List all items
    for (const sale of sales) {
      const item = sale.items
      if (!item) continue
      
      // Check if we need a new page
      if (yPos > 250) {
        pdf.addPage()
        yPos = 20
      }
      
      pdf.text(item.item_number || '-', 25, yPos)
      
      // Truncate description if too long
      const description = item.description || '-'
      const maxDescLength = 30
      const truncatedDesc = description.length > maxDescLength 
        ? description.substring(0, maxDescLength) + '...' 
        : description
      pdf.text(truncatedDesc, 50, yPos)
      
      pdf.text(item.category?.name || '-', 110, yPos)
      
      const salePrice = sale.sale_price ? (sale.sale_price instanceof Decimal ? sale.sale_price.toNumber() : Number(sale.sale_price)) : 0
      pdf.text(`$${salePrice.toFixed(2)}`, 170, yPos)
      
      totalAmount += salePrice
      yPos += 10
    }
    
    // Total
    yPos += 10
    pdf.line(20, yPos, 190, yPos)
    yPos += 10
    pdf.setFontSize(14)
    pdf.text(`Total: $${totalAmount.toFixed(2)}`, 170, yPos, { align: 'right' })
    
    // Payment information
    yPos += 20
    pdf.setFontSize(10)
    const paymentMethods = [...new Set(sales.map(s => s.payment_method).filter(Boolean))]
    if (paymentMethods.length > 0) {
      pdf.text(`Payment Method(s): ${paymentMethods.join(', ')}`, 20, yPos)
      yPos += 10
    }
    
    const saleLocations = [...new Set(sales.map(s => s.sale_location).filter(Boolean))]
    if (saleLocations.length > 0) {
      pdf.text(`Location(s): ${saleLocations.join(', ')}`, 20, yPos)
    }
    
    // Footer
    pdf.setFontSize(10)
    pdf.text('Thank you for your business!', 105, 280, { align: 'center' })
    
    // Generate PDF as blob
    const pdfBlob = pdf.output('blob')
    
    // Return the PDF
    return new NextResponse(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice_multi_${new Date().getTime()}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating multi-invoice:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    )
  }
}