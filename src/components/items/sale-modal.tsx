'use client'

import { UnifiedEntityModal } from '@/components/modals/unified-entity-modal'

interface Client {
  id: string
  name: string
  lastname: string | null
}

interface Item {
  id: string
  item_number: string | null
  description: string | null
  color: string | null
  grade: string | null
  category: {
    name: string
  } | null
}

interface SaleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: Item
}

export function SaleModal(props: SaleModalProps) {
  return <UnifiedEntityModal {...props} entityType="sale" mode="create" />
}