'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Item {
  id: string
  item_number: string | null
  description: string | null
  color: string | null
  grade: string | null
  category: {
    id: string
    name: string
  } | null
  item_sales?: Array<{ id: string }>
}

interface ItemSelectorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: Item[]
  onSelect: (items: Item[]) => void
  excludeIds?: string[]
}

export function ItemSelectorModal({
  open,
  onOpenChange,
  items,
  onSelect,
  excludeIds = []
}: ItemSelectorModalProps) {
  const t = useTranslations()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Filter out already sold items and excluded items
  const availableItems = useMemo(() => {
    return items.filter(item => {
      // Exclude sold items
      if (item.item_sales && item.item_sales.length > 0) return false
      // Exclude already added items
      if (excludeIds.includes(item.id)) return false
      return true
    })
  }, [items, excludeIds])

  // Filter by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery) return availableItems

    const query = searchQuery.toLowerCase()
    return availableItems.filter(item => {
      return (
        item.item_number?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category?.name.toLowerCase().includes(query) ||
        item.color?.toLowerCase().includes(query) ||
        item.grade?.toLowerCase().includes(query)
      )
    })
  }, [availableItems, searchQuery])

  const handleToggleItem = (itemId: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedIds(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredItems.map(item => item.id)))
    }
  }

  const handleConfirm = () => {
    const selectedItems = items.filter(item => selectedIds.has(item.id))
    onSelect(selectedItems)
    setSelectedIds(new Set())
    setSearchQuery('')
    onOpenChange(false)
  }

  const handleCancel = () => {
    setSelectedIds(new Set())
    setSearchQuery('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('items.selectItemsToSell')}</DialogTitle>
          <DialogDescription>
            {t('items.selectItemsDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('common.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Select all */}
          {filteredItems.length > 0 && (
            <div className="flex items-center justify-between pb-2 border-b">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {t('common.selectAll')} ({filteredItems.length})
                </label>
              </div>
              {selectedIds.size > 0 && (
                <Badge variant="secondary">
                  {selectedIds.size} {t('common.selected')}
                </Badge>
              )}
            </div>
          )}

          {/* Items list */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? t('common.noResultsFound') : t('items.noAvailableItems')}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer"
                    onClick={() => handleToggleItem(item.id)}
                  >
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={() => handleToggleItem(item.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {item.item_number || t('items.noItemNumber')}
                        </span>
                        {item.category && (
                          <Badge variant="outline" className="text-xs">
                            {item.category.name}
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {item.description}
                        </p>
                      )}
                      <div className="flex gap-4 mt-1">
                        {item.color && (
                          <span className="text-xs text-muted-foreground">
                            {t('items.color')}: {item.color}
                          </span>
                        )}
                        {item.grade && (
                          <span className="text-xs text-muted-foreground">
                            {t('items.grade')}: {item.grade}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={selectedIds.size === 0}
          >
            {t('items.addSelectedItems')} ({selectedIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}