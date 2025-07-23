'use client'

import { UnifiedEntityModal } from '@/components/modals/unified-entity-modal'

interface PersonType {
  id: string
  name: string
}

interface Person {
  id: string
  name: string
  lastname?: string | null
  person_type_id?: string | null
  address_line_1?: string | null
  address_line_2?: string | null
  zipcode?: string | null
  country?: string | null
  phone?: string | null
  website?: string | null
  specialization?: string | null
  person_type?: PersonType | null
}

interface PersonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  personTypes: PersonType[]
  person?: Person | null
  mode: 'create' | 'view'
  preselectedTypeId?: string | null
}

export function PersonModal(props: PersonModalProps) {
  return <UnifiedEntityModal {...props} entityType="person" />
}