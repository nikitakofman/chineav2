import { ReactNode } from "react"
import { FieldValues, FieldPath, ControllerProps } from "react-hook-form"

// Base form field props
export interface BaseFormFieldProps {
  label?: string
  description?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

// Form field component props
export interface FormFieldComponentProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends BaseFormFieldProps, ControllerProps<TFieldValues, TName> {
  type?: "text" | "email" | "number" | "tel" | "url" | "search"
  showRequiredIndicator?: boolean
  helperText?: string
}

// Password input props
export interface PasswordInputProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  showStrength?: boolean
  autoComplete?: string
}

// Currency input props
export interface CurrencyInputProps {
  value?: number | string
  onChange?: (value: number) => void
  currency?: string
  locale?: string
  placeholder?: string
  disabled?: boolean
  className?: string
  min?: number
  max?: number
  precision?: number
}

// Date input props
export interface DateInputProps {
  value?: Date | string
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minDate?: Date
  maxDate?: Date
  showTime?: boolean
  format?: string
}

// Entity for select dropdown
export interface SelectEntity {
  id: string | number
  name: string
  description?: string
  disabled?: boolean
  [key: string]: any
}

// Entity select props
export interface EntitySelectProps {
  entities: SelectEntity[]
  value?: string | number
  onChange?: (value: string | number | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  searchable?: boolean
  clearable?: boolean
  loading?: boolean
  emptyMessage?: string
  createNewLabel?: string
  onCreateNew?: () => void
}

// File upload props
export interface FileUploadProps {
  value?: File | File[] | string | string[]
  onChange?: (files: File | File[] | null) => void
  accept?: string
  multiple?: boolean
  maxSize?: number
  maxFiles?: number
  disabled?: boolean
  className?: string
  showPreview?: boolean
  previewClassName?: string
  dragAndDrop?: boolean
  children?: ReactNode
}

// Action button group props
export interface ActionButtonGroupProps {
  onCancel?: () => void
  onSubmit?: () => void
  cancelLabel?: string
  submitLabel?: string
  cancelVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  submitVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  isLoading?: boolean
  disabled?: boolean
  className?: string
  stackOnMobile?: boolean
  reverseOrder?: boolean
  showCancel?: boolean
  additionalActions?: ReactNode
}

// Form card props
export interface FormCardProps {
  title?: string
  description?: string
  children: ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
  footer?: ReactNode
}

// Form section props
export interface FormSectionProps {
  title: string
  description?: string
  children: ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
  className?: string
  headerClassName?: string
  contentClassName?: string
  required?: boolean
}

// Field group props
export interface FieldGroupProps {
  children: ReactNode
  columns?: 1 | 2 | 3 | 4
  className?: string
  gap?: "sm" | "md" | "lg"
  align?: "start" | "center" | "end"
}

// Common validation types
export interface ValidationRule {
  required?: boolean | string
  minLength?: number | { value: number; message: string }
  maxLength?: number | { value: number; message: string }
  min?: number | { value: number; message: string }
  max?: number | { value: number; message: string }
  pattern?: RegExp | { value: RegExp; message: string }
  validate?: (value: any) => boolean | string
}

// Form state types
export interface FormLoadingState {
  isSubmitting: boolean
  isValidating: boolean
  isLoading: boolean
}

export interface FormErrorState {
  hasErrors: boolean
  errorCount: number
  firstErrorField?: string
}

// Theme and styling types
export interface FormTheme {
  spacing: "compact" | "comfortable" | "spacious"
  variant: "default" | "bordered" | "filled" | "ghost"
  size: "sm" | "md" | "lg"
}

// ============================================================================
// Generic CRUD Modal Types
// ============================================================================

// Field types enum
export type FieldType = 
  | "text"
  | "email"
  | "number"
  | "tel"
  | "url"
  | "password"
  | "textarea"
  | "select"
  | "date"

// CRUD operation modes
export type CrudMode = "create" | "edit" | "view"

// Form data is a record of field values
export type FormData = Record<string, any>

// Field validation configuration
export interface FieldValidation {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  step?: number
  pattern?: string
  custom?: (value: any) => string | undefined
}

// Select option configuration
export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

// Field configuration
export interface FieldConfig {
  id: string
  name: string
  label: string
  type: FieldType
  placeholder?: string
  description?: string
  validation?: FieldValidation
  disabled?: boolean
  className?: string
  autoComplete?: string
  // For select fields
  options?: SelectOption[]
  // For textarea
  rows?: number
}

// Form section configuration
export interface FormSection {
  id: string
  title: string
  description?: string
  fields: FieldConfig[]
  collapsible?: boolean
  defaultExpanded?: boolean
  className?: string
}

// Field error
export interface FieldError {
  field: string
  message: string
}

// Validation result
export interface ValidationResult {
  isValid: boolean
  errors: FieldError[]
}

// Submit result
export interface SubmitResult {
  success: boolean
  data?: any
  error?: string
  validationErrors?: Record<string, string>
}

// Modal configuration
export interface ModalConfig {
  title?: string
  description?: string
  submitButtonText?: string
  cancelButtonText?: string
  resetButtonText?: string
  showReset?: boolean
  showCancel?: boolean
  width?: "sm" | "md" | "lg" | "xl" | "full"
  height?: "auto" | "sm" | "md" | "lg" | "full"
  icon?: React.ComponentType<{ className?: string }>
  iconColor?: string
  iconBgColor?: string
}

// Generic CRUD modal props
export interface GenericCrudModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: CrudMode
  title?: string
  description?: string
  fields?: FieldConfig[]
  sections?: FormSection[]
  data?: FormData
  config?: ModalConfig
  loading?: boolean
  error?: string
  onSubmit: (data: FormData) => Promise<SubmitResult>
  onReset?: () => void
  className?: string
  children?: ReactNode
}

// Confirmation dialog types
export type ConfirmationVariant = "default" | "destructive" | "warning" | "info"

export interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmationVariant
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
  requireConfirmation?: boolean
  confirmationText?: string
  confirmationPlaceholder?: string
  icon?: React.ComponentType<{ className?: string }>
  children?: ReactNode
}

// Aliases for backwards compatibility
export type CrudModalConfig = ModalConfig
export type FormSubmissionResult = SubmitResult