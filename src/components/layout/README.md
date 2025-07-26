# Unified Page Layout System

This directory contains standardized layout components for creating consistent dashboard pages throughout the application.

## Components

### 1. PageHeader
A flexible header component for page titles, breadcrumbs, and actions.

```tsx
import { PageHeader } from '@/components/layout/page-header'

<PageHeader
  title="Items"
  subtitle="Manage your inventory"
  icon={Package}
  separator="/"
  separatorText="In Stock"
  breadcrumbs={[
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Items' }
  ]}
  actions={[
    {
      label: 'Add Item',
      onClick: handleAdd,
      icon: Plus
    }
  ]}
/>
```

### 2. DataPageLayout
A complete page layout wrapper that combines header, filters, view toggle, and content area.

```tsx
import { DataPageLayout } from '@/components/layout/data-page-layout'

<DataPageLayout
  title="Items"
  subtitle="Manage inventory"
  icon={Package}
  searchFilters={<SearchFilters ... />}
  view={view}
  onViewChange={setView}
  showEmptyState={items.length === 0}
  emptyStateConfig={{
    title: 'No items yet',
    description: 'Add your first item',
    action: { label: 'Add Item', onClick: handleAdd }
  }}
>
  <ItemsTable items={items} />
</DataPageLayout>
```

### 3. SearchFilters
A flexible filter system supporting text search, selects, and date ranges.

```tsx
import { SearchFilters } from '@/components/layout/search-filters'

<SearchFilters
  filters={[
    {
      type: 'text',
      key: 'search',
      placeholder: 'Search...'
    },
    {
      type: 'select',
      key: 'category',
      label: 'Category',
      options: categories
    },
    {
      type: 'date-range',
      key: 'dates',
      label: 'Date Range'
    }
  ]}
  onFiltersChange={handleFiltersChange}
/>
```

### 4. EmptyState
Consistent empty state displays with customizable messaging and actions.

```tsx
import { EmptyState, EmptyStates } from '@/components/layout/empty-state'

// Use preset empty states
<EmptyStates.Items action={{ label: 'Add Item', onClick: handleAdd }} />

// Or create custom empty states
<EmptyState
  icon={AlertTriangle}
  title="No incidents"
  description="Everything is running smoothly"
  variant="default"
/>
```

### 5. StatusBadge
Unified status indicators with consistent styling across the app.

```tsx
import { StatusBadge } from '@/components/ui/status-badge'

// Predefined statuses
<StatusBadge status="active" />
<StatusBadge status="sold" />
<StatusBadge status="resolved" />

// Custom statuses
<StatusBadge
  status="custom"
  label="Processing"
  type="warning"
  size="sm"
/>
```

## Migration Guide

### Before (Old Pattern)
```tsx
export function ItemsPageClient({ items, categories }) {
  return (
    <>
      <ItemsHeader onAddClick={() => setShowAddModal(true)} />
      <div className="mt-6 flex flex-col lg:flex-row gap-4">
        <SearchFilters ... />
        <ViewToggle ... />
      </div>
      <div className="mt-6">
        {view === 'list' ? <ItemsTable /> : <ItemsGrid />}
      </div>
    </>
  )
}
```

### After (New Pattern)
```tsx
export function ItemsPageClientV2({ items, categories }) {
  return (
    <DataPageLayout
      title={t('items.title')}
      subtitle={t('items.subtitle')}
      icon={Package}
      actions={[/* ... */]}
      searchFilters={<SearchFilters ... />}
      view={view}
      onViewChange={setView}
      showEmptyState={items.length === 0}
      emptyStateConfig={{ /* ... */ }}
    >
      {view === 'list' ? <ItemsTable /> : <ItemsGrid />}
    </DataPageLayout>
  )
}
```

## Benefits

1. **Consistency**: All pages follow the same layout patterns
2. **Reduced Code**: Less boilerplate in individual page components
3. **Responsive**: Built-in mobile-friendly layouts
4. **Accessible**: Proper ARIA attributes and keyboard navigation
5. **i18n Ready**: Full internationalization support
6. **Type Safe**: Complete TypeScript definitions

## Demo

View the interactive demo at `/components/layout/layout-demo.tsx` to see all components in action.