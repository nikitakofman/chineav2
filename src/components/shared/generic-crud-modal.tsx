'use client'

import React, { useState } from 'react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, LucideIcon } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface FieldConfig {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number' | 'email' | 'date'
  placeholder?: string
  required?: boolean
  options?: Array<{ value: string; label: string }>
  validation?: (value: any) => string | null
  defaultValue?: any
  customRender?: (field: FieldConfig, value: any, onChange: (value: any) => void) => React.ReactNode
}

export interface GenericCrudModalConfig {
  title: string
  description?: string
  icon?: LucideIcon
  fields: FieldConfig[]
  submitLabel: string
  loadingLabel: string
  mode: 'create' | 'edit'
}

interface GenericCrudModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: GenericCrudModalConfig
  onSubmit: (data: Record<string, any>) => Promise<{ error?: string; success?: boolean; data?: any }>
  onSuccess?: (data: any) => void
  initialData?: Record<string, any>
}

export function GenericCrudModal({
  open,
  onOpenChange,
  config,
  onSubmit,
  onSuccess,
  initialData = {}
}: GenericCrudModalProps) {
  const t = useTranslations()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {}
    config.fields.forEach(field => {
      initial[field.name] = initialData[field.name] ?? field.defaultValue ?? ''
    })
    return initial
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const Icon = config.icon

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    let isValid = true

    config.fields.forEach(field => {
      const value = formData[field.name]
      
      // Check required fields
      if (field.required && !value) {
        errors[field.name] = t('common.fieldRequired')
        isValid = false
      }
      
      // Custom validation
      if (field.validation && value) {
        const error = field.validation(value)
        if (error) {
          errors[field.name] = error
          isValid = false
        }
      }
    })

    setFieldErrors(errors)
    return isValid
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await onSubmit(formData)
      
      if (result.error) {
        setError(result.error)
      } else if (result.success || result.data) {
        if (onSuccess) {
          onSuccess(result.data)
        }
        // Reset form
        const resetData: Record<string, any> = {}
        config.fields.forEach(field => {
          resetData[field.name] = field.defaultValue ?? ''
        })
        setFormData(resetData)
        setFieldErrors({})
        onOpenChange(false)
      }
    } catch (err) {
      setError(t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const renderField = (field: FieldConfig) => {
    const value = formData[field.name]
    const error = fieldErrors[field.name]

    // Use custom render if provided
    if (field.customRender) {
      return (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.customRender(field, value, (newValue) => handleFieldChange(field.name, newValue))}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )
    }

    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={field.name}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className={error ? 'border-destructive' : ''}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )

      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select 
              value={value} 
              onValueChange={(value) => handleFieldChange(field.name, value)}
            >
              <SelectTrigger className={error ? 'border-destructive' : ''}>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )

      case 'number':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className={error ? 'border-destructive' : ''}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )

      case 'date':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              required={field.required}
              className={error ? 'border-destructive' : ''}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )

      default:
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type={field.type}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className={error ? 'border-destructive' : ''}
              autoFocus={config.fields.indexOf(field) === 0}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
            )}
            <div>
              <DialogTitle>{config.title}</DialogTitle>
              {config.description && (
                <DialogDescription>{config.description}</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {config.fields.map(renderField)}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                // Reset form
                const resetData: Record<string, any> = {}
                config.fields.forEach(field => {
                  resetData[field.name] = field.defaultValue ?? ''
                })
                setFormData(resetData)
                setFieldErrors({})
                setError(null)
                onOpenChange(false)
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !config.fields.every(field => !field.required || formData[field.name])}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {config.loadingLabel}
                </>
              ) : (
                config.submitLabel
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}