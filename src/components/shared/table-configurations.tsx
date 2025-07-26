'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { DataTable } from './data-table'
import { 
  createTextColumn,
  createImageColumn,
  createCategoryColumn,
  createCurrencyColumn,
  createDateColumn,
  createStatusColumn,
  createPersonColumn,
  createCustomColumn,
  createViewAction,
  createEditAction,
  createDeleteAction,
  createSellAction,
  createIncidentAction,
  createInvoiceAction
} from './table-columns'
import { 
  Plus, 
  User, 
  Package, 
  AlertTriangle, 
  DollarSign,
  Tag,
  FileDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// Import modals
import { MultiSaleModal, IncidentModal, AddItemModal } from '@/components/shared/modal-configurations'
import { UnifiedEntityModal } from '@/components/modals/unified-entity-modal'
import { useRouter } from 'next/navigation'

// ============================================================================
// Categories Table
// ============================================================================

interface Category {
  id: string
  name: string
  description?: string | null
  parent_category?: {
    name: string
  } | null
  created_at: string
  _count?: {
    items: number
  }
}

interface CategoriesTableProps {
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

export function CategoriesTable({ categories, onEdit, onDelete }: CategoriesTableProps) {
  const t = useTranslations()

  const columns = [
    createTextColumn<Category>('name', t('categories.categoryName')),
    
    createTextColumn<Category>(
      'description', 
      t('categories.description'),
      {
        truncate: true,
        maxWidth: 'max-w-[300px]'
      }
    ),
    
    createCustomColumn<Category>(
      'parent_category',
      t('categories.parentCategory'),
      (category) => category.parent_category?.name || '-'
    ),
    
    createCustomColumn<Category>(
      'items_count',
      t('categories.itemsCount'),
      (category) => category._count?.items || 0,
      { align: 'center' }
    ),
    
    createDateColumn<Category>(
      'created_at',
      t('common.createdAt'),
      { relative: true }
    ),
  ]

  const actions = [
    createEditAction<Category>(onEdit, t('common.edit')),
    createDeleteAction<Category>(
      onDelete,
      {
        label: t('common.delete'),
        disabled: (category) => (category._count?.items || 0) > 0,
        disabledTooltip: t('categories.cannotDeleteWithItems')
      }
    ),
  ]

  return (
    <DataTable
      data={categories}
      columns={columns}
      keyExtractor={(category) => category.id}
      actions={actions}
      actionsDropdown={false}
      locale={t('common.locale') as 'en' | 'fr'}
      emptyState={{
        icon: Tag,
        title: t('categories.noCategories'),
        description: t('categories.noCategoriesDescription'),
      }}
    />
  )
}

// ============================================================================
// People Table
// ============================================================================

interface Person {
  id: string
  name: string
  lastname?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  created_at: string
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

interface PeopleTableProps {
  people: Person[]
  onEdit: (person: Person) => void
  onDelete: (person: Person) => void
}

export function PeopleTable({ people, onEdit, onDelete }: PeopleTableProps) {
  const t = useTranslations()

  const columns = [
    createPersonColumn<Person>(
      'name',
      t('people.name'),
      {
        nameAccessor: 'name',
        lastNameAccessor: 'lastname'
      }
    ),
    
    createTextColumn<Person>('email', t('people.email')),
    
    createTextColumn<Person>('phone', t('people.phone')),
    
    createTextColumn<Person>(
      'address', 
      t('people.address'),
      {
        truncate: true,
        maxWidth: 'max-w-[200px]'
      }
    ),
    
    createCustomColumn<Person>(
      'transactions',
      t('people.transactions'),
      (person) => {
        const purchases = person._count?.item_purchases || 0
        const sales = person._count?.item_sales || 0
        const invoices = person._count?.invoices || 0
        return (
          <div className="text-sm">
            <div>{purchases} {t('people.purchases')}</div>
            <div>{sales} {t('people.sales')}</div>
            <div>{invoices} {t('people.invoices')}</div>
          </div>
        )
      }
    ),
    
    createDateColumn<Person>(
      'created_at',
      t('common.createdAt'),
      { relative: true }
    ),
  ]

  const actions = [
    createEditAction<Person>(onEdit, t('common.edit')),
    createDeleteAction<Person>(
      onDelete,
      {
        label: t('common.delete'),
        disabled: (person) => {
          const hasTransactions = 
            (person._count?.item_purchases || 0) > 0 || 
            (person._count?.item_sales || 0) > 0 ||
            (person._count?.invoices || 0) > 0
          return hasTransactions
        },
        disabledTooltip: t('people.cannotDeleteWithTransactions')
      }
    ),
  ]

  return (
    <DataTable
      data={people}
      columns={columns}
      keyExtractor={(person) => person.id}
      actions={actions}
      actionsDropdown={false}
      locale={t('common.locale') as 'en' | 'fr'}
      emptyState={{
        icon: User,
        title: t('people.noPeople'),
        description: t('people.noPeopleDescription'),
      }}
    />
  )
}

// ============================================================================
// Items Table
// ============================================================================

interface Item {
  id: string
  item_number: string
  description?: string | null
  color?: string | null
  grade?: string | null
  category?: {
    id: string
    name: string
    parent_category?: {
      name: string
    } | null
  } | null
  item_purchases?: Array<{
    purchase_price?: number | null
    purchase_date?: string | null
  }>
  item_sales?: Array<{
    sale_price?: number | null
    sale_date?: string | null
  }>
  created_at: string
  primaryImage?: {
    id: string
    url: string
    alt_text?: string
    title?: string
  } | null
  imageCount?: number
  images?: Array<{
    id: string
    storage_url: string
    title?: string
    alt_text?: string
  }>
}

interface ItemsTableProps {
  items: Item[]
  categories?: any[]
  onUpdate?: () => void
}

export function ItemsTable({ items, categories, onUpdate }: ItemsTableProps) {
  const t = useTranslations()
  const [viewingItem, setViewingItem] = useState<Item | null>(null)
  const [sellingItem, setSellingItem] = useState<Item | null>(null)
  const [reportingIncident, setReportingIncident] = useState<Item | null>(null)

  const columns = [
    createImageColumn<Item>(
      'image',
      t('items.image'),
      {
        accessor: (item) => item.primaryImage?.url,
        titleAccessor: (item) => item.primaryImage?.title || item.item_number,
        altAccessor: (item) => item.primaryImage?.alt_text,
        countAccessor: 'imageCount',
        imagesAccessor: (item) => item.images?.map(img => ({
          url: img.storage_url,
          title: img.title,
          alt: img.alt_text
        }))
      }
    ),
    
    createTextColumn<Item>('item_number', t('items.itemNumber')),
    
    createTextColumn<Item>(
      'description',
      t('items.description'),
      {
        truncate: true,
        maxWidth: 'max-w-[300px]'
      }
    ),
    
    createCategoryColumn<Item>(
      'category',
      t('items.category'),
      {
        nameAccessor: (item) => item.category?.name,
        parentAccessor: (item) => item.category?.parent_category?.name
      }
    ),
    
    createCurrencyColumn<Item>(
      'purchase_price',
      t('items.purchasePrice'),
      {
        accessor: (item) => item.item_purchases?.[0]?.purchase_price
      }
    ),
    
    createStatusColumn<Item>(
      'status',
      t('items.status'),
      {
        'available': { label: t('items.available'), variant: 'success' },
        'sold': { label: t('items.sold'), variant: 'secondary' }
      },
      (item) => item.item_sales?.length ? 'sold' : 'available'
    ),
    
    createDateColumn<Item>(
      'created_at',
      t('items.addedDate'),
      { relative: true }
    ),
  ]

  const actions = [
    createViewAction<Item>(
      (item) => setViewingItem(item),
      t('items.viewDetails')
    ),
    createSellAction<Item>(
      (item) => setSellingItem(item),
      t('items.markAsSold')
    ),
    createIncidentAction<Item>(
      (item) => setReportingIncident(item),
      t('items.reportIncident')
    ),
  ]

  return (
    <>
      <DataTable
        data={items}
        columns={columns}
        keyExtractor={(item) => item.id}
        actions={actions}
        actionsDropdown={false}
        locale={t('common.locale') as 'en' | 'fr'}
        minWidth="800px"
        emptyState={{
          icon: Package,
          title: t('items.noItems'),
          description: t('items.noItemsDescription'),
        }}
      />
      
      {viewingItem && (
        <UnifiedEntityModal
          open={!!viewingItem}
          onOpenChange={(open) => {
            if (!open) {
              setViewingItem(null)
              // Refresh the data after closing to reflect any image changes
              onUpdate?.()
            }
          }}
          entityType="item"
          mode="view"
          item={viewingItem as any}
          categories={categories}
        />
      )}
      
      {sellingItem && (
        <MultiSaleModal
          initialItem={sellingItem}
          availableItems={items}
          open={!!sellingItem}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setSellingItem(null)
              onUpdate?.()
            }
          }}
          onSuccess={() => {
            setSellingItem(null)
            onUpdate?.()
          }}
        />
      )}
      
      {reportingIncident && (
        <IncidentModal
          item={reportingIncident}
          mode="create"
          open={!!reportingIncident}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setReportingIncident(null)
              onUpdate?.()
            }
          }}
        />
      )}
    </>
  )
}

// ============================================================================
// Sold Items Table
// ============================================================================

interface SoldItem {
  id: string
  item_number: string | null
  description: string | null
  color: string | null
  grade: string | null
  created_at: Date | null
  category: {
    id: string
    name: string
  } | null
  item_purchases: Array<{
    id: string
    purchase_price: number | null
    purchase_date: Date | null
    person: {
      id: string
      name: string
      lastname: string | null
    } | null
  }>
  item_sales: Array<{
    id: string
    sale_price: number | null
    sale_date: Date | null
    person: {
      id: string
      name: string
      lastname: string | null
    } | null
  }>
  primaryImage?: {
    id: string
    url: string
  } | null
  imageCount?: number
  images?: Array<{
    id: string
    storage_url: string
    title?: string | null
    alt_text?: string | null
    is_primary?: boolean | null
  }>
  documents: Array<{
    id: string
    original_name: string
    file_size: bigint
  }>
}

interface SoldItemsTableProps {
  items: SoldItem[]
  invoiceGroups?: Array<{
    id: string
    invoice_number: string
    invoice_date: Date | null
    total_amount: number
    client: {
      id: string
      name: string
      lastname: string | null
    } | null
    items: Array<any>
  }>
}

export function SoldItemsTable({ items, invoiceGroups }: SoldItemsTableProps) {
  const t = useTranslations()
  const router = useRouter()
  const [viewingItem, setViewingItem] = useState<SoldItem | null>(null)

  // Always show grouped view for sold items
  if (invoiceGroups && invoiceGroups.length > 0) {
    // Import the custom grouped table dynamically
    const SoldItemsGroupedTable = require('@/components/items/sold-items-grouped-table').SoldItemsGroupedTable
    return <SoldItemsGroupedTable invoiceGroups={invoiceGroups} />
  }

  const columns = [
    createImageColumn<SoldItem>(
      'image',
      t('items.image'),
      {
        accessor: (item) => item.primaryImage?.url,
        titleAccessor: (item) => item.item_number || t('items.noItemNumber'),
        countAccessor: 'imageCount',
        imagesAccessor: (item) => item.images?.map(img => ({
          url: img.storage_url,
          title: img.title || undefined,
          alt: img.alt_text || undefined
        }))
      }
    ),
    
    createTextColumn<SoldItem>(
      'item_number',
      t('items.itemNumber'),
      { accessor: (item) => item.item_number || '-' }
    ),
    
    createTextColumn<SoldItem>(
      'description',
      t('items.description'),
      {
        accessor: (item) => item.description || '-',
        truncate: true,
        maxWidth: 'max-w-[200px]'
      }
    ),
    
    createTextColumn<SoldItem>(
      'category',
      t('items.category'),
      { accessor: (item) => item.category?.name || '-' }
    ),
    
    createTextColumn<SoldItem>('color', t('items.color'), { accessor: (item) => item.color || '-' }),
    
    createTextColumn<SoldItem>('grade', t('items.grade'), { accessor: (item) => item.grade || '-' }),
    
    createCurrencyColumn<SoldItem>(
      'purchase_price',
      t('items.purchasePrice'),
      { accessor: (item) => item.item_purchases[0]?.purchase_price }
    ),
    
    createCustomColumn<SoldItem>(
      'sale_price',
      t('items.salePrice'),
      (item) => {
        const salePrice = item.item_sales[0]?.sale_price
        return salePrice ? (
          <span className="font-medium text-green-600">€{salePrice.toFixed(2)}</span>
        ) : '-'
      },
      { align: 'right' }
    ),
    
    createPersonColumn<SoldItem>(
      'sold_to',
      t('items.soldTo'),
      {
        nameAccessor: (item) => item.item_sales[0]?.person?.name,
        lastNameAccessor: (item) => item.item_sales[0]?.person?.lastname
      }
    ),
    
    createDateColumn<SoldItem>(
      'sale_date',
      t('items.saleDate'),
      {
        accessor: (item) => item.item_sales[0]?.sale_date,
        relative: true
      }
    ),
  ]

  const handleDownloadInvoice = async (item: SoldItem) => {
    try {
      const saleId = item.item_sales[0]?.id
      if (!saleId) {
        console.error('No sale ID found for item')
        return
      }

      const response = await fetch('/api/invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          saleId: saleId,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate invoice')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `invoice_${item.item_number || item.id}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading invoice:', error)
    }
  }

  const actions = [
    createViewAction<SoldItem>(
      (item) => setViewingItem(item),
      t('items.viewDetails')
    ),
    createInvoiceAction<SoldItem>(
      (item) => handleDownloadInvoice(item),
      t('items.downloadInvoice')
    ),
  ]

  return (
    <>
      <DataTable
        data={items}
        columns={columns}
        keyExtractor={(item) => item.id}
        actions={actions}
        actionsDropdown={false}
        locale={t('common.locale') as 'en' | 'fr'}
        minWidth="1000px"
        emptyState={{
          icon: Package,
          title: t('items.noSoldItems'),
          description: t('items.noSoldItemsDescription'),
        }}
      />
      
      {viewingItem && (
        <AddItemModal
          mode="view"
          item={{
            id: viewingItem.id,
            itemNumber: viewingItem.item_number || '',
            description: viewingItem.description || '',
            categoryId: viewingItem.category?.id || null,
            category: viewingItem.category || null,
            color: viewingItem.color || undefined,
            grade: viewingItem.grade || undefined,
            customFields: {},
            purchase: viewingItem.item_purchases[0] ? {
              sellerId: viewingItem.item_purchases[0].person?.id || null,
              purchasePrice: viewingItem.item_purchases[0].purchase_price?.toString() || undefined,
              purchaseDate: viewingItem.item_purchases[0].purchase_date || null
            } : undefined,
            sale: viewingItem.item_sales[0] ? {
              clientId: viewingItem.item_sales[0].person?.id || null,
              salePrice: viewingItem.item_sales[0].sale_price?.toString() || undefined,
              saleDate: viewingItem.item_sales[0].sale_date || null,
              saleLocation: viewingItem.item_sales[0].sale_location || undefined,
              paymentMethod: viewingItem.item_sales[0].payment_method || undefined
            } : undefined,
            images: viewingItem.images?.map(img => ({
              id: img.id,
              url: img.storage_url,
              file_name: img.file_name,
              file_size: Number(img.file_size) || null,
              mime_type: img.mime_type,
              is_primary: img.is_primary
            })) || []
          }}
          categories={[]}
          open={!!viewingItem}
          onOpenChange={(open) => {
            if (!open) {
              setViewingItem(null)
              // Refresh the data after closing to reflect any image changes
              router.refresh()
            }
          }}
        />
      )}
    </>
  )
}

// ============================================================================
// Incidents Table
// ============================================================================

interface Incident {
  id: string
  incident_date: Date | null
  incident_type: string | null
  description: string | null
  resolution_status: string | null
  resolution_date: Date | null
  resolution_notes: string | null
  created_at: Date | null
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
  imageCount?: number
  images?: Array<{
    storage_url: string
    title?: string
    alt_text?: string
  }>
  centralizedImages?: Array<{
    id: string
    storage_url: string
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

interface IncidentsTableProps {
  incidents: Incident[]
  categories: any[]
}

export function IncidentsTable({ incidents, categories }: IncidentsTableProps) {
  const t = useTranslations()
  const router = useRouter()
  const [viewingIncident, setViewingIncident] = useState<Incident | null>(null)

  const columns = [
    createImageColumn<Incident>(
      'image',
      t('incidents.image'),
      {
        accessor: (incident) => incident.primaryImage?.url,
        titleAccessor: (incident) => incident.primaryImage?.title || incident.incident_type || t('incidents.incident'),
        altAccessor: (incident) => incident.primaryImage?.alt_text,
        countAccessor: 'imageCount',
        imagesAccessor: (incident) => incident.images?.map(img => ({
          url: img.storage_url,
          title: img.title,
          alt: img.alt_text
        }))
      }
    ),
    
    createCustomColumn<Incident>(
      'item',
      t('incidents.item'),
      (incident) => (
        <div>
          <div className="font-medium">{incident.items?.item_number || '-'}</div>
          {incident.items?.description && (
            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
              {incident.items.description}
            </div>
          )}
          {incident.items?.category && (
            <div className="text-xs text-muted-foreground">
              {incident.items.category.name}
            </div>
          )}
        </div>
      )
    ),
    
    createStatusColumn<Incident>(
      'incident_type',
      t('incidents.type'),
      {
        'damage': { label: t('incidents.damage'), variant: 'destructive' },
        'loss': { label: t('incidents.loss'), variant: 'destructive' },
        'theft': { label: t('incidents.theft'), variant: 'destructive' },
        'maintenance': { label: t('incidents.maintenance'), variant: 'warning' },
        'quality': { label: t('incidents.quality'), variant: 'warning' },
        'other': { label: t('incidents.other'), variant: 'secondary' }
      },
      (incident) => incident.incident_type || 'other'
    ),
    
    createTextColumn<Incident>(
      'description',
      t('incidents.description'),
      {
        accessor: (incident) => incident.description || '-',
        truncate: true,
        maxWidth: 'max-w-[300px]'
      }
    ),
    
    createStatusColumn<Incident>(
      'resolution_status',
      t('incidents.status'),
      {
        'open': { label: t('incidents.open'), variant: 'destructive' },
        'resolved': { label: t('incidents.resolved'), variant: 'success' },
        'closed': { label: t('incidents.closed'), variant: 'secondary' }
      },
      (incident) => incident.resolution_status || 'open'
    ),
    
    createTextColumn<Incident>(
      'reported_by',
      t('incidents.reportedBy'),
      { accessor: (incident) => incident.reported_by || '-' }
    ),
    
    createDateColumn<Incident>(
      'incident_date',
      t('incidents.date'),
      {
        accessor: (incident) => incident.incident_date,
        relative: true
      }
    ),
  ]

  const actions = [
    createViewAction<Incident>(
      (incident) => setViewingIncident(incident),
      t('incidents.viewDetails')
    ),
  ]

  return (
    <>
      <DataTable
        data={incidents}
        columns={columns}
        keyExtractor={(incident) => incident.id}
        actions={actions}
        actionsDropdown={false}
        locale={t('common.locale') as 'en' | 'fr'}
        minWidth="900px"
        emptyState={{
          icon: AlertTriangle,
          title: t('incidents.noIncidents'),
          description: t('incidents.noIncidentsDescription'),
        }}
      />
      
      {viewingIncident && (
        <IncidentModal
          incident={viewingIncident}
          mode="view"
          open={!!viewingIncident}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setViewingIncident(null)
              router.refresh()
            }
          }}
        />
      )}
    </>
  )
}

// ============================================================================
// Costs Table
// ============================================================================

interface Cost {
  id: string
  amount: number
  date: Date
  details?: string | null
  costs_event_type: {
    id: string
    name: string
  }
  book?: {
    id: string
    reference: string
  } | null
}

interface Book {
  id: string
  reference: string | null
}

interface CostsListProps {
  costs: Cost[]
  onEdit: (cost: Cost) => void
  onDelete: (cost: Cost) => void
}

export function CostsList({ costs, onEdit, onDelete }: CostsListProps) {
  const t = useTranslations()
  const [books, setBooks] = useState<Book[]>([])
  const [loadingBooks, setLoadingBooks] = useState(false)

  const loadBooks = async () => {
    if (books.length > 0 || loadingBooks) return
    
    setLoadingBooks(true)
    try {
      const { checkUserBooks } = await import('@/app/actions/books')
      const userBooks = await checkUserBooks()
      setBooks(userBooks)
    } catch (error) {
      console.error('Failed to load books:', error)
    } finally {
      setLoadingBooks(false)
    }
  }

  // Load books when component mounts
  useEffect(() => {
    if (costs.some(cost => cost.book)) {
      loadBooks()
    }
  }, [costs])

  const columns = [
    createDateColumn<Cost>('date', t('costs.date'), { relative: false, format: 'PPP' }),
    
    createCustomColumn<Cost>(
      'event_type',
      t('costs.eventType'),
      (cost) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
          {cost.costs_event_type.name}
        </span>
      )
    ),
    
    createCurrencyColumn<Cost>('amount', t('costs.amount'), { align: 'right' }),
    
    createTextColumn<Cost>(
      'details',
      t('costs.details'),
      { accessor: (cost) => cost.details || '-', truncate: true, maxWidth: 'max-w-[300px]' }
    ),
    
    createCustomColumn<Cost>(
      'book',
      t('costs.book'),
      (cost) => {
        if (!cost.book) return '-'
        const book = books.find(b => b.id === cost.book!.id)
        return book?.reference || cost.book.reference || '-'
      }
    ),
  ]

  const actions = [
    createEditAction<Cost>(onEdit, t('common.edit')),
    createDeleteAction<Cost>(onDelete, { label: t('common.delete') }),
  ]

  return (
    <DataTable
      data={costs}
      columns={columns}
      keyExtractor={(cost) => cost.id}
      actions={actions}
      actionsDropdown={false}
      locale={t('common.locale') as 'en' | 'fr'}
      minWidth="800px"
      hover
      emptyState={{
        icon: DollarSign,
        title: t('costs.noCosts'),
        description: t('costs.noCostsDescription'),
      }}
    />
  )
}

// ============================================================================
// Cost Event Types Table
// ============================================================================

interface CostEventType {
  id: string
  name: string
  created_at: Date
}

interface CostEventTypesTableProps {
  eventTypes: CostEventType[]
  onEdit: (eventType: CostEventType) => void
  onDelete: (eventType: CostEventType) => void
  onQuickAdd?: (eventTypeId: string) => void
}

export function CostEventTypesTable({ 
  eventTypes, 
  onEdit, 
  onDelete, 
  onQuickAdd 
}: CostEventTypesTableProps) {
  const t = useTranslations()

  const columns = [
    createTextColumn<CostEventType>('name', t('costs.eventTypeName')),
    
    createDateColumn<CostEventType>('created_at', t('common.createdAt'), { relative: false, format: 'PPP' }),
    
    createCustomColumn<CostEventType>(
      'quick_add',
      '',
      (eventType) => onQuickAdd ? (
        <button
          onClick={() => onQuickAdd(eventType.id)}
          className="text-sm text-primary hover:underline"
        >
          {t('costs.quickAddCost')}
        </button>
      ) : null
    ),
  ]

  const actions = [
    createEditAction<CostEventType>(onEdit, t('common.edit')),
    createDeleteAction<CostEventType>(onDelete, { label: t('common.delete') }),
  ]

  return (
    <DataTable
      data={eventTypes}
      columns={columns}
      keyExtractor={(eventType) => eventType.id}
      actions={actions}
      actionsDropdown={false}
      locale={t('common.locale') as 'en' | 'fr'}
      emptyState={{
        icon: Tag,
        title: t('costs.noEventTypes'),
        description: t('costs.noEventTypesDescription'),
      }}
    />
  )
}