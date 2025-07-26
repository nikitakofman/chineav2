import { format } from 'date-fns'
import { 
  Eye, Edit, Trash2, ShoppingCart, AlertCircle, 
  User, Building, Package, Briefcase, Users, 
  HelpCircle, DollarSign, Calendar, FileDown
} from 'lucide-react'
import type { GridAction, GridBadge } from './data-grid'

// ============================================================================
// Badge Variant Helpers
// ============================================================================

export function getStatusBadge(status: string, t: (key: string) => string): GridBadge {
  const statusMap: Record<string, GridBadge['variant']> = {
    available: 'success',
    sold: 'secondary',
    incident: 'destructive',
    resolved: 'success',
    pending: 'warning',
    open: 'warning',
    closed: 'secondary'
  }

  return {
    label: t(`status.${status}`),
    variant: statusMap[status.toLowerCase()] || 'default'
  }
}

export function getTypeBadge(type: string, variant?: GridBadge['variant']): GridBadge {
  return {
    label: type,
    variant: variant || 'outline'
  }
}

// ============================================================================
// Action Helpers
// ============================================================================

export function createViewAction(
  onClick: () => void,
  t: (key: string) => string
): GridAction {
  return {
    label: t('common.view'),
    icon: Eye,
    onClick,
    variant: 'default'
  }
}

export function createEditAction(
  onClick: () => void,
  t: (key: string) => string
): GridAction {
  return {
    label: t('common.edit'),
    icon: Edit,
    onClick,
    variant: 'outline'
  }
}

export function createDeleteAction(
  onClick: () => void,
  t: (key: string) => string
): GridAction {
  return {
    label: t('common.delete'),
    icon: Trash2,
    onClick,
    variant: 'destructive',
    size: 'sm'
  }
}

export function createSellAction(
  onClick: () => void,
  t: (key: string) => string,
  condition?: boolean
): GridAction {
  return {
    label: t('items.sell'),
    icon: ShoppingCart,
    onClick,
    variant: 'default',
    condition
  }
}

export function createIncidentAction(
  onClick: () => void,
  t: (key: string) => string,
  condition?: boolean
): GridAction {
  return {
    label: t('items.reportIncident'),
    icon: AlertCircle,
    onClick,
    variant: 'outline',
    condition
  }
}

export function createInvoiceAction(
  onClick: () => void,
  t: (key: string) => string
): GridAction {
  return {
    label: t('items.downloadInvoice'),
    icon: FileDown,
    onClick,
    variant: 'outline'
  }
}

// ============================================================================
// Icon Helpers
// ============================================================================

export function getPersonTypeIcon(typeName: string) {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    customer: User,
    client: User,
    supplier: Building,
    vendor: Building,
    manufacturer: Building,
    partner: Briefcase,
    team: Users,
    employee: User,
    contractor: Briefcase
  }

  const lowerType = typeName.toLowerCase()
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lowerType.includes(key)) return icon
  }
  
  return HelpCircle
}

export function getCategoryIcon(categoryName: string) {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    product: Package,
    service: Briefcase,
    expense: DollarSign,
    event: Calendar
  }

  const lowerCategory = categoryName.toLowerCase()
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lowerCategory.includes(key)) return icon
  }
  
  return Package
}

// ============================================================================
// Date Formatting
// ============================================================================

export function formatGridDate(
  date: Date | string | null | undefined,
  locale?: string,
  formatStr: string = 'MMM d, yyyy'
): string {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    // Note: Locale support removed due to Next.js dynamic import limitations
    // TODO: Implement proper locale support with static imports
    return format(dateObj, formatStr)
  } catch {
    return format(new Date(date), formatStr)
  }
}

// ============================================================================
// Price Formatting
// ============================================================================

export function formatPrice(amount: number | null | undefined, currency: string = '€'): string {
  if (amount == null) return `${currency}0`
  return `${currency}${amount.toFixed(2)}`
}

// ============================================================================
// Text Helpers
// ============================================================================

export function truncateText(text: string | null | undefined, maxLength: number = 100): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}

export function formatContactInfo(
  phone?: string | null,
  email?: string | null,
  website?: string | null
): string[] {
  const info: string[] = []
  if (phone) info.push(phone)
  if (email) info.push(email)
  if (website) info.push(website)
  return info
}