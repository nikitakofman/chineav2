'use client'

import { UnifiedEntityModal } from '@/components/modals/unified-entity-modal'
import { GenericCrudModal } from '@/components/shared/generic-crud-modal'
import { useTranslations } from 'next-intl'
import { BookOpen } from 'lucide-react'
import { createBook } from '@/app/actions/books'

// ============================================================================
// Person Modal
// ============================================================================

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
  invoices?: {
    id: string
    invoice_number: string
    invoice_date: Date
    total_amount: number
    status: string
  }[]
  _count?: {
    item_purchases: number
    item_sales: number
    invoices: number
  }
}

interface PersonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  personTypes: PersonType[]
  person?: Person | null
  mode: 'create' | 'view'
  preselectedTypeId?: string | null
  onSuccess?: () => void
}

export function PersonModal(props: PersonModalProps) {
  return <UnifiedEntityModal {...props} entityType="person" />
}

// ============================================================================
// Add Person Modal
// ============================================================================

interface AddPersonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  personTypes: PersonType[]
  preselectedTypeId?: string | null
  onSuccess?: () => void
}

export function AddPersonModal(props: AddPersonModalProps) {
  return <PersonModal {...props} mode="create" />
}

// ============================================================================
// Multi Sale Modal
// ============================================================================

export { MultiSaleModal } from '@/components/modals/multi-sale-modal'

// ============================================================================
// Sale Modal
// ============================================================================

interface SaleModalItem {
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
  item: SaleModalItem
}

export function SaleModal(props: SaleModalProps) {
  return <UnifiedEntityModal {...props} entityType="sale" mode="create" />
}

// ============================================================================
// Incident Modal
// ============================================================================

interface Incident {
  id: string
  incident_date: Date | null
  incident_type: string | null
  description: string | null
  resolution_status: string | null
  resolution_date: Date | null
  resolution_notes: string | null
  reported_by: string | null
  items: {
    id: string
    item_number: string | null
    description: string | null
    category: {
      id: string
      name: string
    } | null
  } | null
  primaryImage?: {
    url: string
    title?: string
    alt_text?: string
  } | null
  images?: Array<{
    id: string
    storage_url: string
    title?: string
    alt_text?: string
  }>
}

interface IncidentModalItem {
  id: string
  item_number: string | null
  description: string | null
  color?: string | null
  grade?: string | null
  category: {
    name: string
  } | null
}

interface IncidentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: IncidentModalItem
  incident?: Incident
  mode: 'create' | 'view'
}

export function IncidentModal(props: IncidentModalProps) {
  return <UnifiedEntityModal {...props} entityType="incident" />
}

// ============================================================================
// Add Item Modal
// ============================================================================

interface Category {
  id: string
  name: string
  parent_category?: {
    id: string
    name: string
  } | null
}

interface ItemImage {
  id: string
  url: string
  file_name: string
  file_size: number | null
  mime_type: string | null
  is_primary: boolean | null
}

interface AddItemData {
  id: string
  itemNumber: string
  description: string
  categoryId: string | null
  category?: {
    id: string
    name: string
  } | null
  color?: string
  grade?: string
  customFields: Record<string, any>
  purchase?: {
    sellerId: string | null
    purchasePrice?: string
    purchaseDate: Date | null
  }
  sale?: {
    clientId: string | null
    salePrice?: string
    saleDate: Date | null
    saleLocation?: string
    paymentMethod?: string
  }
  images: ItemImage[]
}

interface AddItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories?: Category[]
  item?: AddItemData
  mode?: 'create' | 'edit' | 'view'
}

export function AddItemModal(props: AddItemModalProps) {
  // Convert AddItemData to ItemData format
  const itemData: any = props.item ? {
    id: props.item.id,
    item_number: props.item.itemNumber,
    description: props.item.description,
    color: props.item.color || null,
    grade: props.item.grade || null,
    category_id: props.item.categoryId,
    category: props.item.category || null,
    item_purchases: props.item.purchase ? [{
      purchase_price: props.item.purchase.purchasePrice ? parseFloat(props.item.purchase.purchasePrice) : null,
      purchase_date: props.item.purchase.purchaseDate
    }] : [],
    item_sales: props.item.sale ? [{
      sale_price: props.item.sale.salePrice ? parseFloat(props.item.sale.salePrice) : null,
      sale_date: props.item.sale.saleDate,
      sale_location: props.item.sale.saleLocation || null,
      payment_method: props.item.sale.paymentMethod || null
    }] : [],
    images: props.item.images?.map(img => ({
      id: img.id,
      storage_url: img.url,
      original_name: img.file_name,
      file_name: img.file_name,
      file_size: img.file_size?.toString() || null,
      mime_type: img.mime_type,
      is_primary: img.is_primary || false,
      position: null,
      title: null,
      alt_text: null,
      width: null,
      height: null
    })) || [],
    item_attributes: []
  } : undefined
  
  return <UnifiedEntityModal 
    {...props} 
    entityType="item" 
    mode={props.mode || 'create'} 
    item={itemData}
    categories={props.categories || []}
  />
}

// ============================================================================
// Book Create Modal
// ============================================================================

interface BookType {
  id: string
  name: string
  fields?: Array<{
    id: string
    name: string
    label: string
    field_type: string
    required: boolean
  }>
}

interface BookCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookTypes: BookType[]
  onSuccess?: (book: any) => void
}

export function BookCreateModal({ open, onOpenChange, bookTypes, onSuccess }: BookCreateModalProps) {
  const t = useTranslations()
  
  const handleSubmit = async (formData: Record<string, any>) => {
    const submitFormData = new FormData()
    submitFormData.append('bookTypeId', formData.bookTypeId)
    submitFormData.append('reference', formData.reference)
    submitFormData.append('description', formData.description || '')
    
    const result = await createBook(submitFormData)
    
    if (result.error) {
      return { error: result.error }
    }
    
    return { success: true, data: result }
  }

  const config = {
    title: t('books.createNewBook'),
    description: t('books.createBookDescription'),
    icon: BookOpen,
    fields: [
      {
        name: 'bookTypeId',
        label: t('books.bookType'),
        type: 'select' as const,
        required: true,
        options: bookTypes.map(type => ({
          value: type.id,
          label: type.display_name || type.name
        }))
      },
      {
        name: 'reference',
        label: t('books.reference'),
        type: 'text' as const,
        placeholder: t('books.referencePlaceholder'),
        required: true
      },
      {
        name: 'description',
        label: t('books.description'),
        type: 'textarea' as const,
        placeholder: t('books.descriptionPlaceholder'),
        required: false
      }
    ],
    submitLabel: t('books.createBook'),
    loadingLabel: t('books.creating'),
    mode: 'create' as const
  }

  return (
    <GenericCrudModal
      open={open}
      onOpenChange={onOpenChange}
      config={config}
      onSubmit={handleSubmit}
      onSuccess={(data) => {
        console.log('Modal success data:', data) // Debug log
        if (onSuccess) {
          // data is result.data from GenericCrudModal which is the result from createBook { book }
          onSuccess(data.book)
        }
      }}
    />
  )
}