'use client'

import { useState, useEffect, useRef, ReactNode, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useBook } from '@/contexts/book-context'
import { createItem, getFieldDefinitionsForBook, updateItemCategory } from '@/app/actions/items'
import { reportItemIncident } from '@/app/actions/incidents'
import { createPerson, updatePerson } from '@/app/actions/people'
import { createSale, getClients } from '@/app/actions/sales'
import { getPersonTypeInfo } from '@/lib/person-type-utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Package, Upload, Image, FileText, Plus, X, Loader2, RotateCcw,
  AlertTriangle, Calendar, User, DollarSign
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AddCategoryModal } from '@/components/categories/add-category-modal'
import { FileUploadItem } from '@/components/ui/file-upload'
import { uploadMultipleFiles } from '@/lib/storage'
import { 
  uploadCentralizedImages, 
  uploadCentralizedDocuments, 
  getOrCreateImageType, 
  getOrCreateDocumentType,
  reorderCentralizedImages,
  deleteCentralizedImage 
} from '@/lib/centralized-storage'
import { createClient } from '@/utils/supabase/client'
import { ImageViewer } from '@/components/ui/image-viewer'
import { DocumentViewer } from '@/components/ui/document-viewer'
import { toast } from 'sonner'

// ============================================================================
// Types and Interfaces
// ============================================================================

export type EntityType = 'item' | 'incident' | 'person'
export type ModalMode = 'create' | 'view' | 'edit'

interface BaseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: ModalMode
  onUpdate?: () => void
}

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

interface PersonType {
  id: string
  name: string
}

interface ImageData {
  id: string
  url: string
  file_name: string
  file_size: number | null
  mime_type: string | null
  is_primary?: boolean | null
  position?: number | null
  title?: string | null
  alt_text?: string | null
  width?: number | null
  height?: number | null
}

interface DocumentData {
  id: string
  url: string
  file_name: string
  file_size: number | null
  mime_type: string | null
  title?: string
  description?: string | null
}

// Entity-specific props
interface ItemData {
  id: string
  item_number: string | null
  description: string | null
  color: string | null
  grade: string | null
  category_id: string | null
  category: Category | null
  item_purchases: Array<{
    purchase_price: number | null
    purchase_date: Date | null
  }>
  item_images?: ImageData[]
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

interface IncidentData {
  id: string
  incident_type: string | null
  description: string | null
  incident_date: Date | null
  reported_by: string | null
  resolution_status: string | null
  images?: ImageData[]
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

interface PersonData {
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

interface ItemModalProps extends BaseModalProps {
  entityType: 'item'
  categories: Category[]
  item?: ItemData
}

interface IncidentModalProps extends BaseModalProps {
  entityType: 'incident'
  item?: {
    id: string
    item_number: string | null
    description: string | null
  }
  incident?: IncidentData
}

interface PersonModalProps extends BaseModalProps {
  entityType: 'person'
  personTypes: PersonType[]
  person?: PersonData | null
  preselectedTypeId?: string | null
}

interface SaleModalProps extends BaseModalProps {
  entityType: 'sale'
  item: {
    id: string
    item_number: string | null
    description: string | null
    color: string | null
    grade: string | null
    category: {
      name: string
    } | null
  }
}

type UnifiedEntityModalProps = ItemModalProps | IncidentModalProps | PersonModalProps | SaleModalProps

// ============================================================================
// Helper Components
// ============================================================================

interface MediaGridProps {
  images: ImageData[]
  pendingUploads: FileUploadItem[]
  onImageClick: (image: { url: string; alt?: string; title?: string; width?: number; height?: number }) => void
  onReorder?: (dragIndex: number, dropIndex: number) => void
  onDelete?: (imageId: string) => void
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemovePending: (id: string) => void
  isUploading?: boolean
  isDraggable?: boolean
  showPrimaryLabel?: boolean
}

const MediaGrid: React.FC<MediaGridProps> = ({
  images,
  pendingUploads,
  onImageClick,
  onReorder,
  onDelete,
  onFileSelect,
  onRemovePending,
  isUploading = false,
  isDraggable = true,
  showPrimaryLabel = true
}) => {
  const t = useTranslations()
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {images.map((image, index) => (
        <div
          key={image.id}
          className={`relative group transition-all duration-200 ${
            draggedOverIndex === index ? 'ring-2 ring-primary ring-offset-2 rounded-lg' : ''
          }`}
          draggable={isDraggable && images.length > 1}
          onDragStart={(e) => {
            if (!onReorder) return
            e.dataTransfer.effectAllowed = 'move'
            e.dataTransfer.setData('dragIndex', index.toString())
            e.currentTarget.style.opacity = '0.5'
            setIsDragging(true)
          }}
          onDragEnd={(e) => {
            e.currentTarget.style.opacity = '1'
            setDraggedOverIndex(null)
            setIsDragging(false)
          }}
          onDragOver={(e) => {
            if (!onReorder) return
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
            setDraggedOverIndex(index)
          }}
          onDragLeave={() => {
            setDraggedOverIndex(null)
          }}
          onDrop={(e) => {
            if (!onReorder) return
            e.preventDefault()
            const dragIndex = parseInt(e.dataTransfer.getData('dragIndex'))
            onReorder(dragIndex, index)
            setDraggedOverIndex(null)
          }}
        >
          <div 
            className={`aspect-square bg-muted rounded-lg overflow-hidden border border-border ${
              isDraggable && images.length > 1 ? 'cursor-move' : 'cursor-pointer'
            } hover:opacity-90 transition-opacity`}
            onClick={() => onImageClick({ 
              url: image.url, 
              alt: image.alt_text || image.file_name,
              title: image.title || undefined,
              width: image.width || undefined,
              height: image.height || undefined
            })}
          >
            <img
              src={image.url}
              alt={image.file_name}
              className="w-full h-full object-cover pointer-events-none select-none"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-image.png'
              }}
            />
            {showPrimaryLabel && index === 0 && !isDragging && (
              <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded pointer-events-none">
                {t('common.preview')}
              </div>
            )}
          </div>
          {!isDragging && onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(image.id)
              }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
      
      {/* Pending uploads */}
      {pendingUploads.map((fileItem) => (
        <div key={fileItem.id} className="relative group">
          <div className="aspect-square bg-muted rounded-lg overflow-hidden border border-border border-dashed">
            <img
              src={fileItem.preview || ''}
              alt={fileItem.file.name}
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">
                {t('common.pending')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onRemovePending(fileItem.id)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={isUploading}
          >
            <X className="w-3 h-3" />
          </button>
          {isUploading && (
            <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>
      ))}
      
      {/* Add new image button */}
      <div className="relative">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={onFileSelect}
          className="absolute inset-0 opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        <div className="aspect-square border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
          <Plus className="w-6 h-6 text-muted-foreground" />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Main Unified Entity Modal Component
// ============================================================================

export function UnifiedEntityModal(props: UnifiedEntityModalProps) {
  const t = useTranslations()
  const router = useRouter()
  const { selectedBook } = useBook()
  
  // Common state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [imageFiles, setImageFiles] = useState<FileUploadItem[]>([])
  const [documentFiles, setDocumentFiles] = useState<FileUploadItem[]>([])
  const [currentImages, setCurrentImages] = useState<ImageData[]>([])
  const [currentDocuments, setCurrentDocuments] = useState<DocumentData[]>([])
  const [pendingImageUploads, setPendingImageUploads] = useState<FileUploadItem[]>([])
  const [pendingDocumentUploads, setPendingDocumentUploads] = useState<FileUploadItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const isReorderingRef = useRef(false)
  
  // Viewer states
  const [selectedImage, setSelectedImage] = useState<{ 
    url: string; 
    alt?: string; 
    title?: string; 
    width?: number; 
    height?: number; 
  } | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<{ 
    url: string; 
    fileName?: string; 
    title?: string; 
  } | null>(null)
  
  // Entity-specific state
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>([])
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>(
    props.entityType === 'item' ? props.categories : []
  )
  
  // Person-specific state
  const [isEditMode, setIsEditMode] = useState(props.mode === 'create')
  
  // Sale-specific state
  const [clients, setClients] = useState<Array<{ id: string; name: string; lastname: string | null }>>([])
  const [loadingClients, setLoadingClients] = useState(true)
  
  // Determine the actual mode considering edit toggle for person
  const effectiveMode = useMemo(() => {
    if (props.entityType === 'person' && props.mode === 'view' && isEditMode) {
      return 'edit'
    }
    return props.mode || 'create'
  }, [props.entityType, props.mode, isEditMode])
  
  const isViewMode = effectiveMode === 'view'
  const isCreateMode = effectiveMode === 'create'
  
  // Get entity-specific data
  const getEntityData = () => {
    switch (props.entityType) {
      case 'item':
        return props.item
      case 'incident':
        return props.incident
      case 'person':
        return props.person
      default:
        return null
    }
  }
  
  const entityData = getEntityData()
  
  // Get icon and title based on entity type
  const getHeaderInfo = () => {
    switch (props.entityType) {
      case 'item':
        return {
          icon: Package,
          iconColor: 'text-primary',
          iconBgColor: 'bg-primary/10',
          getTitle: () => {
            if (isViewMode) return t('items.viewDetails')
            return t('items.addNewItem')
          },
          getDescription: () => {
            if (isViewMode) return t('items.viewItemDescription')
            return t('items.addItemDescription')
          }
        }
      
      case 'incident':
        const incidentProps = props as IncidentModalProps
        return {
          icon: AlertTriangle,
          iconColor: 'text-orange-500',
          iconBgColor: 'bg-orange-500/10',
          getTitle: () => {
            if (isViewMode) return t('incidents.viewIncidentDetails')
            if (effectiveMode === 'edit') return t('incidents.editIncident')
            return t('incidents.reportIncident')
          },
          getDescription: () => {
            if (isViewMode) return t('incidents.subtitle')
            if (effectiveMode === 'edit') return t('incidents.subtitle')
            return t('incidents.reportIncidentDescription')
          }
        }
      
      case 'person':
        const personProps = props as PersonModalProps
        const person = personProps.person
        const personTypeForIcon = person?.person_type?.name || 
          (personProps.preselectedTypeId && personProps.personTypes.find(t => t.id === personProps.preselectedTypeId)?.name) || 
          ''
        const typeInfo = getPersonTypeInfo(personTypeForIcon)
        const TypeIcon = typeInfo.icon
        
        return {
          icon: TypeIcon,
          iconColor: 'text-white',
          iconBgColor: typeInfo.color,
          getTitle: () => {
            if (person && isViewMode) return person.name
            if (person) return t('people.editPerson')
            if (personProps.preselectedTypeId) {
              const typeName = personProps.personTypes.find(t => t.id === personProps.preselectedTypeId)?.name || ''
              return t('people.addNewPersonType', { 
                type: getPersonTypeTranslation(typeName, true) 
              })
            }
            return t('people.addNewPerson')
          },
          getDescription: () => ''
        }
      
      case 'sale':
        const saleProps = props as SaleModalProps
        return {
          icon: DollarSign,
          iconColor: 'text-white',
          iconBgColor: 'p-2 bg-green-500 text-white rounded-lg',
          getTitle: () => t('items.markAsSold'),
          getDescription: () => t('items.saleDescription', 'Record the sale information for this item')
        }
      
      default:
        return {
          icon: Package,
          iconColor: 'text-primary',
          iconBgColor: 'bg-primary/10',
          getTitle: () => 'Entity Details',
          getDescription: () => 'Manage entity information'
        }
    }
  }
  
  const headerInfo = getHeaderInfo()
  const HeaderIcon = headerInfo.icon
  
  // Helper function for person type translations
  const getPersonTypeTranslation = (typeName: string, withArticle = false) => {
    const normalizedType = typeName.toLowerCase()
    
    if (withArticle) {
      if (normalizedType === 'expert') return t('people.expertWithArticle')
      if (normalizedType === 'client') return t('people.clientWithArticle')
      if (normalizedType === 'seller') return t('people.sellerWithArticle')
    } else {
      if (normalizedType === 'expert') return t('people.expert')
      if (normalizedType === 'client') return t('people.client')
      if (normalizedType === 'seller') return t('people.seller')
    }
    
    return typeName.charAt(0).toUpperCase() + typeName.slice(1)
  }
  
  // Load data on mount
  useEffect(() => {
    async function loadFieldDefinitions() {
      if (props.entityType === 'item' && selectedBook) {
        const fields = await getFieldDefinitionsForBook(selectedBook.id)
        setFieldDefinitions(fields)
      }
    }
    
    async function loadClients() {
      if (props.entityType === 'sale') {
        setLoadingClients(true)
        try {
          const clientsData = await getClients()
          setClients(clientsData)
        } catch (error) {
          console.error('Failed to load clients:', error)
        } finally {
          setLoadingClients(false)
        }
      }
    }
    
    if (props.open) {
      loadFieldDefinitions()
      loadClients()
      
      // Load entity-specific data
      if (props.entityType === 'item' && props.item) {
        setSelectedCategoryId(props.item.category_id || '')
        // Load images and documents
        setCurrentImages(
          props.item.images?.map(img => ({
            id: img.id,
            url: img.storage_url || '',
            file_name: img.original_name,
            file_size: img.file_size ? parseInt(img.file_size.toString()) : null,
            mime_type: img.mime_type,
            is_primary: img.is_primary,
            position: img.position,
            title: img.title,
            alt_text: img.alt_text,
            width: img.width,
            height: img.height
          })) || props.item.item_images || []
        )
        setCurrentDocuments(
          props.item.documents?.map(doc => ({
            id: doc.id,
            url: doc.storage_url || '',
            file_name: doc.original_name,
            file_size: doc.file_size ? parseInt(doc.file_size.toString()) : null,
            mime_type: doc.mime_type,
            title: doc.title,
            description: doc.description
          })) || []
        )
      } else if (props.entityType === 'incident' && props.incident) {
        // Load incident images
        setCurrentImages(
          props.incident.centralizedImages?.map(img => ({
            id: img.id,
            url: img.storage_url || '',
            file_name: img.original_name,
            file_size: img.file_size ? parseInt(img.file_size) : null,
            mime_type: img.mime_type,
            title: img.title,
            alt_text: img.alt_text,
            width: img.width,
            height: img.height,
            position: img.position || 0
          })) || props.incident.images || []
        )
      }
      
      // Reset pending uploads
      setPendingImageUploads([])
      setPendingDocumentUploads([])
      setHasChanges(false)
      
      // Load draft for items
      if (props.entityType === 'item' && isCreateMode) {
        loadDraft()
      }
    } else {
      // Clear temporary files when closing
      if (isCreateMode) {
        clearTemporaryFiles()
      }
    }
  }, [props.open, selectedBook, props.entityType, effectiveMode])
  
  // Update local state when entity data changes (for real-time updates)
  useEffect(() => {
    if (!isReorderingRef.current && entityData && effectiveMode === 'view') {
      if (props.entityType === 'item' && 'images' in entityData) {
        const itemData = entityData as ItemData
        setCurrentImages(
          itemData.images?.map(img => ({
            id: img.id,
            url: img.storage_url || '',
            file_name: img.original_name,
            file_size: img.file_size ? parseInt(img.file_size.toString()) : null,
            mime_type: img.mime_type,
            is_primary: img.is_primary,
            position: img.position,
            title: img.title,
            alt_text: img.alt_text,
            width: img.width,
            height: img.height
          })) || itemData.item_images || []
        )
        setCurrentDocuments(
          itemData.documents?.map(doc => ({
            id: doc.id,
            url: doc.storage_url || '',
            file_name: doc.original_name,
            file_size: doc.file_size ? parseInt(doc.file_size.toString()) : null,
            mime_type: doc.mime_type,
            title: doc.title,
            description: doc.description
          })) || []
        )
      } else if (props.entityType === 'incident' && 'centralizedImages' in entityData) {
        const incidentData = entityData as IncidentData
        setCurrentImages(
          incidentData.centralizedImages?.map(img => ({
            id: img.id,
            url: img.storage_url || '',
            file_name: img.original_name,
            file_size: img.file_size ? parseInt(img.file_size) : null,
            mime_type: img.mime_type,
            title: img.title,
            alt_text: img.alt_text,
            width: img.width,
            height: img.height,
            position: img.position || 0
          })) || incidentData.images || []
        )
      }
    }
  }, [entityData, effectiveMode, props.entityType])
  
  // Draft functionality for items
  const saveDraft = (formData: FormData) => {
    if (props.entityType === 'item' && isCreateMode && typeof window !== 'undefined') {
      const draft = {
        itemNumber: formData.get('itemNumber'),
        description: formData.get('description'),
        categoryId: selectedCategoryId,
        color: formData.get('color'),
        grade: formData.get('grade'),
        purchasePrice: formData.get('purchasePrice'),
        purchaseDate: formData.get('purchaseDate'),
        imageFiles: imageFiles.length,
        documentFiles: documentFiles.length,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem('item-draft', JSON.stringify(draft))
    }
  }
  
  const loadDraft = () => {
    if (props.entityType === 'item' && isCreateMode && typeof window !== 'undefined') {
      const savedDraft = localStorage.getItem('item-draft')
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft)
          const draftAge = new Date().getTime() - new Date(draft.timestamp).getTime()
          if (draftAge < 24 * 60 * 60 * 1000) {
            // Apply draft after a short delay
            setTimeout(() => {
              const form = document.querySelector('form') as HTMLFormElement
              if (form) {
                if (draft.itemNumber) (form.elements.namedItem('itemNumber') as HTMLInputElement).value = draft.itemNumber as string
                if (draft.description) (form.elements.namedItem('description') as HTMLTextAreaElement).value = draft.description as string
                if (draft.color) (form.elements.namedItem('color') as HTMLInputElement).value = draft.color as string
                if (draft.grade) (form.elements.namedItem('grade') as HTMLInputElement).value = draft.grade as string
                if (draft.purchasePrice) (form.elements.namedItem('purchasePrice') as HTMLInputElement).value = draft.purchasePrice as string
                if (draft.purchaseDate) (form.elements.namedItem('purchaseDate') as HTMLInputElement).value = draft.purchaseDate as string
                if (draft.categoryId) setSelectedCategoryId(draft.categoryId)
              }
            }, 100)
          } else {
            localStorage.removeItem('item-draft')
          }
        } catch (error) {
          localStorage.removeItem('item-draft')
        }
      }
    }
  }
  
  // Auto-save draft for items
  useEffect(() => {
    if (props.entityType === 'item' && isCreateMode && props.open) {
      const timeoutId = setTimeout(() => {
        const form = document.querySelector('form') as HTMLFormElement
        if (form) {
          const formData = new FormData(form)
          saveDraft(formData)
        }
      }, 1000)
      
      return () => clearTimeout(timeoutId)
    }
  }, [imageFiles, documentFiles, selectedCategoryId, effectiveMode, props.open, props.entityType])
  
  // File handling
  const handleImageFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return
    
    const validFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
    )
    
    if (validFiles.length === 0) {
      event.target.value = ''
      return
    }
    
    const newFiles: FileUploadItem[] = []
    let processedCount = 0
    
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        newFiles.push({
          file,
          preview: e.target?.result as string,
          id: Math.random().toString(36).substring(7)
        })
        processedCount++
        
        if (processedCount === validFiles.length) {
          if (isViewMode && entityData?.id) {
            setPendingImageUploads(prev => [...prev, ...newFiles])
            setHasChanges(true)
          } else {
            setImageFiles(prev => [...prev, ...newFiles])
          }
        }
      }
      reader.readAsDataURL(file)
    })
    
    event.target.value = ''
  }
  
  const handleDocumentFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return
    
    const validFiles = Array.from(files).filter(file => file.size <= 10 * 1024 * 1024)
    
    const newFiles: FileUploadItem[] = validFiles.map(file => ({
      file,
      preview: undefined,
      id: Math.random().toString(36).substring(7)
    }))
    
    if (isViewMode && entityData?.id) {
      setPendingDocumentUploads(prev => [...prev, ...newFiles])
      setHasChanges(true)
    } else {
      setDocumentFiles(prev => [...prev, ...newFiles])
    }
    
    event.target.value = ''
  }
  
  const removeImageFile = (id: string) => {
    setImageFiles(prev => prev.filter(f => f.id !== id))
  }
  
  const removePendingImageFile = (id: string) => {
    setPendingImageUploads(prev => prev.filter(f => f.id !== id))
    if (pendingImageUploads.length <= 1 && pendingDocumentUploads.length === 0) {
      setHasChanges(false)
    }
  }
  
  const clearTemporaryFiles = () => {
    setImageFiles([])
    setDocumentFiles([])
  }
  
  // Handle image reordering
  const handleImageReorder = async (dragIndex: number, dropIndex: number) => {
    if (dragIndex === dropIndex || !entityData?.id) return
    
    isReorderingRef.current = true
    
    const newImages = [...currentImages]
    const [removed] = newImages.splice(dragIndex, 1)
    newImages.splice(dropIndex, 0, removed)
    
    const reorderedImages = newImages.map((img, index) => ({
      ...img,
      position: index
    }))
    
    setCurrentImages(reorderedImages)
    
    const imagePositions = reorderedImages.map((img, index) => ({
      imageId: img.id,
      position: index
    }))
    
    try {
      const success = await reorderCentralizedImages(imagePositions)
      
      if (!success) {
        console.error('Failed to reorder images')
        setCurrentImages(currentImages)
        toast.error('Failed to reorder images')
      } else {
        if (props.onUpdate) {
          props.onUpdate()
        }
      }
    } catch (error) {
      console.error('Error reordering images:', error)
      setCurrentImages(currentImages)
      toast.error('Failed to reorder images')
    } finally {
      setTimeout(() => {
        isReorderingRef.current = false
      }, 2000)
    }
  }
  
  // Delete uploaded image
  const deleteUploadedImage = async (imageId: string) => {
    try {
      const success = await deleteCentralizedImage(imageId)
      
      if (success) {
        setCurrentImages(prev => prev.filter(img => img.id !== imageId))
      } else {
        console.error('Failed to delete image')
        toast.error('Failed to delete image')
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      toast.error('Failed to delete image')
    }
  }
  
  // Handle category creation for items
  const handleCategoryCreated = (newCategory: Category) => {
    setCategories([...categories, newCategory])
    setSelectedCategoryId(newCategory.id)
    if (isViewMode) {
      setHasChanges(true)
    }
  }
  
  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value)
    if (props.entityType === 'item' && isViewMode) {
      const itemProps = props as ItemModalProps
      setHasChanges(value !== (itemProps.item?.category_id || ''))
    }
  }
  
  // Reset form (for items)
  const handleReset = () => {
    const form = document.querySelector('form') as HTMLFormElement
    if (form) {
      form.reset()
    }
    
    setSelectedCategoryId('')
    setError(null)
    clearTemporaryFiles()
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('item-draft')
    }
  }
  
  // Submit handlers
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      const formData = new FormData(event.currentTarget)
      
      switch (props.entityType) {
        case 'item':
          await handleItemSubmit(formData)
          break
        case 'incident':
          await handleIncidentSubmit(formData)
          break
        case 'person':
          await handlePersonSubmit(formData)
          break
        case 'sale':
          await handleSaleSubmit(formData)
          break
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setError(error instanceof Error ? error.message : t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleItemSubmit = async (formData: FormData) => {
    if (!selectedBook) return
    
    formData.append('bookId', selectedBook.id)
    formData.append('categoryId', selectedCategoryId)
    
    const result = await createItem(formData)
    
    if (result.error) {
      setError(result.error)
      return
    }
    
    // Upload files if item was created successfully
    if (result.data?.id && (imageFiles.length > 0 || documentFiles.length > 0)) {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        if (imageFiles.length > 0) {
          const imageTypeId = await getOrCreateImageType('item')
          if (imageTypeId) {
            await uploadCentralizedImages(
              imageFiles,
              imageTypeId,
              'item',
              result.data.id,
              user.id,
              'items'
            )
          }
        }
        
        if (documentFiles.length > 0) {
          const documentTypeId = await getOrCreateDocumentType('item')
          if (documentTypeId) {
            await uploadCentralizedDocuments(
              documentFiles,
              documentTypeId,
              'item',
              result.data.id,
              user.id,
              'items'
            )
          }
        }
      }
    }
    
    clearTemporaryFiles()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('item-draft')
    }
    
    props.onOpenChange(false)
    router.refresh()
  }
  
  const handleIncidentSubmit = async (formData: FormData) => {
    const incidentProps = props as IncidentModalProps
    if (!incidentProps.item) {
      toast.error(t('incidents.pleaseSelectItem'))
      return
    }
    
    const incidentTypeValue = formData.get('incidentType') as string
    const descriptionValue = formData.get('description') as string
    const incidentDateValue = formData.get('incidentDate') as string
    const reportedByValue = formData.get('reportedBy') as string
    
    if (!incidentTypeValue || !descriptionValue) {
      toast.error(t('incidents.pleaseRequiredFields'))
      return
    }
    
    const result = await reportItemIncident({
      itemId: incidentProps.item.id,
      incidentType: incidentTypeValue,
      description: descriptionValue,
      incidentDate: new Date(incidentDateValue),
      reportedBy: reportedByValue || 'User'
    })
    
    // Upload images if incident was created successfully
    if (result?.id && imageFiles.length > 0) {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const imageTypeId = await getOrCreateImageType('incident')
        if (imageTypeId) {
          await uploadCentralizedImages(
            imageFiles,
            imageTypeId,
            'incident',
            result.id,
            user.id,
            'incidents'
          )
        }
      }
    }
    
    toast.success(t('incidents.incidentReported'))
    props.onOpenChange(false)
    
    if (props.onUpdate) {
      props.onUpdate()
    }
    
    clearTemporaryFiles()
  }
  
  const handlePersonSubmit = async (formData: FormData) => {
    const personProps = props as PersonModalProps
    
    // Rename fields to match server action expectations
    const submitData = new FormData()
    submitData.append('personTypeId', formData.get('person_type_id') as string)
    submitData.append('name', formData.get('name') as string)
    submitData.append('lastname', formData.get('lastname') as string || '')
    submitData.append('phone', formData.get('phone') as string || '')
    submitData.append('website', formData.get('website') as string || '')
    submitData.append('specialization', formData.get('specialization') as string || '')
    submitData.append('addressLine1', formData.get('address_line_1') as string || '')
    submitData.append('addressLine2', formData.get('address_line_2') as string || '')
    submitData.append('zipcode', formData.get('zipcode') as string || '')
    submitData.append('country', formData.get('country') as string || '')
    
    let result
    if (personProps.person && effectiveMode === 'edit') {
      result = await updatePerson(personProps.person.id, submitData)
    } else {
      result = await createPerson(submitData)
    }
    
    if (result.error) {
      setError(result.error)
    } else {
      props.onOpenChange(false)
      setIsEditMode(false)
      window.location.reload()
    }
  }
  
  const handleSaleSubmit = async (formData: FormData) => {
    const saleProps = props as SaleModalProps
    
    formData.append('item_id', saleProps.item.id)
    
    const result = await createSale(formData)
    
    if (result.error) {
      setError(result.error)
    } else {
      props.onOpenChange(false)
      window.location.reload()
    }
  }
  
  // Update handler for view mode
  const handleUpdate = async () => {
    if (!entityData || (!hasChanges && pendingImageUploads.length === 0 && pendingDocumentUploads.length === 0)) return
    
    const hasFileUploads = pendingImageUploads.length > 0 || pendingDocumentUploads.length > 0
    
    if (hasFileUploads) {
      isReorderingRef.current = true
    }
    
    setIsLoading(true)
    setIsUploading(true)
    setError(null)
    
    try {
      // Upload pending images
      if (pendingImageUploads.length > 0) {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const imageTypeId = await getOrCreateImageType(props.entityType)
          if (imageTypeId) {
            const result = await uploadCentralizedImages(
              pendingImageUploads,
              imageTypeId,
              props.entityType,
              entityData.id,
              user.id,
              props.entityType === 'person' ? 'persons' : `${props.entityType}s`
            )
            
            if (result.success && result.images) {
              const newImages = result.images.map(img => ({
                id: img.id,
                url: img.storage_url || '',
                file_name: img.original_name,
                file_size: img.file_size ? parseInt(img.file_size) : null,
                mime_type: img.mime_type,
                is_primary: img.is_primary,
                position: img.position,
                title: img.title,
                alt_text: img.alt_text,
                width: img.width,
                height: img.height
              }))
              setCurrentImages(prev => [...prev, ...newImages])
            }
          }
        }
      }
      
      // Upload pending documents (only for items)
      if (props.entityType === 'item' && pendingDocumentUploads.length > 0) {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const documentTypeId = await getOrCreateDocumentType('item')
          if (documentTypeId) {
            const result = await uploadCentralizedDocuments(
              pendingDocumentUploads,
              documentTypeId,
              'item',
              entityData.id,
              user.id,
              'items'
            )
            
            if (result.success && result.documents) {
              const newDocuments = result.documents.map(doc => ({
                id: doc.id,
                url: doc.storage_url || '',
                file_name: doc.original_name,
                file_size: doc.file_size ? parseInt(doc.file_size) : null,
                mime_type: doc.mime_type,
                title: doc.title,
                description: doc.description
              }))
              setCurrentDocuments(prev => [...prev, ...newDocuments])
            }
          }
        }
      }
      
      // Update category for items
      if (props.entityType === 'item' && 'category_id' in entityData) {
        const itemData = entityData as ItemData
        if (selectedCategoryId !== itemData.category_id) {
          const result = await updateItemCategory(entityData.id, selectedCategoryId || null)
          if (result.error) {
            setError(result.error)
            isReorderingRef.current = false
            return
          }
        }
      }
      
      setPendingImageUploads([])
      setPendingDocumentUploads([])
      setHasChanges(false)
      
      if (props.onUpdate) {
        props.onUpdate()
      }
      
      toast.success(`${props.entityType.charAt(0).toUpperCase() + props.entityType.slice(1)} updated successfully`)
    } catch {
      setError(t('common.error'))
      isReorderingRef.current = false
    } finally {
      setIsLoading(false)
      setIsUploading(false)
      if (hasFileUploads) {
        setTimeout(() => {
          isReorderingRef.current = false
        }, 2000)
      }
    }
  }
  
  // Render entity-specific content
  const renderEntityContent = () => {
    switch (props.entityType) {
      case 'item':
        return renderItemContent()
      case 'incident':
        return renderIncidentContent()
      case 'person':
        return renderPersonContent()
      case 'sale':
        return renderSaleContent()
      default:
        return null
    }
  }
  
  const renderItemContent = () => {
    const itemProps = props as ItemModalProps
    const item = itemProps.item
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left Column - All Details in One Card */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">{t('items.details')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="itemNumber">{t('items.itemNumber')}</Label>
                  <Input
                    id="itemNumber"
                    name="itemNumber"
                    placeholder={t('items.itemNumberPlaceholder')}
                    defaultValue={isViewMode ? item?.item_number || '' : ''}
                    readOnly={isViewMode}
                    className={isViewMode ? 'bg-muted' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryId">{t('items.category')}</Label>
                  <div className="flex gap-2">
                    <Select 
                      name="categoryId" 
                      value={selectedCategoryId}
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={t('items.selectCategory')} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setShowCategoryModal(true)}
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  {t('items.description')}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder={t('items.descriptionPlaceholder')}
                  rows={4}
                  required={isCreateMode}
                  defaultValue={isViewMode ? item?.description || '' : ''}
                  readOnly={isViewMode}
                  className={isViewMode ? 'bg-muted' : ''}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">{t('items.color')}</Label>
                  <Input
                    id="color"
                    name="color"
                    placeholder={t('items.colorPlaceholder')}
                    defaultValue={isViewMode ? item?.color || '' : ''}
                    readOnly={isViewMode}
                    className={isViewMode ? 'bg-muted' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade">{t('items.grade')}</Label>
                  <Input
                    id="grade"
                    name="grade"
                    placeholder={t('items.gradePlaceholder')}
                    defaultValue={isViewMode ? item?.grade || '' : ''}
                    readOnly={isViewMode}
                    className={isViewMode ? 'bg-muted' : ''}
                  />
                </div>
              </div>

              {/* Custom Fields */}
              {fieldDefinitions.length > 0 && (
                <div className="space-y-4 mt-4">
                  {fieldDefinitions.map(field => renderFieldInput(field, item))}
                </div>
              )}

              {/* Purchase Information */}
              <Separator className="my-6" />
              <h3 className="text-sm font-medium mb-4">{t('items.purchaseInfo')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">{t('items.purchasePrice')}</Label>
                  <Input
                    id="purchasePrice"
                    name="purchasePrice"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    defaultValue={isViewMode && item?.item_purchases?.[0]?.purchase_price ? item.item_purchases[0].purchase_price.toString() : ''}
                    readOnly={isViewMode}
                    className={isViewMode ? 'bg-muted' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">{t('items.purchaseDate')}</Label>
                  <Input
                    id="purchaseDate"
                    name="purchaseDate"
                    type="date"
                    defaultValue={isViewMode && item?.item_purchases?.[0]?.purchase_date ? new Date(item.item_purchases[0].purchase_date).toISOString().split('T')[0] : ''}
                    readOnly={isViewMode}
                    className={isViewMode ? 'bg-muted' : ''}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Media */}
        <div className="space-y-6">
          {/* Images Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('items.images')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isViewMode ? (
                currentImages.length > 0 || pendingImageUploads.length > 0 ? (
                  <MediaGrid
                    images={currentImages}
                    pendingUploads={pendingImageUploads}
                    onImageClick={setSelectedImage}
                    onReorder={handleImageReorder}
                    onDelete={deleteUploadedImage}
                    onFileSelect={handleImageFileSelect}
                    onRemovePending={removePendingImageFile}
                    isUploading={isUploading}
                    isDraggable={true}
                    showPrimaryLabel={true}
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No images uploaded
                  </p>
                )
              ) : (
                <MediaGrid
                  images={imageFiles.map(f => ({
                    id: f.id,
                    url: f.preview || '',
                    file_name: f.file.name,
                    file_size: f.file.size,
                    mime_type: f.file.type
                  }))}
                  pendingUploads={[]}
                  onImageClick={setSelectedImage}
                  onDelete={(id) => removeImageFile(id)}
                  onFileSelect={handleImageFileSelect}
                  onRemovePending={() => {}}
                  isDraggable={false}
                  showPrimaryLabel={false}
                />
              )}
            </CardContent>
          </Card>

          {/* Documents Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('items.documents')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isViewMode ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {currentDocuments.map((document) => (
                    <div key={document.id} className="relative">
                      <div 
                        className="aspect-square bg-muted rounded-lg border border-border flex flex-col items-center justify-center p-2 cursor-pointer hover:bg-muted/80 transition-colors"
                        onClick={() => setSelectedDocument({ 
                          url: document.url, 
                          fileName: document.file_name,
                          title: document.title
                        })}
                      >
                        <FileText className="w-8 h-8 text-muted-foreground mb-1" />
                        <p className="text-xs text-center text-muted-foreground truncate w-full">
                          {document.title}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{document.file_name}</p>
                    </div>
                  ))}
                  
                  {/* Show pending document uploads */}
                  {pendingDocumentUploads.map((fileItem) => (
                    <div key={fileItem.id} className="relative group">
                      <div className="aspect-square bg-muted rounded-lg border border-border border-dashed flex flex-col items-center justify-center p-2">
                        <FileText className="w-8 h-8 text-muted-foreground mb-1 opacity-60" />
                        <p className="text-xs text-center text-muted-foreground truncate w-full opacity-60">
                          {fileItem.file.name}
                        </p>
                        <span className="text-xs text-muted-foreground bg-muted-foreground/20 px-2 py-0.5 rounded mt-1">
                          {t('common.pending')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingDocumentUploads(prev => prev.filter(f => f.id !== fileItem.id))
                          if (pendingDocumentUploads.length === 1 && pendingImageUploads.length === 0) {
                            setHasChanges(false)
                          }
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  {/* Add new document button */}
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                      multiple
                      onChange={handleDocumentFileSelect}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="aspect-square border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
                      <Plus className="w-6 h-6 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              ) : (
                renderDocumentGrid()
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
  
  // Incident-specific state (moved outside of function to avoid hooks rules violation)
  const incidentProps = props.entityType === 'incident' ? props as IncidentModalProps : null
  const incident = incidentProps?.incident
  const [incidentType, setIncidentType] = useState('')
  const [incidentDescription, setIncidentDescription] = useState('')
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0])
  const [reportedBy, setReportedBy] = useState('')
  const [resolutionStatus, setResolutionStatus] = useState('')
  
  // Update incident state when data changes
  useEffect(() => {
    if (props.entityType === 'incident' && incident) {
      setIncidentType(incident.incident_type || '')
      setIncidentDescription(incident.description || '')
      setIncidentDate(incident.incident_date ? new Date(incident.incident_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
      setReportedBy(incident.reported_by || '')
      setResolutionStatus(incident.resolution_status || '')
    }
  }, [props.entityType, incident])
  
  const renderIncidentContent = () => {
    if (props.entityType !== 'incident') return null
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left Column - Form Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t('incidents.incidentInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="incidentType">{t('incidents.incidentTypeRequired')}</Label>
                <Select 
                  name="incidentType"
                  value={incidentType} 
                  onValueChange={(value) => {
                    setIncidentType(value)
                    if (effectiveMode === 'view' || effectiveMode === 'edit') setHasChanges(true)
                  }} 
                  disabled={isViewMode}
                >
                  <SelectTrigger className={isViewMode ? 'bg-muted' : ''}>
                    <SelectValue placeholder={t('incidents.selectIncidentType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="damage">{t('incidents.damage')}</SelectItem>
                    <SelectItem value="loss">{t('incidents.loss')}</SelectItem>
                    <SelectItem value="theft">{t('incidents.theft')}</SelectItem>
                    <SelectItem value="maintenance">{t('incidents.maintenance')}</SelectItem>
                    <SelectItem value="quality">{t('incidents.quality')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="incidentDate">{t('incidents.incidentDate')}</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="incidentDate"
                    name="incidentDate"
                    type="date"
                    value={incidentDate}
                    onChange={(e) => {
                      setIncidentDate(e.target.value)
                      if (effectiveMode === 'view' || effectiveMode === 'edit') setHasChanges(true)
                    }}
                    className={`pl-10 ${isViewMode ? 'bg-muted' : ''}`}
                    readOnly={isViewMode}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reportedBy">{t('incidents.reportedBy')}</Label>
                <Input
                  id="reportedBy"
                  name="reportedBy"
                  value={reportedBy}
                  onChange={(e) => {
                    setReportedBy(e.target.value)
                    if (effectiveMode === 'view' || effectiveMode === 'edit') setHasChanges(true)
                  }}
                  placeholder={t('incidents.reportedByPlaceholder')}
                  className={isViewMode ? 'bg-muted' : ''}
                  readOnly={isViewMode}
                />
              </div>

              {effectiveMode !== 'create' && (
                <div className="space-y-2">
                  <Label htmlFor="resolutionStatus">{t('incidents.resolutionStatus')}</Label>
                  <Select 
                    name="resolutionStatus"
                    value={resolutionStatus} 
                    onValueChange={(value) => {
                      setResolutionStatus(value)
                      if (effectiveMode === 'view' || effectiveMode === 'edit') setHasChanges(true)
                    }} 
                    disabled={isViewMode}
                  >
                    <SelectTrigger className={isViewMode ? 'bg-muted' : ''}>
                      <SelectValue placeholder={t('incidents.selectStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">{t('incidents.open')}</SelectItem>
                      <SelectItem value="resolved">{t('incidents.resolved')}</SelectItem>
                      <SelectItem value="closed">{t('incidents.closed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">{t('incidents.incidentDescriptionRequired')}</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={incidentDescription}
                  onChange={(e) => {
                    setIncidentDescription(e.target.value)
                    if (effectiveMode === 'view' || effectiveMode === 'edit') setHasChanges(true)
                  }}
                  placeholder={t('incidents.incidentDescriptionPlaceholder')}
                  rows={6}
                  required={isCreateMode}
                  className={isViewMode ? 'bg-muted' : ''}
                  readOnly={isViewMode}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Images */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Image className="h-5 w-5" />
                {t('incidents.images')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isViewMode ? (
                currentImages.length > 0 || pendingImageUploads.length > 0 ? (
                  <MediaGrid
                    images={currentImages}
                    pendingUploads={pendingImageUploads}
                    onImageClick={setSelectedImage}
                    onReorder={handleImageReorder}
                    onDelete={undefined} // No delete for incidents
                    onFileSelect={handleImageFileSelect}
                    onRemovePending={removePendingImageFile}
                    isUploading={isUploading}
                    isDraggable={true}
                    showPrimaryLabel={true}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>{t('incidents.noImagesAvailable')}</p>
                    <div className="mt-4">
                      <div className="relative inline-block">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageFileSelect}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          disabled={isUploading}
                        />
                        <div className="px-4 py-2 border-2 border-dashed border-muted-foreground/30 rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
                          <Plus className="w-4 h-4 inline mr-2" />
                          {t('incidents.addImages')}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <MediaGrid
                  images={imageFiles.map(f => ({
                    id: f.id,
                    url: f.preview || '',
                    file_name: f.file.name,
                    file_size: f.file.size,
                    mime_type: f.file.type
                  }))}
                  pendingUploads={[]}
                  onImageClick={setSelectedImage}
                  onDelete={(id) => removeImageFile(id)}
                  onFileSelect={handleImageFileSelect}
                  onRemovePending={() => {}}
                  isDraggable={false}
                  showPrimaryLabel={false}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
  
  const renderPersonContent = () => {
    const personProps = props as PersonModalProps
    const person = personProps.person
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('people.personDetails')}</CardTitle>
              <CardDescription>{t('common.requiredFields')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('people.name')} *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder={t('people.namePlaceholder')}
                    defaultValue={person?.name || ''}
                    required
                    disabled={isViewMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastname">{t('people.lastname')}</Label>
                  <Input
                    id="lastname"
                    name="lastname"
                    placeholder={t('people.lastnamePlaceholder')}
                    defaultValue={person?.lastname || ''}
                    disabled={isViewMode}
                  />
                </div>
              </div>

              {/* Hidden input for person type */}
              <input 
                type="hidden" 
                name="person_type_id" 
                value={person?.person_type_id || personProps.preselectedTypeId || ''} 
              />

              <div className="space-y-2">
                <Label htmlFor="specialization">{t('people.specialization')}</Label>
                <Input
                  id="specialization"
                  name="specialization"
                  placeholder={t('people.specializationPlaceholder')}
                  defaultValue={person?.specialization || ''}
                  disabled={isViewMode}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('people.contactInformation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{t('people.phone')}</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder={t('people.phonePlaceholder')}
                  defaultValue={person?.phone || ''}
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">{t('people.website')}</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  placeholder={t('people.websitePlaceholder')}
                  defaultValue={person?.website || ''}
                  disabled={isViewMode}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('people.addressInformation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address_line_1">{t('people.addressLine1')}</Label>
                <Input
                  id="address_line_1"
                  name="address_line_1"
                  placeholder={t('people.addressLine1Placeholder')}
                  defaultValue={person?.address_line_1 || ''}
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_line_2">{t('people.addressLine2')}</Label>
                <Input
                  id="address_line_2"
                  name="address_line_2"
                  placeholder={t('people.addressLine2Placeholder')}
                  defaultValue={person?.address_line_2 || ''}
                  disabled={isViewMode}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zipcode">{t('people.zipcode')}</Label>
                  <Input
                    id="zipcode"
                    name="zipcode"
                    placeholder={t('people.zipcodePlaceholder')}
                    defaultValue={person?.zipcode || ''}
                    disabled={isViewMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">{t('people.country')}</Label>
                  <Input
                    id="country"
                    name="country"
                    placeholder={t('people.countryPlaceholder')}
                    defaultValue={person?.country || ''}
                    disabled={isViewMode}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    )
  }
  
  const renderDocumentGrid = () => {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {documentFiles.map((fileItem) => (
          <div key={fileItem.id} className="relative">
            <div 
              className="aspect-square bg-muted rounded-lg border border-border flex flex-col items-center justify-center p-2 cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => setSelectedDocument({ url: URL.createObjectURL(fileItem.file), fileName: fileItem.file.name })}
            >
              <FileText className="w-8 h-8 text-muted-foreground mb-1" />
              <p className="text-xs text-center text-muted-foreground truncate w-full">
                {fileItem.file.name}
              </p>
            </div>
          </div>
        ))}
        
        {/* Add new document button */}
        <div className="relative">
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
            multiple
            onChange={handleDocumentFileSelect}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="aspect-square border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
            <Plus className="w-6 h-6 text-muted-foreground" />
          </div>
        </div>
      </div>
    )
  }
  
  const renderSaleContent = () => {
    const saleProps = props as SaleModalProps
    const item = saleProps.item
    const today = new Date().toISOString().split('T')[0]
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('items.itemInformation', 'Item Information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('items.itemNumber')}</Label>
                <div className="p-2 bg-muted rounded-md">
                  {item.item_number || '-'}
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('items.description')}</Label>
                <div className="p-2 bg-muted rounded-md">
                  {item.description || '-'}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('items.category')}</Label>
                  <div className="p-2 bg-muted rounded-md">
                    {item.category?.name || '-'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('items.color')}</Label>
                  <div className="p-2 bg-muted rounded-md">
                    {item.color || '-'}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('items.grade')}</Label>
                <div className="p-2 bg-muted rounded-md">
                  {item.grade || '-'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('items.saleInformation', 'Sale Information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sale_price">{t('items.salePrice')} *</Label>
                <Input
                  id="sale_price"
                  name="sale_price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sale_date">{t('items.saleDate')} *</Label>
                <Input
                  id="sale_date"
                  name="sale_date"
                  type="date"
                  defaultValue={today}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_id">{t('items.client', 'Client')}</Label>
                {loadingClients ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      {t('common.loading')}...
                    </span>
                  </div>
                ) : (
                  <Select name="client_id">
                    <SelectTrigger>
                      <SelectValue placeholder={t('items.selectClient', 'Select a client (optional)')} />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} {client.lastname || ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">{t('items.paymentMethod', 'Payment Method')}</Label>
                <Select name="payment_method">
                  <SelectTrigger>
                    <SelectValue placeholder={t('items.selectPaymentMethod', 'Select payment method (optional)')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{t('items.cash', 'Cash')}</SelectItem>
                    <SelectItem value="card">{t('items.card', 'Card')}</SelectItem>
                    <SelectItem value="check">{t('items.check', 'Check')}</SelectItem>
                    <SelectItem value="bank_transfer">{t('items.bankTransfer', 'Bank Transfer')}</SelectItem>
                    <SelectItem value="other">{t('items.other', 'Other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sale_location">{t('items.saleLocationLabel', 'Sale Location')}</Label>
                <Input
                  id="sale_location"
                  name="sale_location"
                  placeholder={t('items.saleLocationPlaceholder', 'e.g., Store, Online, Fair')}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const renderFieldInput = (field: FieldDefinition, item?: ItemData) => {
    const fieldId = `field_${field.id}`
    const label = field.field_label || field.field_name
    const currentValue = isViewMode && item?.item_attributes 
      ? item.item_attributes.find(attr => attr.field_definition_id === field.id)?.value || ''
      : (field.default_value || '')
    
    switch (field.field_type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId}>
              {label}
              {field.is_required && !isViewMode && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldId}
              name={fieldId}
              defaultValue={currentValue}
              required={field.is_required || false}
              disabled={isViewMode}
            />
          </div>
        )
      
      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId}>
              {label}
              {field.is_required && !isViewMode && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={fieldId}
              name={fieldId}
              defaultValue={currentValue}
              required={field.is_required || false}
              disabled={isViewMode}
              rows={3}
            />
          </div>
        )
      
      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId}>
              {label}
              {field.is_required && !isViewMode && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldId}
              name={fieldId}
              type="number"
              defaultValue={currentValue}
              required={field.is_required || false}
              disabled={isViewMode}
            />
          </div>
        )
      
      default:
        return null
    }
  }
  
  // Determine footer style - use gray footer for all create modes and person edit mode
  const shouldUseGrayFooter = effectiveMode === 'create' || (props.entityType === 'person' && effectiveMode === 'edit')
  
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent 
        className="!max-w-[calc(100vw-1rem)] w-[calc(100vw-1rem)] h-[95vh] p-0 gap-0
                   sm:!max-w-[calc(100vw-2rem)] sm:w-[calc(100vw-2rem)] sm:h-[90vh]
                   lg:!max-w-[calc(100vw-4rem)] lg:w-[calc(100vw-4rem)] flex flex-col"
>
          <DialogHeader className="px-3 py-3 sm:px-6 sm:py-4 border-b flex-shrink-0">
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex items-center gap-3">
                <div className={`${headerInfo.iconBgColor === 'text-white' ? headerInfo.iconBgColor : `w-8 h-8 sm:w-10 sm:h-10 ${headerInfo.iconBgColor} rounded-full flex items-center justify-center`}`}>
                  <HeaderIcon className={`${headerInfo.iconBgColor === 'text-white' ? 'h-4 w-4 sm:h-5 sm:w-5' : `w-4 h-4 sm:w-5 sm:h-5 ${headerInfo.iconColor}`}`} />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl">
                    {headerInfo.getTitle()}
                  </DialogTitle>
                  {headerInfo.getDescription() && (
                    <DialogDescription className="text-sm">
                      {headerInfo.getDescription()}
                    </DialogDescription>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:mr-8">
                {/* Reset button for items and persons in create mode */}
                {(props.entityType === 'item' || props.entityType === 'person') && isCreateMode && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {t('common.reset')}
                  </Button>
                )}
                
                {/* Edit button for person in view mode */}
                {props.entityType === 'person' && props.mode === 'view' && !isEditMode && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditMode(true)}
                  >
                    {t('common.edit')}
                  </Button>
                )}
                
                {/* Update button in header for items/incidents in view mode with changes */}
                {props.entityType !== 'person' && isViewMode && (hasChanges || pendingImageUploads.length > 0 || pendingDocumentUploads.length > 0) && (
                  <Button 
                    onClick={handleUpdate}
                    disabled={isLoading || isUploading}
                    size="lg"
                  >
                    {isLoading || isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isUploading ? t('common.uploading') : t('common.saving')}
                      </>
                    ) : (
                      props.entityType === 'item' ? t('items.updateCategory') : 'Update'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <form id="entity-form" onSubmit={handleSubmit} className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 sm:p-6 lg:p-8">
                {error && (
                  <Alert variant="destructive" className="mb-4 sm:mb-6">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {renderEntityContent()}
              </div>
            </ScrollArea>

          </form>

          {/* Footer Actions - Outside form but inside dialog */}
          <div className={`border-t px-3 py-3 sm:px-6 sm:py-4 flex-shrink-0 ${shouldUseGrayFooter ? 'bg-gray-50 dark:bg-gray-900/50' : ''}`}>
            <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
              <div>
                {shouldUseGrayFooter && (
                  <p className="text-sm text-muted-foreground">
                    {t('common.requiredFields')}
                  </p>
                )}
              </div>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:gap-3 w-full sm:w-auto">
                {!isViewMode && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      props.onOpenChange(false)
                      if (props.entityType === 'person') {
                        setIsEditMode(props.mode === 'create')
                      }
                    }}
                    disabled={isLoading}
                  >
                    {t('common.cancel')}
                  </Button>
                )}
                {isViewMode && !hasChanges && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => props.onOpenChange(false)}
                  >
                    {t('common.close')}
                  </Button>
                )}
                
                {/* Submit button in footer for all entity types in create/edit mode */}
                {!isViewMode && (
                  <Button 
                    type="submit"
                    form="entity-form"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {props.entityType === 'incident' 
                      ? effectiveMode === 'create' ? t('incidents.reportIncident') : t('incidents.updateIncident')
                      : props.entityType === 'person' 
                        ? effectiveMode === 'create' ? t('people.createPerson') : t('people.updatePerson')
                        : props.entityType === 'item'
                          ? effectiveMode === 'create' ? t('items.createItem') : t('items.updateItem')
                          : props.entityType === 'sale'
                            ? t('items.recordSale', 'Record Sale')
                            : 'Submit'
                    }
                  </Button>
                )}
                
                {/* Update button in footer for incidents in view mode */}
                {props.entityType === 'incident' && isViewMode && hasChanges && (
                  <Button onClick={handleUpdate} disabled={isLoading || isUploading}>
                    {isLoading || isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {pendingImageUploads.length > 0 ? t('incidents.uploading') : t('incidents.updating')}
                      </>
                    ) : (
                      pendingImageUploads.length > 0 ? t('incidents.uploadImages') : t('incidents.updateIncident')
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
      </DialogContent>
      
      {/* Category Modal - renders on top */}
      {props.entityType === 'item' && (
        <AddCategoryModal
          open={showCategoryModal}
          onOpenChange={setShowCategoryModal}
          onCategoryCreated={handleCategoryCreated}
        />
      )}
      
      {/* Image Viewer */}
      <ImageViewer
        imageUrl={selectedImage?.url || ''}
        alt={selectedImage?.alt}
        title={selectedImage?.title}
        width={selectedImage?.width}
        height={selectedImage?.height}
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
      />
      
      {/* Document Viewer */}
      <DocumentViewer
        documentUrl={selectedDocument?.url || ''}
        fileName={selectedDocument?.fileName}
        title={selectedDocument?.title}
        isOpen={!!selectedDocument}
        onClose={() => setSelectedDocument(null)}
      />
    </Dialog>
  )
}