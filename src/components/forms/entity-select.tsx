"use client"

import * as React from "react"
import { Check, ChevronDown, Plus, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EntitySelectProps, SelectEntity } from "@/types/form-types"

export function EntitySelect({
  entities = [],
  value,
  onChange,
  placeholder = "Select entity...",
  disabled = false,
  className,
  searchable = true,
  clearable = true,
  loading = false,
  emptyMessage = "No entities found",
  createNewLabel = "Create new",
  onCreateNew,
}: EntitySelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  
  // Filter entities based on search query
  const filteredEntities = React.useMemo(() => {
    if (!searchQuery) return entities
    
    return entities.filter((entity) =>
      entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entity.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [entities, searchQuery])
  
  // Find selected entity
  const selectedEntity = entities.find((entity) => 
    entity.id === value
  )
  
  const handleSelect = (entityId: string | number) => {
    if (entityId === value) {
      // Deselect if clicking the same item and clearable
      if (clearable) {
        onChange?.(undefined)
      }
    } else {
      onChange?.(entityId)
    }
    setOpen(false)
  }
  
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.(undefined)
  }
  
  const handleCreateNew = () => {
    onCreateNew?.()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !selectedEntity && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {selectedEntity ? (
              <>
                <span className="truncate">{selectedEntity.name}</span>
                {selectedEntity.description && (
                  <span className="text-xs text-muted-foreground truncate">
                    {selectedEntity.description}
                  </span>
                )}
              </>
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {selectedEntity && clearable && !disabled && (
              <X
                className="h-4 w-4 text-muted-foreground hover:text-foreground"
                onClick={handleClear}
              />
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          {searchable && (
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                placeholder="Search entities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          )}
          
          <CommandList>
            {loading ? (
              <div className="p-2 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {filteredEntities.length === 0 && !onCreateNew ? (
                  <CommandEmpty>{emptyMessage}</CommandEmpty>
                ) : (
                  <CommandGroup>
                    {filteredEntities.map((entity) => (
                      <CommandItem
                        key={entity.id}
                        value={entity.id.toString()}
                        onSelect={() => handleSelect(entity.id)}
                        disabled={entity.disabled}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="truncate">{entity.name}</span>
                            {entity.description && (
                              <span className="text-xs text-muted-foreground truncate">
                                {entity.description}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <Check
                          className={cn(
                            "h-4 w-4",
                            value === entity.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                    
                    {onCreateNew && searchQuery && filteredEntities.length === 0 && (
                      <>
                        <CommandSeparator />
                        <CommandItem onSelect={handleCreateNew}>
                          <Plus className="mr-2 h-4 w-4" />
                          {createNewLabel} "{searchQuery}"
                        </CommandItem>
                      </>
                    )}
                  </CommandGroup>
                )}
                
                {onCreateNew && (!searchQuery || filteredEntities.length > 0) && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem onSelect={handleCreateNew}>
                        <Plus className="mr-2 h-4 w-4" />
                        {createNewLabel}
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Multi-select variant
interface MultiEntitySelectProps extends Omit<EntitySelectProps, "value" | "onChange"> {
  value?: (string | number)[]
  onChange?: (values: (string | number)[]) => void
  maxSelections?: number
}

export function MultiEntitySelect({
  entities = [],
  value = [],
  onChange,
  placeholder = "Select entities...",
  disabled = false,
  className,
  searchable = true,
  loading = false,
  emptyMessage = "No entities found",
  createNewLabel = "Create new",
  onCreateNew,
  maxSelections,
}: MultiEntitySelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  
  const filteredEntities = React.useMemo(() => {
    if (!searchQuery) return entities
    
    return entities.filter((entity) =>
      entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entity.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [entities, searchQuery])
  
  const selectedEntities = entities.filter((entity) => 
    value.includes(entity.id)
  )
  
  const handleSelect = (entityId: string | number) => {
    const isSelected = value.includes(entityId)
    
    if (isSelected) {
      // Remove from selection
      onChange?.(value.filter(id => id !== entityId))
    } else {
      // Add to selection (if not at max)
      if (!maxSelections || value.length < maxSelections) {
        onChange?.([...value, entityId])
      }
    }
  }
  
  const handleRemove = (entityId: string | number, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.(value.filter(id => id !== entityId))
  }
  
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.([])
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal min-h-[2.75rem] h-auto",
            selectedEntities.length === 0 && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-1 min-w-0 flex-1 flex-wrap">
            {selectedEntities.length === 0 ? (
              <span>{placeholder}</span>
            ) : (
              selectedEntities.map((entity) => (
                <Badge
                  key={entity.id}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  <span className="truncate max-w-[100px]">{entity.name}</span>
                  <X
                    className="h-3 w-3 hover:text-foreground"
                    onClick={(e) => handleRemove(entity.id, e)}
                  />
                </Badge>
              ))
            )}
          </div>
          
          <div className="flex items-center gap-1 ml-2">
            {selectedEntities.length > 0 && (
              <X
                className="h-4 w-4 text-muted-foreground hover:text-foreground"
                onClick={handleClear}
              />
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          {searchable && (
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                placeholder="Search entities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          )}
          
          <CommandList>
            {loading ? (
              <div className="p-2 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            ) : (
              <CommandGroup>
                {filteredEntities.map((entity) => {
                  const isSelected = value.includes(entity.id)
                  const canSelect = !maxSelections || value.length < maxSelections || isSelected
                  
                  return (
                    <CommandItem
                      key={entity.id}
                      value={entity.id.toString()}
                      onSelect={() => handleSelect(entity.id)}
                      disabled={entity.disabled || !canSelect}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="truncate">{entity.name}</span>
                          {entity.description && (
                            <span className="text-xs text-muted-foreground truncate">
                              {entity.description}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <Check
                        className={cn(
                          "h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  )
                })}
                
                {filteredEntities.length === 0 && (
                  <CommandEmpty>{emptyMessage}</CommandEmpty>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}