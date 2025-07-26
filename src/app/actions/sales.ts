'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSale(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const itemId = formData.get('item_id') as string
  const clientId = formData.get('client_id') as string | null
  const salePrice = formData.get('sale_price') as string
  const saleDate = formData.get('sale_date') as string
  const saleLocation = formData.get('sale_location') as string | null
  const paymentMethod = formData.get('payment_method') as string | null

  try {
    // Verify the item belongs to the user
    const item = await prisma.items.findFirst({
      where: {
        id: itemId,
        book: {
          user_id: user.id
        }
      },
      include: {
        item_sales: true,
        book: true
      }
    })

    if (!item) {
      return { error: 'Item not found' }
    }

    if (item.item_sales.length > 0) {
      return { error: 'Item is already sold' }
    }

    // Generate invoice number
    const lastInvoice = await prisma.invoices.findFirst({
      where: {
        book_id: item.book_id!
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    let invoiceNumber = 'INV-001'
    if (lastInvoice && lastInvoice.invoice_number) {
      const lastNumber = parseInt(lastInvoice.invoice_number.split('-')[1] || '0')
      invoiceNumber = `INV-${String(lastNumber + 1).padStart(3, '0')}`
    }

    const salePriceValue = salePrice ? parseFloat(salePrice) : 0

    // Create invoice and sale in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the invoice
      const invoice = await tx.invoices.create({
        data: {
          user_id: user.id,
          book_id: item.book_id!,
          invoice_number: invoiceNumber,
          client_id: clientId || null,
          invoice_date: saleDate ? new Date(saleDate) : new Date(),
          total_amount: salePriceValue,
          currency: 'EUR',
          status: 'paid'
        }
      })

      // Create the sale with invoice reference
      const sale = await tx.item_sales.create({
        data: {
          item_id: itemId,
          client_id: clientId || null,
          sale_price: salePriceValue,
          sale_date: saleDate ? new Date(saleDate) : new Date(),
          sale_location: saleLocation?.trim() || null,
          payment_method: paymentMethod?.trim() || null,
          invoice_id: invoice.id
        }
      })

      return { sale, invoice }
    })

    revalidatePath('/dashboard/items')
    
    // Serialize the sale data to convert Decimal to number
    const serializedSale = {
      ...result.sale,
      sale_price: result.sale.sale_price ? result.sale.sale_price.toNumber() : null
    }
    
    return { success: true, data: serializedSale }
  } catch (error) {
    console.error('Failed to create sale:', error)
    return { error: 'Failed to create sale' }
  }
}

export async function createMultiSale(salesData: {
  clientId: string | null
  items: Array<{
    itemId: string
    salePrice: string
    saleDate: string
    saleLocation: string | null
    paymentMethod: string | null
  }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  try {
    // Verify all items belong to the user and get book_id
    const itemIds = salesData.items.map(item => item.itemId)
    const items = await prisma.items.findMany({
      where: {
        id: { in: itemIds },
        book: {
          user_id: user.id
        }
      },
      include: {
        item_sales: true
      }
    })

    if (items.length !== itemIds.length) {
      return { error: 'One or more items not found' }
    }

    // Check if any items are already sold
    const soldItems = items.filter(item => item.item_sales.length > 0)
    if (soldItems.length > 0) {
      return { error: 'One or more items are already sold' }
    }

    // All items should be from the same book
    const bookId = items[0].book_id
    if (!bookId || !items.every(item => item.book_id === bookId)) {
      return { error: 'All items must be from the same book' }
    }

    // Generate invoice number
    const lastInvoice = await prisma.invoices.findFirst({
      where: {
        book_id: bookId
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    let invoiceNumber = 'INV-001'
    if (lastInvoice && lastInvoice.invoice_number) {
      const lastNumber = parseInt(lastInvoice.invoice_number.split('-')[1] || '0')
      invoiceNumber = `INV-${String(lastNumber + 1).padStart(3, '0')}`
    }

    // Calculate total amount
    const totalAmount = salesData.items.reduce((sum, item) => {
      return sum + (item.salePrice ? parseFloat(item.salePrice) : 0)
    }, 0)

    // Use the earliest sale date for invoice date
    const invoiceDate = salesData.items
      .map(item => new Date(item.saleDate))
      .reduce((earliest, date) => date < earliest ? date : earliest)

    // Create invoice and sales in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the invoice
      const invoice = await tx.invoices.create({
        data: {
          user_id: user.id,
          book_id: bookId,
          invoice_number: invoiceNumber,
          client_id: salesData.clientId || null,
          invoice_date: invoiceDate,
          total_amount: totalAmount,
          currency: 'EUR',
          status: 'paid'
        }
      })

      // Create all sales with invoice reference
      const sales = await Promise.all(
        salesData.items.map(item => 
          tx.item_sales.create({
            data: {
              item_id: item.itemId,
              client_id: salesData.clientId || null,
              sale_price: item.salePrice ? parseFloat(item.salePrice) : 0,
              sale_date: item.saleDate ? new Date(item.saleDate) : new Date(),
              sale_location: item.saleLocation?.trim() || null,
              payment_method: item.paymentMethod?.trim() || null,
              invoice_id: invoice.id
            }
          })
        )
      )

      return { invoice, sales }
    })

    revalidatePath('/dashboard/items')
    revalidatePath('/dashboard/sold')
    
    // Serialize the sales data to convert Decimal to number
    const serializedSales = result.sales.map(sale => ({
      ...sale,
      sale_price: sale.sale_price ? sale.sale_price.toNumber() : null
    }))
    
    return { 
      success: true, 
      data: {
        invoice: result.invoice,
        sales: serializedSales
      }
    }
  } catch (error) {
    console.error('Failed to create multi-sale:', error)
    return { error: 'Failed to create sales' }
  }
}

export async function getClients() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const clients = await prisma.person.findMany({
    where: {
      user_id: user.id,
      person_type: {
        name: 'client'
      }
    },
    orderBy: {
      name: 'asc'
    }
  })

  return clients
}