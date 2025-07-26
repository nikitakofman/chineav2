'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Loader2, RotateCcw, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  GenericCrudModalProps,
  FieldConfig,
  FormSection,
  FormData,
  CrudMode,
  FieldType,
  ValidationResult,
  FieldError
} from '@/types/form-types'

// ============================================================================
// Field Validation Utilities
// ============================================================================

/**
 * Validates a single field based on its configuration
 */
const validateField = (field: FieldConfig, value: any): string | undefined => {
  const { validation } = field

  if (!validation) return undefined

  // Required validation
  if (validation.required && (!value || value.toString().trim() === '')) {
    return `${field.label} is required`
  }

  // Skip other validations if field is empty and not required
  if (!value || value.toString().trim() === '') return undefined

  const stringValue = value.toString()
  const numberValue = parseFloat(stringValue)

  // Type-specific validations
  switch (field.type) {
    case 'email':
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailPattern.test(stringValue)) {
        return `${field.label} must be a valid email address`
      }
      break

    case 'url':
      try {
        new URL(stringValue)
      } catch {
        return `${field.label} must be a valid URL`
      }
      break

    case 'number':
      if (isNaN(numberValue)) {
        return `${field.label} must be a valid number`
      }
      if (validation.min !== undefined && numberValue < validation.min) {
        return `${field.label} must be at least ${validation.min}`
      }
      if (validation.max !== undefined && numberValue > validation.max) {
        return `${field.label} must be at most ${validation.max}`
      }
      if (validation.step !== undefined && (numberValue % validation.step) !== 0) {
        return `${field.label} must be a multiple of ${validation.step}`
      }
      break

    case 'tel':
      const phonePattern = /^[\+]?[1-9][\d]{0,15}$/
      if (!phonePattern.test(stringValue.replace(/[\s\-\(\)]/g, ''))) {
        return `${field.label} must be a valid phone number`
      }
      break
  }

  // String length validations
  if (validation.minLength !== undefined && stringValue.length < validation.minLength) {
    return `${field.label} must be at least ${validation.minLength} characters`
  }
  if (validation.maxLength !== undefined && stringValue.length > validation.maxLength) {
    return `${field.label} must be at most ${validation.maxLength} characters`
  }

  // Pattern validation
  if (validation.pattern) {
    const regex = new RegExp(validation.pattern)
    if (!regex.test(stringValue)) {
      return `${field.label} format is invalid`
    }
  }

  // Custom validation
  if (validation.custom) {
    return validation.custom(value)
  }

  return undefined
}

/**
 * Validates all form data against field configurations
 */
const validateForm = (formData: FormData, allFields: FieldConfig[]): ValidationResult => {
  const errors: FieldError[] = []

  allFields.forEach(field => {
    const value = formData[field.name]
    const error = validateField(field, value)
    
    if (error) {
      errors.push({
        field: field.name,
        message: error
      })
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

// ============================================================================
// Field Rendering Components
// ============================================================================

interface FieldRendererProps {
  field: FieldConfig
  value: any
  onChange: (value: any) => void
  error?: string
  disabled?: boolean
  mode: CrudMode
}

const FieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  value,
  onChange,
  error,
  disabled,
  mode
}) => {
  const t = useTranslations()
  const isViewMode = mode === 'view'
  const isDisabled = disabled || isViewMode || field.disabled

  const baseInputProps = {
    id: field.name,
    name: field.name,
    placeholder: field.placeholder,
    value: value || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    disabled: isDisabled,
    className: cn(
      field.className,
      isViewMode ? 'bg-muted' : '',
      error ? 'border-destructive focus:border-destructive' : ''
    ),
    autoComplete: field.autoComplete
  }

  const renderInput = () => {
    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            {...baseInputProps}
            rows={field.rows || 3}
          />
        )

      case 'select':
        return (
          <Select
            name={field.name}
            value={value || ''}
            onValueChange={onChange}
            disabled={isDisabled}
          >
            <SelectTrigger className={cn(isViewMode ? 'bg-muted' : '', error ? 'border-destructive' : '')}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'number':
        return (
          <Input
            {...baseInputProps}
            type="number"
            step={field.validation?.step}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        )

      case 'date':
        return (
          <Input
            {...baseInputProps}
            type="date"
          />
        )

      case 'email':
        return (
          <Input
            {...baseInputProps}
            type="email"
          />
        )

      case 'tel':
        return (
          <Input
            {...baseInputProps}
            type="tel"
          />
        )

      case 'url':
        return (
          <Input
            {...baseInputProps}
            type="url"
          />
        )

      case 'password':
        return (
          <Input
            {...baseInputProps}
            type="password"
          />
        )

      default: // 'text'
        return (
          <Input
            {...baseInputProps}
            type="text"
          />
        )
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name} className={cn(error ? 'text-destructive' : '')}>
        {field.label}
        {field.validation?.required && mode !== 'view' && (
          <span className="text-destructive ml-1">*</span>
        )}
      </Label>
      {renderInput()}
      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

// ============================================================================
// Section Renderer Component
// ============================================================================

interface SectionRendererProps {
  section: FormSection
  formData: FormData
  errors: Record<string, string>
  onChange: (name: string, value: any) => void
  disabled?: boolean
  mode: CrudMode
}

const SectionRenderer: React.FC<SectionRendererProps> = ({
  section,
  formData,
  errors,
  onChange,
  disabled,
  mode
}) => {
  const [isExpanded, setIsExpanded] = useState(section.defaultExpanded !== false)

  if (section.collapsible) {
    return (
      <Card className={section.className}>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <CardTitle className="text-lg flex items-center justify-between">
            {section.title}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              {isExpanded ? '−' : '+'}
            </Button>
          </CardTitle>
          {section.description && (
            <CardDescription>{section.description}</CardDescription>
          )}
        </CardHeader>
        {isExpanded && (
          <CardContent className="space-y-4">
            {section.fields.map((field) => (
              <FieldRenderer
                key={field.id}
                field={field}
                value={formData[field.name]}
                onChange={(value) => onChange(field.name, value)}
                error={errors[field.name]}
                disabled={disabled}
                mode={mode}
              />
            ))}
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <Card className={section.className}>
      <CardHeader>
        <CardTitle className="text-lg">{section.title}</CardTitle>
        {section.description && (
          <CardDescription>{section.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {section.fields.map((field) => (
          <FieldRenderer
            key={field.id}
            field={field}
            value={formData[field.name]}
            onChange={(value) => onChange(field.name, value)}
            error={errors[field.name]}
            disabled={disabled}
            mode={mode}
          />
        ))}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Main GenericCrudModal Component
// ============================================================================

export const GenericCrudModal: React.FC<GenericCrudModalProps> = ({
  open,
  onOpenChange,
  mode,
  title,
  description,
  fields = [],
  sections = [],
  data = {},
  config = {},
  loading = false,
  error,
  onSubmit,
  onReset,
  className,
  children
}) => {
  const t = useTranslations()
  
  // State management
  const [formData, setFormData] = useState<FormData>(data)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Combine fields from both props
  const allFields = useMemo(() => {
    const sectionFields = sections.flatMap(section => section.fields)
    return [...fields, ...sectionFields]
  }, [fields, sections])

  // Update form data when data prop changes
  useEffect(() => {
    setFormData(data)
    setHasChanges(false)
    setValidationErrors({})
  }, [data, open])

  // Configuration with defaults
  const modalConfig = {
    title: title || config.title || t('common.form'),
    description: description || config.description,
    submitButtonText: config.submitButtonText || (mode === 'create' ? t('common.create') : mode === 'edit' ? t('common.update') : t('common.submit')),
    cancelButtonText: config.cancelButtonText || t('common.cancel'),
    resetButtonText: config.resetButtonText || t('common.reset'),
    showReset: config.showReset !== false && mode === 'create',
    showCancel: config.showCancel !== false,
    width: config.width || 'lg',
    height: config.height || 'auto',
    icon: config.icon || Package,
    iconColor: config.iconColor || 'text-primary',
    iconBgColor: config.iconBgColor || 'bg-primary/10'
  }

  const HeaderIcon = modalConfig.icon
  const isViewMode = mode === 'view'

  // Handle field value changes
  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    setHasChanges(true)
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Handle form reset
  const handleReset = () => {
    setFormData(data)
    setValidationErrors({})
    setHasChanges(false)
    if (onReset) {
      onReset()
    }
  }

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (isViewMode) return

    // Validate form
    const validation = validateForm(formData, allFields)
    if (!validation.isValid) {
      const errorMap = validation.errors.reduce((acc, error) => {
        acc[error.field] = error.message
        return acc
      }, {} as Record<string, string>)
      setValidationErrors(errorMap)
      return
    }

    setIsSubmitting(true)
    setValidationErrors({})

    try {
      const result = await onSubmit(formData)
      
      if (result.success) {
        setHasChanges(false)
        onOpenChange(false)
      } else {
        if (result.validationErrors) {
          setValidationErrors(result.validationErrors)
        }
      }
    } catch (err) {
      console.error('Form submission error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Dialog size classes
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[calc(100vw-2rem)] w-[calc(100vw-2rem)]'
  }

  const heightClasses = {
    auto: '',
    sm: 'h-[60vh]',
    md: 'h-[70vh]',
    lg: 'h-[80vh]',
    full: 'h-[90vh]'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          sizeClasses[modalConfig.width],
          heightClasses[modalConfig.height],
          modalConfig.height !== 'auto' && 'flex flex-col',
          className
        )}
      >
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              modalConfig.iconBgColor
            )}>
              <HeaderIcon className={cn('w-5 h-5', modalConfig.iconColor)} />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {modalConfig.title}
              </DialogTitle>
              {modalConfig.description && (
                <DialogDescription className="text-sm">
                  {modalConfig.description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className={modalConfig.height !== 'auto' ? 'flex-1 overflow-hidden' : ''}>
          <ScrollArea className={modalConfig.height !== 'auto' ? 'h-full' : 'max-h-[60vh]'}>
            <div className="space-y-6 p-1">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Render sections */}
              {sections.map((section) => (
                <SectionRenderer
                  key={section.id}
                  section={section}
                  formData={formData}
                  errors={validationErrors}
                  onChange={handleFieldChange}
                  disabled={loading || isSubmitting}
                  mode={mode}
                />
              ))}

              {/* Render standalone fields */}
              {fields.length > 0 && (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    {fields.map((field) => (
                      <FieldRenderer
                        key={field.id}
                        field={field}
                        value={formData[field.name]}
                        onChange={(value) => handleFieldChange(field.name, value)}
                        error={validationErrors[field.name]}
                        disabled={loading || isSubmitting}
                        mode={mode}
                      />
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Custom children content */}
              {children}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className={cn(
            'border-t mt-6 pt-6 flex-shrink-0',
            mode === 'create' ? 'bg-gray-50 dark:bg-gray-900/50 -mx-6 -mb-6 px-6 pb-6' : ''
          )}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                {mode === 'create' && (
                  <p className="text-sm text-muted-foreground">
                    {t('common.requiredFields')}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Reset button */}
                {modalConfig.showReset && hasChanges && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={loading || isSubmitting}
                    className="gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {modalConfig.resetButtonText}
                  </Button>
                )}

                {/* Cancel/Close button */}
                {modalConfig.showCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    {isViewMode ? t('common.close') : modalConfig.cancelButtonText}
                  </Button>
                )}

                {/* Submit button */}
                {!isViewMode && (
                  <Button
                    type="submit"
                    disabled={loading || isSubmitting}
                  >
                    {(loading || isSubmitting) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {modalConfig.submitButtonText}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default GenericCrudModal