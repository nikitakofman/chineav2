'use client'

import { UnifiedEntityModal } from '@/components/modals/unified-entity-modal'

interface IncidentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: 'create' | 'view' | 'edit'
  item?: {
    id: string
    item_number: string | null
    description: string | null
  }
  incident?: {
    id: string
    incident_type: string | null
    description: string | null
    incident_date: Date | null
    reported_by: string | null
    resolution_status: string | null
    // Legacy incident_images for backward compatibility
    images?: Array<{
      id: string
      url: string
      file_name: string
      file_size: number | null
      mime_type: string | null
    }>
    // New centralized images
    centralizedImages?: Array<{
      id: string
      storage_url: string | null
      original_name: string
      file_name: string
      file_size: string | null
      mime_type: string | null
      title: string | null
      alt_text: string | null
      width: number | null
      height: number | null
      position?: number | null
    }>
  }
  onUpdate?: () => void
}

export function IncidentModal(props: IncidentModalProps) {
  // Use the unified modal with entityType='incident'
  return <UnifiedEntityModal {...props} entityType="incident" />
}