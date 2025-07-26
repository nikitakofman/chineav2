'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { createMultiSale, getClients } from '@/app/actions/sales'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Package, DollarSign, Plus, X, Loader2, ShoppingCart
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AddPersonModal } from '@/components/shared/modal-configurations'
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog'
import { ItemSelectorModal } from '@/components/modals/item-selector-modal'
import { toast } from 'sonner'

interface SaleItem {
  id: string
  item_number: string | null
  description: string | null
  color: string | null
  grade: string | null
  category: {
    id: string
    name: string
  } | null
}

interface SaleTab {
  id: string
  item: SaleItem
  salePrice: string
  saleDate: string
  paymentMethod: string
  saleLocation: string
}

interface MultiSaleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialItem?: SaleItem
  availableItems?: SaleItem[]
  onSuccess?: () => void
}

export function MultiSaleModal({ open, onOpenChange, initialItem, availableItems = [], onSuccess }: MultiSaleModalProps) {
  const t = useTranslations()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('tab-1')
  const [tabs, setTabs] = useState<SaleTab[]>([])
  const [tabCounter, setTabCounter] = useState(1)
  
  // Client management
  const [clients, setClients] = useState<Array<{ id: string; name: string; lastname: string | null }>>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [showAddClientModal, setShowAddClientModal] = useState(false)
  const [personTypes, setPersonTypes] = useState<Array<{ id: string; name: string }>>([])
  
  // Invoice confirmation
  const [showInvoiceConfirmation, setShowInvoiceConfirmation] = useState(false)
  const [saleIds, setSaleIds] = useState<string[]>([])
  
  // Item selector
  const [showItemSelector, setShowItemSelector] = useState(false)

  // Initialize with the first item if provided
  useEffect(() => {
    if (open && initialItem && tabs.length === 0) {
      const today = new Date().toISOString().split('T')[0]
      setTabs([{
        id: 'tab-1',
        item: initialItem,
        salePrice: '',
        saleDate: today,
        paymentMethod: '',
        saleLocation: ''
      }])
    }
  }, [open, initialItem])

  // Load clients
  useEffect(() => {
    async function loadData() {
      if (open) {
        setLoadingClients(true)
        try {
          const [clientsData, typesData] = await Promise.all([
            getClients(),
            (async () => {
              const { getPersonTypes } = await import('@/app/actions/people')
              return getPersonTypes()
            })()
          ])
          setClients(clientsData)
          setPersonTypes(typesData)
        } catch (error) {
          console.error('Error loading data:', error)
        } finally {
          setLoadingClients(false)
        }
      }
    }
    loadData()
  }, [open])

  const handleAddItems = (selectedItems: SaleItem[]) => {
    const today = new Date().toISOString().split('T')[0]
    const newTabs: SaleTab[] = selectedItems.map((item, index) => ({
      id: `tab-${tabCounter + index + 1}`,
      item,
      salePrice: '',
      saleDate: today,
      paymentMethod: '',
      saleLocation: ''
    }))
    
    setTabs(prev => [...prev, ...newTabs])
    setTabCounter(prev => prev + selectedItems.length)
    
    // Switch to the first new tab
    if (newTabs.length > 0) {
      setActiveTab(newTabs[0].id)
    }
  }

  const removeTab = (tabId: string) => {
    if (tabs.length > 1) {
      setTabs(prev => prev.filter(tab => tab.id !== tabId))
      if (activeTab === tabId) {
        setActiveTab(tabs[0].id)
      }
    }
  }

  const updateTab = (tabId: string, updates: Partial<SaleTab>) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, ...updates } : tab
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate all tabs have items
      const invalidTabs = tabs.filter(tab => !tab.item)
      if (invalidTabs.length > 0) {
        setError(t('items.selectItemError'))
        setIsLoading(false)
        return
      }

      // Prepare sales data
      const salesData = {
        clientId: selectedClientId,
        items: tabs.map(tab => ({
          itemId: tab.item!.id,
          salePrice: tab.salePrice,
          saleDate: tab.saleDate,
          saleLocation: tab.saleLocation,
          paymentMethod: tab.paymentMethod
        }))
      }

      const result = await createMultiSale(salesData)
      
      if (result.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }
      
      if (result.data) {
        // Success - show invoice confirmation
        toast.success(t('items.salesRecorded'))
        const saleIds = result.data.sales.map(sale => sale.id)
        setSaleIds(saleIds)
        setShowInvoiceConfirmation(true)
      }
    } catch (error) {
      console.error('Error creating sales:', error)
      setError(t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrintInvoice = async () => {
    setShowInvoiceConfirmation(false)
    
    try {
      const response = await fetch('/api/invoice/generate-multi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          saleIds: saleIds,
          clientId: selectedClientId,
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
      a.download = `invoice_multi_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      
      toast.success(t('items.invoiceDownloaded'))
    } catch (error) {
      console.error('Error generating invoice:', error)
      toast.error(t('items.invoiceGenerationError'))
    }
    
    onOpenChange(false)
    if (onSuccess) {
      onSuccess()
    } else {
      setTimeout(() => {
        window.location.reload()
      }, 100)
    }
  }

  const handleSkipInvoice = () => {
    setShowInvoiceConfirmation(false)
    onOpenChange(false)
    if (onSuccess) {
      onSuccess()
    } else {
      setTimeout(() => {
        window.location.reload()
      }, 100)
    }
  }

  const handleClientCreated = async () => {
    setShowAddClientModal(false)
    setLoadingClients(true)
    try {
      const clientsData = await getClients()
      setClients(clientsData)
      const oldClientIds = clients.map(c => c.id)
      const newClient = clientsData.find(c => !oldClientIds.includes(c.id))
      if (newClient) {
        setSelectedClientId(newClient.id)
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoadingClients(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="!max-w-[calc(100vw-1rem)] w-[calc(100vw-1rem)] h-[95vh] p-0 gap-0
                     sm:!max-w-[calc(100vw-2rem)] sm:w-[calc(100vw-2rem)] sm:h-[90vh]
                     lg:!max-w-[calc(100vw-4rem)] lg:w-[calc(100vw-4rem)] flex flex-col"
        >
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle>{t('items.multiSale')}</DialogTitle>
                <DialogDescription>{t('items.multiSaleDescription')}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex flex-1 overflow-hidden relative">
              {/* Left sidebar - Items list */}
              <div className="hidden md:flex w-64 lg:w-72 border-r flex-col bg-muted/20">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{t('items.selectedItems')}</h3>
                    <span className="text-xs text-muted-foreground">{tabs.length} {t('items.items')}</span>
                  </div>
                </div>
                
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1">
                    {tabs.map((tab, index) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full text-left p-3 rounded-md transition-colors relative group ${
                          activeTab === tab.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'
                        }`}
                      >
                        <div className="pr-6">
                          <div className="font-medium text-sm">
                            {tab.item ? (tab.item.item_number || `Item ${index + 1}`) : t('items.newItem')}
                          </div>
                          {tab.item && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {tab.item.description || tab.item.category?.name || '-'}
                            </div>
                          )}
                          {tab.salePrice && (
                            <div className="text-xs font-medium mt-1 text-green-600 dark:text-green-400">
                              ${tab.salePrice}
                            </div>
                          )}
                        </div>
                        {tabs.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeTab(tab.id)
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="p-3 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowItemSelector(true)}
                    className="w-full gap-2"
                  >
                    <Plus className="h-3 w-3" />
                    {t('items.addItem')}
                  </Button>
                </div>
              </div>

              {/* Right content - Sale details */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header with client selection */}
                <div className="p-4 border-b bg-background">
                  {/* Mobile items selector */}
                  <div className="md:hidden mb-3">
                    <Select value={activeTab} onValueChange={setActiveTab}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('items.selectItem')} />
                      </SelectTrigger>
                      <SelectContent>
                        {tabs.map((tab, index) => (
                          <SelectItem key={tab.id} value={tab.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{tab.item ? (tab.item.item_number || `Item ${index + 1}`) : t('items.newItem')}</span>
                              {tab.salePrice && (
                                <span className="ml-2 text-green-600 dark:text-green-400">${tab.salePrice}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <h3 className="font-semibold text-sm">{t('items.saleDetails')}</h3>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Label className="text-sm flex-shrink-0">{t('items.client')}:</Label>
                      {loadingClients ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">
                            {t('common.loading')}...
                          </span>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                            <SelectTrigger className="h-9 w-[200px]">
                              <SelectValue placeholder={t('items.selectClient')} />
                            </SelectTrigger>
                            <SelectContent>
                              {clients.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                  {client.name} {client.lastname || ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-9 w-9"
                            onClick={() => setShowAddClientModal(true)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive" className="mx-4 mt-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Content area */}
                <ScrollArea className="flex-1">
                  {tabs.map((tab) => {
                    if (tab.id !== activeTab) return null
                    
                    return (
                      <div key={tab.id} className="p-6">
                        <div className="space-y-6 max-w-4xl mx-auto">
                          {/* Item information - Compact display */}
                          {tab.item ? (
                            <div className="bg-muted/30 rounded-lg p-4">
                              <h4 className="font-medium flex items-center gap-2 mb-3">
                                <Package className="h-4 w-4" />
                                {t('items.itemInformation')}
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">{t('items.itemNumber')}:</span>
                                  <div className="font-medium">{tab.item.item_number || '-'}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">{t('items.category')}:</span>
                                  <div className="font-medium">{tab.item.category?.name || '-'}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">{t('items.color')}:</span>
                                  <div className="font-medium">{tab.item.color || '-'}</div>
                                </div>
                                <div className="col-span-2 md:col-span-3">
                                  <span className="text-muted-foreground">{t('items.description')}:</span>
                                  <div className="font-medium">{tab.item.description || '-'}</div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-12 text-muted-foreground">
                              {t('items.selectItemToSell')}
                            </div>
                          )}

                          {/* Sale information */}
                          {tab.item && (
                            <div className="space-y-4">
                              <h4 className="font-medium flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                {t('items.saleInformation')}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>{t('items.salePrice')} *</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={tab.salePrice}
                                    onChange={(e) => updateTab(tab.id, { salePrice: e.target.value })}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>{t('items.saleDate')} *</Label>
                                  <Input
                                    type="date"
                                    value={tab.saleDate}
                                    onChange={(e) => updateTab(tab.id, { saleDate: e.target.value })}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>{t('items.paymentMethod')}</Label>
                                  <Select 
                                    value={tab.paymentMethod} 
                                    onValueChange={(value) => updateTab(tab.id, { paymentMethod: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={t('items.selectPaymentMethod')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="cash">{t('items.cash')}</SelectItem>
                                      <SelectItem value="card">{t('items.card')}</SelectItem>
                                      <SelectItem value="check">{t('items.check')}</SelectItem>
                                      <SelectItem value="bank_transfer">{t('items.bankTransfer')}</SelectItem>
                                      <SelectItem value="other">{t('items.other')}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>{t('items.saleLocationLabel')}</Label>
                                  <Input
                                    placeholder={t('items.saleLocationPlaceholder')}
                                    value={tab.saleLocation}
                                    onChange={(e) => updateTab(tab.id, { saleLocation: e.target.value })}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </ScrollArea>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-muted/50">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    {t('items.totalItems')}: {tabs.length}
                  </div>
                  {(() => {
                    const total = tabs.reduce((sum, tab) => sum + (parseFloat(tab.salePrice) || 0), 0)
                    return total > 0 ? (
                      <div className="text-sm font-medium">
                        {t('items.total')}: ${total.toFixed(2)}
                      </div>
                    ) : null
                  })()}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isLoading}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={isLoading || tabs.length === 0}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('items.sellItems')}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Client Modal */}
      <AddPersonModal
        open={showAddClientModal}
        onOpenChange={setShowAddClientModal}
        personTypes={personTypes}
        preselectedTypeId={personTypes.find(t => t.name.toLowerCase() === 'client')?.id || null}
        onSuccess={handleClientCreated}
      />

      {/* Invoice Confirmation Modal */}
      <ConfirmationDialog
        open={showInvoiceConfirmation}
        onOpenChange={(open) => {
          if (!open) {
            handleSkipInvoice()
          }
        }}
        config={{
          title: t('items.printInvoiceTitle'),
          description: t('items.printMultiInvoiceDescription'),
          confirmLabel: t('items.printInvoice'),
          cancelLabel: t('common.no'),
          variant: 'default'
        }}
        onConfirm={async () => {
          handlePrintInvoice()
          return { success: true }
        }}
        onSuccess={() => {}}
      />

      {/* Item Selector Modal */}
      <ItemSelectorModal
        open={showItemSelector}
        onOpenChange={setShowItemSelector}
        items={availableItems}
        excludeIds={tabs.map(tab => tab.item?.id).filter(Boolean) as string[]}
        onSelect={handleAddItems}
      />
    </>
  )
}