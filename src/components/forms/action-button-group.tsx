"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ActionButtonGroupProps } from "@/types/form-types"

export function ActionButtonGroup({
  onCancel,
  onSubmit,
  cancelLabel = "Cancel",
  submitLabel = "Save",
  cancelVariant = "outline",
  submitVariant = "default",
  isLoading = false,
  disabled = false,
  className,
  stackOnMobile = true,
  reverseOrder = false,
  showCancel = true,
  additionalActions,
}: ActionButtonGroupProps) {
  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    onCancel?.()
  }

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    onSubmit?.()
  }

  const buttons = (
    <>
      {/* Cancel button */}
      {showCancel && (
        <Button
          type="button"
          variant={cancelVariant}
          onClick={handleCancel}
          disabled={disabled || isLoading}
          className="min-w-[80px]"
        >
          {cancelLabel}
        </Button>
      )}
      
      {/* Additional actions */}
      {additionalActions}
      
      {/* Submit button */}
      <Button
        type="submit"
        variant={submitVariant}
        onClick={handleSubmit}
        disabled={disabled || isLoading}
        className="min-w-[80px]"
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </>
  )

  return (
    <div
      className={cn(
        "flex items-center gap-3",
        stackOnMobile && "flex-col sm:flex-row",
        !stackOnMobile && "flex-row",
        reverseOrder && "flex-row-reverse",
        stackOnMobile && reverseOrder && "flex-col-reverse sm:flex-row-reverse",
        className
      )}
    >
      {reverseOrder ? (
        React.Children.toArray(buttons).reverse()
      ) : (
        buttons
      )}
    </div>
  )
}

// Specialized button group variants
export function SaveCancelButtons(props: Omit<ActionButtonGroupProps, "submitLabel" | "cancelLabel">) {
  return (
    <ActionButtonGroup
      {...props}
      submitLabel="Save"
      cancelLabel="Cancel"
    />
  )
}

export function SubmitCancelButtons(props: Omit<ActionButtonGroupProps, "submitLabel" | "cancelLabel">) {
  return (
    <ActionButtonGroup
      {...props}
      submitLabel="Submit"
      cancelLabel="Cancel"
    />
  )
}

export function CreateCancelButtons(props: Omit<ActionButtonGroupProps, "submitLabel" | "cancelLabel">) {
  return (
    <ActionButtonGroup
      {...props}
      submitLabel="Create"
      cancelLabel="Cancel"
    />
  )
}

export function UpdateCancelButtons(props: Omit<ActionButtonGroupProps, "submitLabel" | "cancelLabel">) {
  return (
    <ActionButtonGroup
      {...props}
      submitLabel="Update"
      cancelLabel="Cancel"
    />
  )
}

export function DeleteCancelButtons(props: Omit<ActionButtonGroupProps, "submitLabel" | "cancelLabel" | "submitVariant">) {
  return (
    <ActionButtonGroup
      {...props}
      submitLabel="Delete"
      cancelLabel="Cancel"
      submitVariant="destructive"
    />
  )
}

export function ConfirmCancelButtons(props: Omit<ActionButtonGroupProps, "submitLabel" | "cancelLabel">) {
  return (
    <ActionButtonGroup
      {...props}
      submitLabel="Confirm"
      cancelLabel="Cancel"
    />
  )
}

// Form-specific button groups with common patterns
export function FormActions({
  onSave,
  onCancel,
  onReset,
  isLoading = false,
  disabled = false,
  showReset = false,
  className,
}: {
  onSave?: () => void
  onCancel?: () => void
  onReset?: () => void
  isLoading?: boolean
  disabled?: boolean
  showReset?: boolean
  className?: string
}) {
  return (
    <ActionButtonGroup
      onSubmit={onSave}
      onCancel={onCancel}
      submitLabel="Save"
      cancelLabel="Cancel"
      isLoading={isLoading}
      disabled={disabled}
      className={className}
      additionalActions={
        showReset && (
          <Button
            type="button"
            variant="ghost"
            onClick={onReset}
            disabled={disabled || isLoading}
            className="min-w-[80px]"
          >
            Reset
          </Button>
        )
      }
    />
  )
}

export function ModalActions({
  onSubmit,
  onCancel,
  submitLabel = "Save",
  isLoading = false,
  disabled = false,
  className,
}: {
  onSubmit?: () => void
  onCancel?: () => void
  submitLabel?: string
  isLoading?: boolean
  disabled?: boolean
  className?: string
}) {
  return (
    <ActionButtonGroup
      onSubmit={onSubmit}
      onCancel={onCancel}
      submitLabel={submitLabel}
      cancelLabel="Cancel"
      isLoading={isLoading}
      disabled={disabled}
      stackOnMobile={false}
      className={cn("justify-end", className)}
    />
  )
}

export function WizardActions({
  onPrevious,
  onNext,
  onFinish,
  canGoBack = true,
  canGoNext = true,
  isLastStep = false,
  isLoading = false,
  disabled = false,
  className,
}: {
  onPrevious?: () => void
  onNext?: () => void
  onFinish?: () => void
  canGoBack?: boolean
  canGoNext?: boolean
  isLastStep?: boolean
  isLoading?: boolean
  disabled?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      {/* Previous button */}
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={disabled || isLoading || !canGoBack}
        className="min-w-[80px]"
      >
        Previous
      </Button>
      
      {/* Next/Finish button */}
      <Button
        type="button"
        onClick={isLastStep ? onFinish : onNext}
        disabled={disabled || isLoading || !canGoNext}
        className="min-w-[80px]"
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLastStep ? "Finish" : "Next"}
      </Button>
    </div>
  )
}