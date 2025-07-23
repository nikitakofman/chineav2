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
        item_sales: true
      }
    })

    if (!item) {
      return { error: 'Item not found' }
    }

    if (item.item_sales.length > 0) {
      return { error: 'Item is already sold' }
    }

    // Create the sale
    const sale = await prisma.item_sales.create({
      data: {
        item_id: itemId,
        client_id: clientId || null,
        sale_price: salePrice ? parseFloat(salePrice) : null,
        sale_date: saleDate ? new Date(saleDate) : new Date(),
        sale_location: saleLocation?.trim() || null,
        payment_method: paymentMethod?.trim() || null
      }
    })

    revalidatePath('/dashboard/items')
    return { success: true, data: sale }
  } catch (error) {
    console.error('Failed to create sale:', error)
    return { error: 'Failed to create sale' }
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