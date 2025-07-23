'use client'

import { UnifiedEntityModal } from '@/components/modals/unified-entity-modal'

interface Category {
  id: string
  name: string
}

interface FieldDefinition {
  id: string
  field_name: string
  field_label: string | null
  field_type: string
  is_required: boolean | null
  default_value: string | null
}

interface AddItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  mode?: 'create' | 'view'
  onUpdate?: () => void
  item?: {
    id: string
    item_number: string | null
    description: string | null
    color: string | null
    grade: string | null
    category_id: string | null
    category: {
      id: string
      name: string
    } | null
    item_purchases: Array<{
      purchase_price: number | null
      purchase_date: Date | null
    }>
    item_images?: Array<{
      id: string
      url: string
      file_name: string
      file_size: number | null
      mime_type: string | null
      is_primary: boolean | null
    }>
    images?: Array<{
      id: string
      storage_url: string | null
      original_name: string
      file_name: string
      file_size: string | null
      mime_type: string | null
      is_primary: boolean
      position: number | null
      title: string | null
      alt_text: string | null
      width: number | null
      height: number | null
    }>
    item_attributes?: Array<{
      id: string
      field_definition_id: string
      value: string | null
    }>
    documents?: Array<{
      id: string
      title: string
      original_name: string
      file_name: string
      file_path: string
      file_size: bigint | null
      mime_type: string | null
      storage_url: string | null
      description: string | null
      document_type: {
        id: string
        name: string
        description: string | null
      } | null
      created_at: Date | null
    }>
  }
}

export function AddItemModal(props: AddItemModalProps) {
  return <UnifiedEntityModal {...props} entityType="item" />
}