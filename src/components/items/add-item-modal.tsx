'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useBook } from '@/contexts/book-context'
import { createItem, getFieldDefinitionsForBook, updateItemCategory } from '@/app/actions/items'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Upload, Image, FileText, Plus, X, Loader2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AddCategoryModal } from '@/components/categories/add-category-modal'

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

interface AddItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  mode?: 'create' | 'view'
  item?: {
    id: string
    item_number: string | null
    description: string | null
    color: string | null
    grade: string | null
    category_id: string | null
    category: {
      id: string
      name: string
    } | null
    item_purchases: Array<{
      purchase_price: number | null
      purchase_date: Date | null
    }>
  }
}

export function AddItemModal({ 
  open, 
  onOpenChange, 
  categories: initialCategories,
  mode = 'create',
  item
}: AddItemModalProps) {
  const t = useTranslations()
  const router = useRouter()
  const { selectedBook } = useBook()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>([])
  const [images, setImages] = useState<string[]>([])
  const [documents, setDocuments] = useState<string[]>([])
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    mode === 'view' && item ? (item.category_id || '') : ''
  )
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    async function loadFieldDefinitions() {
      if (selectedBook) {
        const fields = await getFieldDefinitionsForBook(selectedBook.id)
        setFieldDefinitions(fields)
      }
    }
    
    if (open) {
      loadFieldDefinitions()
    }
  }, [open, selectedBook])

  const handleCategoryCreated = (newCategory: Category) => {
    setCategories([...categories, newCategory])
    setSelectedCategoryId(newCategory.id)
    if (mode === 'view') {
      setHasChanges(true)
    }
  }

  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value)
    if (mode === 'view') {
      setHasChanges(value !== (item?.category_id || ''))
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedBook) return

    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    formData.append('bookId', selectedBook.id)
    
    try {
      const result = await createItem(formData)
      
      if (result.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
        router.refresh()
      }
    } catch {
      setError(t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!item || !hasChanges) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await updateItemCategory(item.id, selectedCategoryId || null)
      
      if (result.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
        router.refresh()
      }
    } catch {
      setError(t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }

  const renderFieldInput = (field: FieldDefinition) => {
    const fieldId = `field_${field.id}`
    const label = field.field_label || field.field_name

    switch (field.field_type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId}>
              {label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldId}
              name={fieldId}
              defaultValue={field.default_value || ''}
              required={field.is_required || false}
            />
          </div>
        )
      
      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId}>
              {label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={fieldId}
              name={fieldId}
              defaultValue={field.default_value || ''}
              required={field.is_required || false}
              rows={3}
            />
          </div>
        )
      
      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId}>
              {label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldId}
              name={fieldId}
              type="number"
              defaultValue={field.default_value || ''}
              required={field.is_required || false}
            />
          </div>
        )
      
      case 'select':
        // For select fields, we'd need to parse options from somewhere
        // For now, just render as text input
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId}>
              {label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldId}
              name={fieldId}
              defaultValue={field.default_value || ''}
              required={field.is_required || false}
            />
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="!max-w-[calc(100vw-2rem)] w-[calc(100vw-2rem)] h-[90vh] p-0 
                   sm:!max-w-[calc(100vw-4rem)] sm:w-[calc(100vw-4rem)]"
        style={{ maxWidth: 'calc(100vw - 4rem)' }}>
        <div className="flex flex-col h-full">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl">
                    {mode === 'view' ? t('items.viewDetails') : t('items.addNewItem')}
                  </DialogTitle>
                  <DialogDescription>
                    {mode === 'view' 
                      ? t('items.viewItemDescription') 
                      : t('items.addItemDescription')}
                  </DialogDescription>
                </div>
              </div>
              {mode === 'view' ? (
                hasChanges && (
                  <Button 
                    onClick={handleUpdate}
                    disabled={isLoading}
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('common.saving')}
                      </>
                    ) : (
                      t('items.updateCategory')
                    )}
                  </Button>
                )
              ) : (
                <Button 
                  type="submit" 
                  form="add-item-form"
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('items.creating')}
                    </>
                  ) : (
                    <>
                      {t('common.add')}
                      <Plus className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogHeader>

          <form id="add-item-form" onSubmit={handleSubmit} className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-8">
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-8">
                  {/* Left Column - All Details in One Card */}
                  <div>
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="text-lg">{t('items.details')}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="itemNumber">{t('items.itemNumber')}</Label>
                            <Input
                              id="itemNumber"
                              name="itemNumber"
                              placeholder={t('items.itemNumberPlaceholder')}
                              defaultValue={mode === 'view' ? item?.item_number || '' : ''}
                              readOnly={mode === 'view'}
                              className={mode === 'view' ? 'bg-muted' : ''}
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
                            required={mode === 'create'}
                            defaultValue={mode === 'view' ? item?.description || '' : ''}
                            readOnly={mode === 'view'}
                            className={mode === 'view' ? 'bg-muted' : ''}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="color">{t('items.color')}</Label>
                            <Input
                              id="color"
                              name="color"
                              placeholder={t('items.colorPlaceholder')}
                              defaultValue={mode === 'view' ? item?.color || '' : ''}
                              readOnly={mode === 'view'}
                              className={mode === 'view' ? 'bg-muted' : ''}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="grade">{t('items.grade')}</Label>
                            <Input
                              id="grade"
                              name="grade"
                              placeholder={t('items.gradePlaceholder')}
                              defaultValue={mode === 'view' ? item?.grade || '' : ''}
                              readOnly={mode === 'view'}
                              className={mode === 'view' ? 'bg-muted' : ''}
                            />
                          </div>
                        </div>

                        {/* Custom Fields - no label, just fields */}
                        {fieldDefinitions.length > 0 && (
                          <div className="space-y-4 mt-4">
                            {fieldDefinitions.map(field => renderFieldInput(field))}
                          </div>
                        )}

                        {/* Purchase Information */}
                        <Separator className="my-6" />
                        <h3 className="text-sm font-medium mb-4">{t('items.purchaseInfo')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="purchasePrice">{t('items.purchasePrice')}</Label>
                            <Input
                              id="purchasePrice"
                              name="purchasePrice"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              defaultValue={mode === 'view' && item?.item_purchases?.[0]?.purchase_price ? item.item_purchases[0].purchase_price.toString() : ''}
                              readOnly={mode === 'view'}
                              className={mode === 'view' ? 'bg-muted' : ''}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="purchaseDate">{t('items.purchaseDate')}</Label>
                            <Input
                              id="purchaseDate"
                              name="purchaseDate"
                              type="date"
                              defaultValue={mode === 'view' && item?.item_purchases?.[0]?.purchase_date ? new Date(item.item_purchases[0].purchase_date).toISOString().split('T')[0] : ''}
                              readOnly={mode === 'view'}
                              className={mode === 'view' ? 'bg-muted' : ''}
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
                        <div className="space-y-4">
                          {mode === 'create' ? (
                            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                              <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                              <p className="text-base font-medium mb-2">{t('items.uploadImages')}</p>
                              <p className="text-sm text-muted-foreground mb-4">
                                {t('items.uploadImagesDescription')}
                              </p>
                              <Button type="button" variant="outline">
                                <Upload className="w-4 h-4 mr-2" />
                                {t('items.selectImages')}
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p>{t('items.noImagesUploaded')}</p>
                            </div>
                          )}

                          {images.length > 0 && (
                            <>
                              <Separator />
                              <div className="grid grid-cols-4 gap-4">
                                {images.map((image, index) => (
                                  <div key={index} className="relative group">
                                    <div className="aspect-square bg-muted rounded-lg" />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="icon"
                                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => setImages(images.filter((_, i) => i !== index))}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Documents Section */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">{t('items.documents')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {mode === 'create' ? (
                            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                              <p className="text-base font-medium mb-2">{t('items.uploadDocuments')}</p>
                              <p className="text-sm text-muted-foreground mb-4">
                                {t('items.uploadDocumentsDescription')}
                              </p>
                              <Button type="button" variant="outline">
                                <Upload className="w-4 h-4 mr-2" />
                                {t('items.selectDocuments')}
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p>{t('items.noDocumentsUploaded')}</p>
                            </div>
                          )}

                          {documents.length > 0 && (
                            <>
                              <Separator />
                              <div className="space-y-2">
                                {documents.map((doc, index) => (
                                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <FileText className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-sm">Document {index + 1}</span>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setDocuments(documents.filter((_, i) => i !== index))}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Footer Actions */}
            <div className="border-t px-6 py-4 bg-background">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {t('common.requiredFields')}
                </p>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
      
      {/* Category Modal - renders on top of item modal */}
      <AddCategoryModal
        open={showCategoryModal}
        onOpenChange={setShowCategoryModal}
        onCategoryCreated={handleCategoryCreated}
      />
    </Dialog>
  )
}