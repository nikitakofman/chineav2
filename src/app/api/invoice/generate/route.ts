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

    const { itemId, clientId } = await request.json()

    // Get the item with all related data
    const item = await prisma.items.findUnique({
      where: { id: itemId },
      include: {
        category: true,
        item_purchases: {
          orderBy: { purchase_date: 'desc' },
          take: 1,
        },
        item_sales: {
          orderBy: { sale_date: 'desc' },
          take: 1,
          include: {
            person: true,
          },
        },
        item_attributes: {
          include: {
            field_definitions: true,
          },
        },
      },
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const sale = item.item_sales[0]
    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
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
    pdf.text(`Invoice Number: INV-${item.item_number || item.id.slice(0, 8)}`, 20, 50)
    
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
    
    // Item details
    pdf.text('Item Details:', 20, 140)
    pdf.line(20, 145, 190, 145)
    
    let yPos = 155
    pdf.text(`Item Number: ${item.item_number || '-'}`, 20, yPos)
    yPos += 10
    pdf.text(`Description: ${item.description || '-'}`, 20, yPos)
    yPos += 10
    if (item.category) {
      pdf.text(`Category: ${item.category.name}`, 20, yPos)
      yPos += 10
    }
    if (item.color) {
      pdf.text(`Color: ${item.color}`, 20, yPos)
      yPos += 10
    }
    if (item.grade) {
      pdf.text(`Grade: ${item.grade}`, 20, yPos)
      yPos += 10
    }
    
    // Custom attributes
    if (item.item_attributes.length > 0) {
      yPos += 10
      item.item_attributes.forEach(attr => {
        if (attr.value) {
          const label = attr.field_definitions?.field_label || attr.field_definitions?.field_name || 'Field'
          pdf.text(`${label}: ${attr.value}`, 20, yPos)
          yPos += 10
        }
      })
    }
    
    // Sale information
    yPos += 10
    pdf.text('Sale Information:', 20, yPos)
    yPos += 5
    pdf.line(20, yPos, 190, yPos)
    yPos += 10
    
    pdf.text(`Sale Date: ${sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : '-'}`, 20, yPos)
    yPos += 10
    const salePrice = sale.sale_price ? (sale.sale_price instanceof Decimal ? sale.sale_price.toNumber() : Number(sale.sale_price)) : 0
    pdf.text(`Sale Price: $${salePrice.toFixed(2)}`, 20, yPos)
    yPos += 10
    if (sale.payment_method) {
      pdf.text(`Payment Method: ${sale.payment_method}`, 20, yPos)
      yPos += 10
    }
    if (sale.sale_location) {
      pdf.text(`Location: ${sale.sale_location}`, 20, yPos)
      yPos += 10
    }
    
    // Total
    yPos += 10
    pdf.setFontSize(14)
    pdf.text(`Total: $${salePrice.toFixed(2)}`, 20, yPos)
    
    // Footer
    pdf.setFontSize(10)
    pdf.text('Thank you for your business!', 105, 280, { align: 'center' })
    
    // Generate PDF as blob
    const pdfBlob = pdf.output('blob')
    
    // Return the PDF
    return new NextResponse(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice_${item.item_number || item.id}.pdf"`,
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