/**
 * @deprecated This file has been replaced by people-migrated.ts which uses EntityService.
 * Please use the migrated version for all new development.
 * Migration guide: /MIGRATION_GUIDE.md
 */
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function getPersonTypes() {
  const types = await prisma.person_type.findMany()
  
  // Custom ordering: Client, Seller, Expert
  const desiredOrder = ['client', 'seller', 'expert']
  return types.sort((a, b) => {
    const indexA = desiredOrder.indexOf(a.name.toLowerCase())
    const indexB = desiredOrder.indexOf(b.name.toLowerCase())
    return indexA - indexB
  })
}

export async function getPeople() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []
  
  const people = await prisma.person.findMany({
    where: {
      user_id: user.id
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
        }
      },
      _count: {
        select: {
          item_purchases: true,
          item_sales: true,
          invoices: true
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  })

  // Fetch documents for each person using the centralized documents table
  const peopleWithDocuments = await Promise.all(
    people.map(async (person) => {
      const documents = await prisma.documents.findMany({
        where: {
          entity_type: 'person',
          entity_id: person.id,
          is_deleted: false
        },
        select: {
          id: true,
          original_name: true,
          file_size: true,
          mime_type: true,
          title: true,
          description: true
        },
        orderBy: {
          created_at: 'desc'
        }
      })

      return {
        ...person,
        documents,
        // Convert Decimal objects to numbers for client compatibility
        invoices: person.invoices?.map(invoice => ({
          ...invoice,
          total_amount: Number(invoice.total_amount)
        }))
      }
    })
  )

  return peopleWithDocuments
}

export async function createPerson(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const personTypeId = formData.get('personTypeId') as string
  const name = formData.get('name') as string
  const lastname = formData.get('lastname') as string | null
  const phone = formData.get('phone') as string | null
  const addressLine1 = formData.get('addressLine1') as string | null
  const addressLine2 = formData.get('addressLine2') as string | null
  const zipcode = formData.get('zipcode') as string | null
  const country = formData.get('country') as string | null
  const website = formData.get('website') as string | null
  const specialization = formData.get('specialization') as string | null
  
  try {
    const person = await prisma.person.create({
      data: {
        user_id: user.id,
        person_type_id: personTypeId || null,
        name: name.trim(),
        lastname: lastname?.trim() || null,
        phone: phone?.trim() || null,
        address_line_1: addressLine1?.trim() || null,
        address_line_2: addressLine2?.trim() || null,
        zipcode: zipcode?.trim() || null,
        country: country?.trim() || null,
        website: website?.trim() || null,
        specialization: specialization?.trim() || null
      }
    })
    
    revalidatePath('/dashboard/people')
    return { success: true, data: person }
  } catch (error) {
    console.error('Failed to create person:', error)
    return { error: 'Failed to create person' }
  }
}

export async function updatePerson(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const personTypeId = formData.get('personTypeId') as string
  const name = formData.get('name') as string
  const lastname = formData.get('lastname') as string | null
  const phone = formData.get('phone') as string | null
  const addressLine1 = formData.get('addressLine1') as string | null
  const addressLine2 = formData.get('addressLine2') as string | null
  const zipcode = formData.get('zipcode') as string | null
  const country = formData.get('country') as string | null
  const website = formData.get('website') as string | null
  const specialization = formData.get('specialization') as string | null
  
  try {
    await prisma.person.update({
      where: {
        id,
        user_id: user.id
      },
      data: {
        person_type_id: personTypeId || null,
        name: name.trim(),
        lastname: lastname?.trim() || null,
        phone: phone?.trim() || null,
        address_line_1: addressLine1?.trim() || null,
        address_line_2: addressLine2?.trim() || null,
        zipcode: zipcode?.trim() || null,
        country: country?.trim() || null,
        website: website?.trim() || null,
        specialization: specialization?.trim() || null
      }
    })
    
    revalidatePath('/dashboard/people')
    return { success: true }
  } catch (error) {
    console.error('Failed to update person:', error)
    return { error: 'Failed to update person' }
  }
}

export async function deletePerson(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  try {
    // Check if person has any purchases or sales
    const person = await prisma.person.findFirst({
      where: {
        id,
        user_id: user.id
      },
      include: {
        item_purchases: {
          select: {
            id: true
          }
        },
        item_sales: {
          select: {
            id: true
          }
        },
        invoices: {
          select: {
            id: true
          }
        }
      }
    })
    
    if (!person) {
      return { error: 'Person not found' }
    }
    
    if (person.item_purchases.length > 0 || person.item_sales.length > 0 || person.invoices.length > 0) {
      return { error: 'Cannot delete person with associated transactions' }
    }
    
    await prisma.person.delete({
      where: {
        id,
        user_id: user.id
      }
    })
    
    revalidatePath('/dashboard/people')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete person:', error)
    return { error: 'Failed to delete person' }
  }
}