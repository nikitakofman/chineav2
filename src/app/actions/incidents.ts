'use server'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getImagesForEntity } from '@/lib/storage'

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
    const incident = await prisma.item_incidents.create({
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
    
    return { success: true, id: incident.id }
  } catch (error) {
    console.error('Failed to create incident:', error)
    throw new Error('Failed to create incident')
  }
}

export async function getIncidentWithImages(incidentId: string, userId: string) {
  try {
    // Get the incident with full details
    const incident = await prisma.item_incidents.findFirst({
      where: {
        id: incidentId,
        items: {
          book: {
            user_id: userId
          }
        }
      },
      include: {
        items: {
          include: {
            book: true,
            category: true
          }
        }
      }
    })

    if (!incident) {
      return { error: 'Incident not found or access denied' }
    }

    // Get images using centralized system
    const images = await getImagesForEntity('incident', incidentId)

    return {
      incident: {
        ...incident,
        images: images.map(image => ({
          id: image.id,
          url: image.storage_url || image.file_path,
          file_path: image.file_path,
          file_name: image.file_name,
          original_name: image.original_name,
          file_size: Number(image.file_size || 0),
          mime_type: image.mime_type,
          position: image.position || 0,
          title: image.title,
          alt_text: image.alt_text,
          created_at: image.created_at,
          updated_at: image.updated_at
        }))
      }
    }
  } catch (error) {
    console.error('Failed to get incident with images:', error)
    return { error: 'Failed to get incident' }
  }
}

export async function getIncidentsWithImages(userId: string) {
  try {
    // Get all incidents for the user
    const incidents = await prisma.item_incidents.findMany({
      where: {
        items: {
          book: {
            user_id: userId
          }
        }
      },
      include: {
        items: {
          include: {
            book: true,
            category: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    // Get images for each incident
    const incidentsWithImages = await Promise.all(
      incidents.map(async (incident) => {
        const images = await getImagesForEntity('incident', incident.id)
        const primaryImage = images[0] // incidents don't have primary, just take first
        
        return {
          ...incident,
          primaryImage: primaryImage ? {
            id: primaryImage.id,
            url: primaryImage.storage_url || primaryImage.file_path,
            alt_text: primaryImage.alt_text,
            title: primaryImage.title
          } : null,
          imageCount: images.length
        }
      })
    )

    return { incidents: incidentsWithImages }
  } catch (error) {
    console.error('Failed to get incidents with images:', error)
    return { error: 'Failed to get incidents' }
  }
}

export async function updateIncidentStatus(incidentId: string, status: string, userId: string) {
  try {
    // Verify ownership and update
    const incident = await prisma.item_incidents.findFirst({
      where: {
        id: incidentId,
        items: {
          book: {
            user_id: userId
          }
        }
      }
    })

    if (!incident) {
      return { error: 'Incident not found or access denied' }
    }

    const updatedIncident = await prisma.item_incidents.update({
      where: { id: incidentId },
      data: {
        resolution_status: status,
        updated_at: new Date()
      }
    })

    revalidatePath('/dashboard/incidents')
    return { incident: updatedIncident }
  } catch (error) {
    console.error('Failed to update incident status:', error)
    return { error: 'Failed to update incident status' }
  }
}