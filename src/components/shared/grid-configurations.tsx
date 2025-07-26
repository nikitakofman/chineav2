'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { 
  Package, Users, AlertCircle, DollarSign, 
  FolderOpen, ImageIcon, ShoppingCart, CheckCircle,
  CalendarIcon, MapPinIcon, PhoneIcon, GlobeIcon
} from 'lucide-react'
import { DataGrid, type GridCardConfig } from './data-grid'
import { 
  getStatusBadge, getTypeBadge, getPersonTypeIcon, getCategoryIcon,
  createViewAction, createEditAction, createDeleteAction,
  createSellAction, createIncidentAction, createInvoiceAction,
  formatGridDate, formatPrice, truncateText, formatContactInfo
} from './grid-utils'
import { MultiSaleModal, IncidentModal, PersonModal, AddItemModal } from './modal-configurations'
import { UnifiedEntityModal } from '@/components/modals/unified-entity-modal'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

// ============================================================================
// Items Grid
// ============================================================================

interface Item {
  id: string
  item_number: string | null
  description: string | null
  purchase_price: number | null
  sale_price: number | null
  status: string | null
  color: string | null
  grade: string | null
  category_id: string | null
  category: {
    id: string
    name: string
  } | null
  item_purchases?: Array<{
    purchase_price: number | null
    purchase_date: Date | null
  }>
  purchase?: {
    purchase_date: Date | null
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
    position?: number
  }>
}

interface ItemsGridProps {
  items: Item[]
  categories?: Array<{ id: string; name: string }>
  onUpdate?: () => void
}

export function ItemsGrid({ items, categories = [], onUpdate }: ItemsGridProps) {
  const t = useTranslations()
  const router = useRouter()
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [saleModalItem, setSaleModalItem] = useState<Item | null>(null)
  const [incidentModalItem, setIncidentModalItem] = useState<Item | null>(null)
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view')

  const renderCard = (item: Item): GridCardConfig => {
    const status = item.status || 'available'
    const imageCount = item.images?.length || 0
    
    // Sort images by position first
    const sortedImages = item.images ? [...item.images].sort((a, b) => {
      const posA = a.position !== null && a.position !== undefined ? a.position : 999
      const posB = b.position !== null && b.position !== undefined ? b.position : 999
      return posA - posB
    }) : []
    
    const hasImage = item.primaryImage?.url || sortedImages.length > 0
    
    // Get the image with position 0, or fall back to first sorted image
    const firstPositionImage = sortedImages.find(img => img.position === 0) || sortedImages[0]
    const primaryImageUrl = item.primaryImage?.url || firstPositionImage?.storage_url

    return {
      badges: [
        getStatusBadge(status, t),
        ...(item.category ? [getTypeBadge(item.category.name)] : [])
      ],
      metadata: item.item_number ? `#${item.item_number}` : undefined,
      image: hasImage && primaryImageUrl ? {
        url: primaryImageUrl,
        alt: item.primaryImage?.alt_text || item.description || '',
        count: imageCount
      } : undefined,
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold text-base line-clamp-2">
            {item.description || t('items.noDescription')}
          </h3>
          
          {(item.color || item.grade) && (
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {item.color && <span>{t('items.color')}: {item.color}</span>}
              {item.grade && <span>{t('items.grade')}: {item.grade}</span>}
            </div>
          )}

          <div className="space-y-1">
            {item.purchase_price != null && (
              <p className="text-sm">
                <span className="text-muted-foreground">{t('items.purchasePrice')}:</span>{' '}
                <span className="font-medium">{formatPrice(item.purchase_price)}</span>
              </p>
            )}
            {item.sale_price != null && (
              <p className="text-sm">
                <span className="text-muted-foreground">{t('items.salePrice')}:</span>{' '}
                <span className="font-medium">{formatPrice(item.sale_price)}</span>
              </p>
            )}
          </div>

          {item.purchase?.purchase_date && (
            <p className="text-xs text-muted-foreground">
              {t('items.purchasedOn')} {formatGridDate(item.purchase.purchase_date)}
            </p>
          )}
        </div>
      ),
      actions: [
        createViewAction(() => {
          setSelectedItem(item)
          setViewMode('view')
        }, t),
        createSellAction(
          () => setSaleModalItem(item),
          t,
          status === 'available'
        ),
        createIncidentAction(
          () => setIncidentModalItem(item),
          t,
          status === 'available'
        )
      ]
    }
  }

  return (
    <>
      <DataGrid
        items={items}
        renderCard={renderCard}
        keyExtractor={(item) => item.id}
        emptyState={{
          icon: Package,
          title: t('items.noItems'),
          description: t('items.addFirstItem')
        }}
      />

      {/* Modals */}
      {selectedItem && (
        <UnifiedEntityModal
          open={!!selectedItem}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedItem(null)
              setViewMode('view')
              // Refresh the data after closing to reflect any image changes
              onUpdate?.()
            }
          }}
          entityType="item"
          mode={viewMode}
          item={selectedItem as any}
          categories={categories}
        />
      )}

      {saleModalItem && (
        <MultiSaleModal
          open={!!saleModalItem}
          onOpenChange={(open) => !open && setSaleModalItem(null)}
          initialItem={saleModalItem}
          availableItems={items}
          onSuccess={() => {
            setSaleModalItem(null)
            router.refresh()
          }}
        />
      )}

      {incidentModalItem && (
        <IncidentModal
          open={!!incidentModalItem}
          onOpenChange={(open) => !open && setIncidentModalItem(null)}
          item={incidentModalItem}
          mode="create"
        />
      )}
    </>
  )
}

// ============================================================================
// Incidents Grid
// ============================================================================

interface Incident {
  id: string
  incident_date: Date | null
  incident_type: string | null
  description: string | null
  resolution_status: string | null
  resolution_date: Date | null
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
    alt_text?: string
  } | null
  images?: Array<{
    id: string
    storage_url: string
    alt_text?: string
    position?: number
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

interface IncidentsGridProps {
  incidents: Incident[]
}

export function IncidentsGrid({ incidents }: IncidentsGridProps) {
  const t = useTranslations()
  const router = useRouter()
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)

  const renderCard = (incident: Incident): GridCardConfig => {
    const status = incident.resolution_status || 'open'
    const imageCount = incident.images?.length || 0
    
    // Sort images by position first
    const sortedImages = incident.images ? [...incident.images].sort((a, b) => {
      const posA = a.position !== null && a.position !== undefined ? a.position : 999
      const posB = b.position !== null && b.position !== undefined ? b.position : 999
      return posA - posB
    }) : []
    
    const hasImage = incident.primaryImage?.url || sortedImages.length > 0
    
    // Get the image with position 0, or fall back to first sorted image
    const firstPositionImage = sortedImages.find(img => img.position === 0) || sortedImages[0]
    const primaryImageUrl = incident.primaryImage?.url || firstPositionImage?.storage_url

    return {
      badges: [
        getStatusBadge(status, t),
        ...(incident.incident_type ? [getTypeBadge(incident.incident_type, 'warning')] : [])
      ],
      metadata: incident.incident_date ? formatGridDate(incident.incident_date) : undefined,
      image: hasImage && primaryImageUrl ? {
        url: primaryImageUrl,
        alt: incident.primaryImage?.alt_text || incident.description || '',
        count: imageCount
      } : undefined,
      content: (
        <div className="space-y-2">
          {incident.items && (
            <div className="mb-2">
              <p className="text-sm font-medium">
                {incident.items.item_number ? `#${incident.items.item_number}` : ''} 
                {incident.items.description}
              </p>
              {incident.items.category && (
                <p className="text-xs text-muted-foreground">
                  {incident.items.category.name}
                </p>
              )}
            </div>
          )}

          <h3 className="font-semibold text-base line-clamp-2">
            {incident.description || t('incidents.noDescription')}
          </h3>

          {incident.reported_by && (
            <p className="text-sm text-muted-foreground">
              {t('incidents.reportedBy')}: {incident.reported_by}
            </p>
          )}

          {status === 'resolved' && incident.resolution_date && (
            <p className="text-xs text-green-600 dark:text-green-400">
              {t('incidents.resolvedOn')} {formatGridDate(incident.resolution_date)}
            </p>
          )}
        </div>
      ),
      actions: [
        createViewAction(() => setSelectedIncident(incident), t)
      ]
    }
  }

  return (
    <>
      <DataGrid
        items={incidents}
        renderCard={renderCard}
        keyExtractor={(incident) => incident.id}
        emptyState={{
          icon: AlertCircle,
          title: t('incidents.noIncidents'),
          description: t('incidents.noIncidentsDescription')
        }}
      />

      {selectedIncident && (
        <IncidentModal
          open={!!selectedIncident}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedIncident(null)
              // Refresh the data after closing to reflect any image changes
              router.refresh()
            }
          }}
          incident={selectedIncident}
          mode="view"
        />
      )}
    </>
  )
}

// ============================================================================
// Sold Items Grid
// ============================================================================

interface SoldItem {
  id: string
  item_number: string | null
  description: string | null
  sale_price: number | null
  purchase_price: number | null
  color: string | null
  grade: string | null
  sale: {
    id: string
    sale_date: Date | null
    payment_method: string | null
    sale_location: string | null
    buyer: {
      id: string
      name: string
      lastname: string | null
    } | null
  } | null
  category: {
    id: string
    name: string
  } | null
  primaryImage?: {
    url: string
    alt_text?: string
  } | null
  images?: Array<{
    id: string
    storage_url: string
    alt_text?: string
    position?: number
  }>
}

interface SoldItemsGridProps {
  items: SoldItem[]
  categories?: Array<{ id: string; name: string }>
  invoiceGroups?: Array<{
    id: string
    invoice_number: string
    invoice_date: Date
    total_amount: number
    client?: {
      id: string
      name: string
      lastname?: string | null
    } | null
    items: Array<any>
  }>
}

export function SoldItemsGrid({ items, categories = [], invoiceGroups }: SoldItemsGridProps) {
  const t = useTranslations()
  const router = useRouter()
  const [selectedItem, setSelectedItem] = useState<SoldItem | null>(null)

  // Use grouped grid if invoice groups are provided
  if (invoiceGroups && invoiceGroups.length > 0) {
    const SoldItemsGroupedGrid = require('@/components/items/sold-items-grouped-grid').SoldItemsGroupedGrid
    return <SoldItemsGroupedGrid invoiceGroups={invoiceGroups} />
  }

  const renderCard = (item: SoldItem): GridCardConfig => {
    const profit = (item.sale_price || 0) - (item.purchase_price || 0)
    const profitPercentage = item.purchase_price 
      ? ((profit / item.purchase_price) * 100).toFixed(1)
      : '0'
    
    // Sort images by position first
    const sortedImages = item.images ? [...item.images].sort((a, b) => {
      const posA = a.position !== null && a.position !== undefined ? a.position : 999
      const posB = b.position !== null && b.position !== undefined ? b.position : 999
      return posA - posB
    }) : []
    
    const hasImage = item.primaryImage?.url || sortedImages.length > 0
    
    // Get the image with position 0, or fall back to first sorted image
    const firstPositionImage = sortedImages.find(img => img.position === 0) || sortedImages[0]
    const primaryImageUrl = item.primaryImage?.url || firstPositionImage?.storage_url

    return {
      badges: [
        { label: t('status.sold'), variant: 'secondary' },
        ...(item.category ? [getTypeBadge(item.category.name)] : [])
      ],
      metadata: item.item_number ? `#${item.item_number}` : undefined,
      image: hasImage && primaryImageUrl ? {
        url: primaryImageUrl,
        alt: item.primaryImage?.alt_text || item.description || ''
      } : undefined,
      header: (
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-600">
            {t('items.soldFor')} {formatPrice(item.sale_price)}
          </span>
        </div>
      ),
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold text-base line-clamp-2">
            {item.description || t('items.noDescription')}
          </h3>

          {(item.color || item.grade) && (
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {item.color && <span>{t('items.color')}: {item.color}</span>}
              {item.grade && <span>{t('items.grade')}: {item.grade}</span>}
            </div>
          )}

          {item.sale && (
            <>
              {item.sale.buyer && (
                <p className="text-sm">
                  <span className="text-muted-foreground">{t('sales.buyer')}:</span>{' '}
                  <span className="font-medium">
                    {item.sale.buyer.name} {item.sale.buyer.lastname || ''}
                  </span>
                </p>
              )}

              {item.sale.sale_date && (
                <p className="text-sm text-muted-foreground">
                  {t('sales.soldOn')} {formatGridDate(item.sale.sale_date)}
                </p>
              )}

              <div className="pt-2 border-t">
                <p className="text-sm">
                  <span className="text-muted-foreground">{t('items.profit')}:</span>{' '}
                  <span className={cn(
                    'font-medium',
                    profit >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatPrice(profit)} ({profitPercentage}%)
                  </span>
                </p>
              </div>
            </>
          )}
        </div>
      ),
      actions: [
        createViewAction(() => setSelectedItem(item), t),
        createInvoiceAction(async () => {
          try {
            const saleId = item.item_sales?.[0]?.id
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
        }, t)
      ]
    }
  }

  return (
    <>
      <DataGrid
        items={items}
        renderCard={renderCard}
        keyExtractor={(item) => item.id}
        emptyState={{
          icon: ShoppingCart,
          title: t('sales.noSoldItems'),
          description: t('sales.noSoldItemsDescription')
        }}
      />

      {selectedItem && (
        <AddItemModal
          open={!!selectedItem}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedItem(null)
              // Refresh the data after closing to reflect any image changes
              router.refresh()
            }
          }}
          categories={categories}
          item={{
            id: selectedItem.id,
            itemNumber: selectedItem.item_number || '',
            description: selectedItem.description || '',
            categoryId: selectedItem.category?.id || null,
            color: selectedItem.color || '',
            grade: selectedItem.grade || '',
            customFields: {},
            purchase: {
              sellerId: null,
              purchasePrice: selectedItem.purchase_price?.toString(),
              purchaseDate: null
            },
            sale: {
              clientId: selectedItem.sale?.buyer?.id || null,
              salePrice: selectedItem.sale_price?.toString(),
              saleDate: selectedItem.sale?.sale_date,
              saleLocation: selectedItem.sale?.sale_location || '',
              paymentMethod: selectedItem.sale?.payment_method || ''
            },
            images: []
          }}
          mode="view"
        />
      )}
    </>
  )
}

// ============================================================================
// People Grid
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
  created_at: Date | null
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

interface PeopleGridProps {
  people: Person[]
  personTypes: PersonType[]
  onEdit?: (person: Person) => void
  onDelete?: (person: Person) => void
}

export function PeopleGrid({ people, personTypes, onEdit, onDelete }: PeopleGridProps) {
  const t = useTranslations()
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)

  const renderCard = (person: Person): GridCardConfig => {
    const PersonIcon = person.person_type 
      ? getPersonTypeIcon(person.person_type.name)
      : Users
    
    const contactInfo = formatContactInfo(person.phone, undefined, person.website)
    const hasAddress = person.address_line_1 || person.address_line_2 || 
                      person.zipcode || person.country

    return {
      badges: person.person_type ? [getTypeBadge(person.person_type.name)] : [],
      header: (
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <PersonIcon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-base">
              {person.name} {person.lastname || ''}
            </h3>
            {person.specialization && (
              <p className="text-sm text-muted-foreground">{person.specialization}</p>
            )}
          </div>
        </div>
      ),
      content: (
        <div className="space-y-3 mt-4">
          {hasAddress && (
            <div className="flex gap-2">
              <MapPinIcon className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                {person.address_line_1 && <p>{person.address_line_1}</p>}
                {person.address_line_2 && <p>{person.address_line_2}</p>}
                <p>
                  {[person.zipcode, person.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            </div>
          )}

          {contactInfo.length > 0 && (
            <div className="space-y-2">
              {person.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <PhoneIcon className="w-4 h-4 text-muted-foreground" />
                  <span>{person.phone}</span>
                </div>
              )}
              {person.website && (
                <div className="flex items-center gap-2 text-sm">
                  <GlobeIcon className="w-4 h-4 text-muted-foreground" />
                  <a 
                    href={person.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate"
                  >
                    {person.website}
                  </a>
                </div>
              )}
            </div>
          )}

          {person.created_at && (
            <p className="text-xs text-muted-foreground pt-2 border-t">
              {t('people.addedOn')} {formatGridDate(person.created_at)}
            </p>
          )}
        </div>
      ),
      actions: [
        createViewAction(() => setSelectedPerson(person), t),
        ...(onEdit ? [createEditAction(() => onEdit(person), t)] : []),
        ...(onDelete ? [createDeleteAction(() => onDelete(person), t)] : [])
      ]
    }
  }

  return (
    <>
      <DataGrid
        items={people}
        renderCard={renderCard}
        keyExtractor={(person) => person.id}
        emptyState={{
          icon: Users,
          title: t('people.noPeople'),
          description: t('people.addFirstPerson')
        }}
      />

      {selectedPerson && (
        <PersonModal
          open={!!selectedPerson}
          onOpenChange={(open) => !open && setSelectedPerson(null)}
          personTypes={personTypes}
          person={selectedPerson}
          mode="view"
        />
      )}
    </>
  )
}

// ============================================================================
// Categories Grid
// ============================================================================

interface Category {
  id: string
  name: string
  parent_category_id?: string | null
  created_at: Date | null
  parent_category?: {
    id: string
    name: string
  } | null
  subcategories?: Category[]
  _count?: {
    items: number
  }
}

interface CategoriesGridProps {
  categories: Category[]
  onEdit?: (category: Category) => void
  onDelete?: (category: Category) => void
}

export function CategoriesGrid({ categories, onEdit, onDelete }: CategoriesGridProps) {
  const t = useTranslations()

  const renderCard = (category: Category): GridCardConfig => {
    const Icon = getCategoryIcon(category.name)
    const itemCount = category._count?.items || 0
    const subcategoryCount = category.subcategories?.length || 0

    return {
      badges: category.parent_category 
        ? [{ label: category.parent_category.name, variant: 'outline' as const }]
        : [],
      header: (
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-base">{category.name}</h3>
          </div>
        </div>
      ),
      content: (
        <div className="space-y-3 mt-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('categories.items')}:</span>
            <span className="font-medium">{itemCount}</span>
          </div>

          {subcategoryCount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('categories.subcategories')}:</span>
              <span className="font-medium">{subcategoryCount}</span>
            </div>
          )}

          {category.created_at && (
            <p className="text-xs text-muted-foreground pt-2 border-t">
              {t('categories.createdOn')} {formatGridDate(category.created_at)}
            </p>
          )}
        </div>
      ),
      actions: [
        ...(onEdit ? [createEditAction(() => onEdit(category), t)] : []),
        ...(onDelete ? [createDeleteAction(() => onDelete(category), t)] : [])
      ]
    }
  }

  return (
    <DataGrid
      items={categories}
      renderCard={renderCard}
      keyExtractor={(category) => category.id}
      emptyState={{
        icon: FolderOpen,
        title: t('categories.noCategories'),
        description: t('categories.noCategoriesDescription')
      }}
    />
  )
}

// ============================================================================
// Costs Grid
// ============================================================================

interface CostEventType {
  id: string
  name: string
}

interface Cost {
  id: string
  amount: number
  date: Date
  details_message: string | null
  costs_event_type: {
    id: string
    name: string
  } | null
  book: {
    id: string
    reference: string | null
  } | null
}

interface CostsGridProps {
  costs: Cost[]
  costEventTypes: CostEventType[]
  onEdit?: (cost: Cost) => void
  onDelete?: (cost: Cost) => void
}

export function CostsGrid({ costs, costEventTypes, onEdit, onDelete }: CostsGridProps) {
  const t = useTranslations()

  // Group costs by event type
  const groupedCosts = costs.reduce((acc, cost) => {
    const eventTypeName = cost.costs_event_type?.name || t('costs.uncategorized')
    if (!acc[eventTypeName]) {
      acc[eventTypeName] = []
    }
    acc[eventTypeName].push(cost)
    return acc
  }, {} as Record<string, Cost[]>)

  const renderCard = (eventTypeData: [string, Cost[]]): GridCardConfig => {
    const [eventTypeName, eventCosts] = eventTypeData
    const totalAmount = eventCosts.reduce((sum, cost) => sum + cost.amount, 0)
    const latestCost = eventCosts[0] // Assuming costs are sorted by date desc

    return {
      badges: [
        { label: `${eventCosts.length} ${t('costs.entries')}`, variant: 'secondary' },
        getTypeBadge(eventTypeName)
      ],
      header: (
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <DollarSign className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-base">{eventTypeName}</h3>
            <p className="text-2xl font-bold text-primary">{formatPrice(totalAmount)}</p>
          </div>
        </div>
      ),
      content: (
        <div className="space-y-3 mt-4">
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {eventCosts.slice(0, 3).map((cost) => (
              <div key={cost.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatGridDate(cost.date, undefined, 'MMM d')}
                </span>
                <span className="font-medium">{formatPrice(cost.amount)}</span>
              </div>
            ))}
            {eventCosts.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">
                +{eventCosts.length - 3} {t('common.more')}
              </p>
            )}
          </div>

          {latestCost.details_message && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground line-clamp-2">
                {latestCost.details_message}
              </p>
            </div>
          )}
        </div>
      ),
      actions: onEdit && onDelete ? [
        createEditAction(() => onEdit(latestCost), t),
        createDeleteAction(() => onDelete(latestCost), t)
      ] : []
    }
  }

  const groupedData = Object.entries(groupedCosts)

  return (
    <DataGrid
      items={groupedData}
      renderCard={renderCard}
      keyExtractor={([eventType]) => eventType}
      emptyState={{
        icon: DollarSign,
        title: t('costs.noCosts'),
        description: t('costs.addFirstCost')
      }}
    />
  )
}