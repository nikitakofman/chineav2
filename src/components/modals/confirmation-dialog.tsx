'use client'

import React, { useState, useEffect } from 'react'
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
import { 
  AlertTriangle, 
  Trash2, 
  AlertCircle, 
  Info, 
  Loader2 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConfirmationDialogProps, ConfirmationVariant } from '@/types/form-types'

// ============================================================================
// Variant Configuration
// ============================================================================

const variantConfig = {
  default: {
    icon: Info,
    iconColor: 'text-blue-500',
    iconBgColor: 'bg-blue-500/10',
    confirmButtonVariant: 'default' as const,
    title: 'Confirm Action'
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
    iconBgColor: 'bg-yellow-500/10',
    confirmButtonVariant: 'default' as const,
    title: 'Warning'
  },
  destructive: {
    icon: Trash2,
    iconColor: 'text-white',
    iconBgColor: 'bg-destructive',
    confirmButtonVariant: 'destructive' as const,
    title: 'Confirm Deletion'
  }
}

// ============================================================================
// ConfirmationDialog Component
// ============================================================================

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText,
  variant = 'default',
  loading = false,
  requireConfirmation = false,
  confirmationText = '',
  confirmationPlaceholder,
  onConfirm,
  onCancel,
  icon,
  children
}) => {
  const t = useTranslations()
  
  // State management
  const [confirmationInput, setConfirmationInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setConfirmationInput('')
      setError(null)
    }
  }, [open])

  // Get variant configuration
  const config = variantConfig[variant]
  const IconComponent = icon || config.icon

  // Default texts based on variant
  const defaultConfirmText = {
    default: t('common.confirm'),
    warning: t('common.proceed'),
    destructive: t('common.delete')
  }

  const defaultCancelText = t('common.cancel')

  const finalConfirmText = confirmText || defaultConfirmText[variant]
  const finalCancelText = cancelText || defaultCancelText

  // Check if confirmation input is valid
  const isConfirmationValid = !requireConfirmation || 
    (confirmationText && confirmationInput.trim() === confirmationText.trim())

  // Handle confirmation
  const handleConfirm = async () => {
    if (!isConfirmationValid) {
      setError(`Please type "${confirmationText}" to confirm`)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onConfirm()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
    onOpenChange(false)
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmationInput(e.target.value)
    if (error) {
      setError(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              config.iconBgColor
            )}>
              <IconComponent className={cn('w-5 h-5', config.iconColor)} />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {title || config.title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-sm mt-1">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Custom children content */}
          {children}

          {/* Confirmation input */}
          {requireConfirmation && confirmationText && (
            <div className="space-y-2">
              <Label htmlFor="confirmation-input">
                Type <strong>{confirmationText}</strong> to confirm:
              </Label>
              <Input
                id="confirmation-input"
                value={confirmationInput}
                onChange={handleInputChange}
                placeholder={confirmationPlaceholder || `Type "${confirmationText}"`}
                disabled={loading || isSubmitting}
                className={cn(
                  !isConfirmationValid && confirmationInput.length > 0 
                    ? 'border-destructive focus:border-destructive' 
                    : ''
                )}
                autoComplete="off"
                autoFocus
              />
              {!isConfirmationValid && confirmationInput.length > 0 && (
                <p className="text-sm text-destructive">
                  Text does not match. Please type "{confirmationText}" exactly.
                </p>
              )}
            </div>
          )}

          {/* Warning message for destructive actions */}
          {variant === 'destructive' && !children && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action cannot be undone. This will permanently delete the data.
              </AlertDescription>
            </Alert>
          )}

          {/* Warning message for warning variant */}
          {variant === 'warning' && !children && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please review your action before proceeding.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading || isSubmitting}
            className="sm:order-1"
          >
            {finalCancelText}
          </Button>
          
          <Button
            type="button"
            variant={config.confirmButtonVariant}
            onClick={handleConfirm}
            disabled={loading || isSubmitting || !isConfirmationValid}
            className="sm:order-2"
          >
            {(loading || isSubmitting) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {finalConfirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Convenience Hook for Common Confirmation Patterns
// ============================================================================

interface UseConfirmationOptions {
  title?: string
  description?: string
  variant?: ConfirmationVariant
  requireConfirmation?: boolean
  confirmationText?: string
}

export const useConfirmation = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<UseConfirmationOptions>({})
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => Promise<void> | void) | null>(null)

  const confirm = (
    callback: () => Promise<void> | void,
    confirmOptions: UseConfirmationOptions = {}
  ) => {
    setOptions(confirmOptions)
    setOnConfirmCallback(() => callback)
    setIsOpen(true)
  }

  const handleConfirm = async () => {
    if (onConfirmCallback) {
      await onConfirmCallback()
    }
    setIsOpen(false)
  }

  const handleCancel = () => {
    setIsOpen(false)
    setOnConfirmCallback(null)
  }

  const ConfirmationComponent = () => (
    <ConfirmationDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title={options.title}
      description={options.description}
      variant={options.variant}
      requireConfirmation={options.requireConfirmation}
      confirmationText={options.confirmationText}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  )

  return {
    confirm,
    ConfirmationComponent,
    isOpen,
    setIsOpen
  }
}

// ============================================================================
// Predefined Confirmation Dialogs
// ============================================================================

interface DeleteConfirmationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemName?: string
  onConfirm: () => Promise<void> | void
  loading?: boolean
}

export const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  open,
  onOpenChange,
  itemName = 'item',
  onConfirm,
  loading = false
}) => {
  const t = useTranslations()
  
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('common.confirmDeletion')}
      description={`Are you sure you want to delete this ${itemName}? This action cannot be undone.`}
      variant="destructive"
      requireConfirmation={true}
      confirmationText="DELETE"
      confirmationPlaceholder="Type DELETE to confirm"
      onConfirm={onConfirm}
      loading={loading}
    />
  )
}

interface UnsavedChangesConfirmationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void> | void
  onCancel?: () => void
}

export const UnsavedChangesConfirmation: React.FC<UnsavedChangesConfirmationProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel
}) => {
  const t = useTranslations()
  
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Unsaved Changes"
      description="You have unsaved changes. Are you sure you want to leave without saving?"
      variant="warning"
      confirmText="Leave without saving"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}

export default ConfirmationDialog