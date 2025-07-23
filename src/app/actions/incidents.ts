'use server'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

interface ReportIncidentData {
  itemId: string
  incidentType: string
  description: string
  incidentDate: Date
  reportedBy: string
}

export async function reportItemIncident(data: ReportIncidentData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  try {
    // Create the incident record
    await prisma.item_incidents.create({
      data: {
        item_id: data.itemId,
        incident_type: data.incidentType,
        description: data.description,
        incident_date: data.incidentDate,
        reported_by: data.reportedBy,
        resolution_status: 'open'
      }
    })

    // Revalidate the incidents page to show the new incident
    revalidatePath('/dashboard/incidents')
    revalidatePath('/dashboard/items')
    
    return { success: true }
  } catch (error) {
    console.error('Failed to create incident:', error)
    throw new Error('Failed to create incident')
  }
}