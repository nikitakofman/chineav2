// ============================================================================
// Modal Components Export Index
// ============================================================================

// Generic Modal Components
export { GenericCrudModal } from './generic-crud-modal'
export { 
  ConfirmationDialog, 
  DeleteConfirmation, 
  UnsavedChangesConfirmation,
  useConfirmation 
} from './confirmation-dialog'

// Types
export type {
  FieldConfig,
  FormSection,
  FormData,
  CrudMode,
  FieldType,
  ValidationRule,
  SelectOption,
  GenericCrudModalProps,
  ConfirmationDialogProps,
  ConfirmationVariant,
  CrudModalConfig,
  FormSubmissionResult
} from '@/types/form-types'

// Existing Modal Components (for backward compatibility)
export { UnifiedEntityModal } from './unified-entity-modal'