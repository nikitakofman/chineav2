'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export interface ConfirmationDialogConfig {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  successMessage?: string
  errorMessage?: string
  requireRefresh?: boolean
}

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: ConfirmationDialogConfig
  onConfirm: () => Promise<{ error?: string; success?: boolean }>
  onSuccess?: () => void
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  config,
  onConfirm,
  onSuccess
}: ConfirmationDialogProps) {
  const t = useTranslations()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)

    try {
      const result = await onConfirm()

      if (result.error) {
        toast.error(result.error || config.errorMessage || t('common.error'))
      } else {
        toast.success(config.successMessage || t('common.success'))
        if (onSuccess) {
          onSuccess()
        }
        onOpenChange(false)
        if (config.requireRefresh) {
          router.refresh()
        }
      }
    } catch (error) {
      toast.error(config.errorMessage || t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{config.title}</AlertDialogTitle>
          <AlertDialogDescription>{config.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {config.cancelLabel || t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm} 
            disabled={isLoading}
            className={config.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.processing')}
              </>
            ) : (
              config.confirmLabel || t('common.confirm')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}