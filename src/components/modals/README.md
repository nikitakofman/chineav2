# Generic Modal System

A comprehensive modal system that provides reusable components for CRUD operations and confirmations, designed to replace repetitive modal patterns throughout the application.

## Components

### 1. GenericCrudModal

A flexible modal component for Create, Read, Update operations with dynamic field configuration.

#### Features

- **Dynamic Field Types**: text, textarea, number, select, date, email, tel, url, password
- **Form Sections**: Organize fields into collapsible sections
- **Validation**: Built-in validation with custom rules
- **Modes**: create, edit, view with automatic UI adjustments
- **Internationalization**: Full support for useTranslations
- **Responsive Design**: Mobile-friendly with adaptive layouts
- **Type Safety**: Full TypeScript support

#### Basic Usage

```tsx
import { GenericCrudModal, FieldConfig } from '@/components/modals'

const fields: FieldConfig[] = [
  {
    id: 'name',
    name: 'name',
    label: 'Full Name',
    type: 'text',
    validation: { required: true, minLength: 2 }
  },
  {
    id: 'email',
    name: 'email',
    label: 'Email',
    type: 'email',
    validation: { required: true }
  }
]

const handleSubmit = async (data) => {
  // Your submission logic
  return { success: true, data }
}

<GenericCrudModal
  open={open}
  onOpenChange={setOpen}
  mode="create"
  title="Add User"
  fields={fields}
  onSubmit={handleSubmit}
/>
```

#### Advanced Usage with Sections

```tsx
import { GenericCrudModal, FormSection } from '@/components/modals'

const sections: FormSection[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    fields: [
      {
        id: 'name',
        name: 'name',
        label: 'Name',
        type: 'text',
        validation: { required: true }
      }
    ]
  },
  {
    id: 'contact',
    title: 'Contact Details',
    collapsible: true,
    fields: [
      {
        id: 'phone',
        name: 'phone',
        label: 'Phone',
        type: 'tel'
      }
    ]
  }
]

<GenericCrudModal
  open={open}
  onOpenChange={setOpen}
  mode="create"
  title="Add Contact"
  sections={sections}
  onSubmit={handleSubmit}
  config={{
    icon: User,
    width: 'lg',
    showReset: true
  }}
/>
```

### 2. ConfirmationDialog

A flexible confirmation dialog with support for different variants and typed confirmation inputs.

#### Features

- **Variants**: default, warning, destructive
- **Typed Confirmation**: Require users to type specific text
- **Async Support**: Handle async confirmation actions
- **Custom Content**: Support for custom children content
- **Loading States**: Built-in loading indicators

#### Basic Usage

```tsx
import { ConfirmationDialog } from '@/components/modals'

<ConfirmationDialog
  open={open}
  onOpenChange={setOpen}
  title="Confirm Action"
  description="Are you sure you want to proceed?"
  variant="warning"
  onConfirm={handleConfirm}
/>
```

#### Destructive Confirmation with Typed Input

```tsx
<ConfirmationDialog
  open={open}
  onOpenChange={setOpen}
  title="Delete Item"
  description="This action cannot be undone."
  variant="destructive"
  requireConfirmation={true}
  confirmationText="DELETE"
  onConfirm={handleDelete}
/>
```

#### Predefined Confirmations

```tsx
import { DeleteConfirmation, UnsavedChangesConfirmation } from '@/components/modals'

// Quick delete confirmation
<DeleteConfirmation
  open={open}
  onOpenChange={setOpen}
  itemName="user"
  onConfirm={handleDelete}
/>

// Unsaved changes warning
<UnsavedChangesConfirmation
  open={open}
  onOpenChange={setOpen}
  onConfirm={handleLeave}
/>
```

#### Using the Confirmation Hook

```tsx
import { useConfirmation } from '@/components/modals'

const { confirm, ConfirmationComponent } = useConfirmation()

const handleAction = () => {
  confirm(
    async () => {
      // Your async action
      await performAction()
    },
    {
      title: 'Process Data',
      variant: 'warning',
      requireConfirmation: true,
      confirmationText: 'PROCESS'
    }
  )
}

// Render the component
<ConfirmationComponent />
```

## Field Configuration

### Field Types

| Type | Description | Validation Support |
|------|-------------|-------------------|
| `text` | Standard text input | required, minLength, maxLength, pattern |
| `textarea` | Multi-line text input | required, minLength, maxLength |
| `number` | Numeric input | required, min, max, step |
| `select` | Dropdown selection | required |
| `date` | Date picker | required |
| `email` | Email input with validation | required, pattern (auto) |
| `tel` | Phone number input | required, pattern |
| `url` | URL input with validation | required, pattern (auto) |
| `password` | Password input | required, minLength, maxLength, pattern |

### Validation Rules

```tsx
interface ValidationRule {
  required?: boolean
  min?: number           // For numbers
  max?: number           // For numbers
  minLength?: number     // For strings
  maxLength?: number     // For strings
  pattern?: string       // RegExp pattern
  step?: number          // For numbers
  custom?: (value: any) => string | undefined
}
```

### Select Options

```tsx
interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}
```

## Form Sections

Organize fields into logical groups with optional collapsible behavior:

```tsx
interface FormSection {
  id: string
  title: string
  description?: string
  fields: FieldConfig[]
  className?: string
  collapsible?: boolean
  defaultExpanded?: boolean
}
```

## Modal Configuration

Customize modal appearance and behavior:

```tsx
interface CrudModalConfig {
  title?: string
  description?: string
  icon?: React.ComponentType<any>
  iconColor?: string
  iconBgColor?: string
  submitButtonText?: string
  cancelButtonText?: string
  resetButtonText?: string
  showReset?: boolean
  showCancel?: boolean
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  height?: 'auto' | 'sm' | 'md' | 'lg' | 'full'
}
```

## Migration Guide

### Replacing Existing Modals

The generic modal system can replace most existing modal patterns:

#### Before (Custom Modal)
```tsx
const AddUserModal = ({ open, onClose }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  
  // Lots of boilerplate validation and form handling...
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* Custom form JSX */}
    </Dialog>
  )
}
```

#### After (Generic Modal)
```tsx
const fields: FieldConfig[] = [
  {
    id: 'name',
    name: 'name',
    label: 'Name',
    type: 'text',
    validation: { required: true }
  },
  {
    id: 'email',
    name: 'email',
    label: 'Email',
    type: 'email',
    validation: { required: true }
  }
]

<GenericCrudModal
  open={open}
  onOpenChange={onClose}
  mode="create"
  title="Add User"
  fields={fields}
  onSubmit={handleSubmit}
/>
```

### Benefits of Migration

1. **Reduced Code**: 70-80% less boilerplate code
2. **Consistency**: Uniform styling and behavior
3. **Validation**: Built-in validation with error handling
4. **Accessibility**: Proper ARIA attributes and keyboard navigation
5. **Internationalization**: Automatic translation support
6. **Type Safety**: Full TypeScript support
7. **Responsive**: Mobile-friendly out of the box

## Best Practices

1. **Field Organization**: Use sections for forms with more than 5-6 fields
2. **Validation**: Always provide meaningful validation messages
3. **Loading States**: Handle async operations with loading indicators
4. **Error Handling**: Provide clear error messages for failed submissions
5. **Confirmation**: Use typed confirmation for destructive actions
6. **Accessibility**: Always provide proper labels and descriptions

## Examples

See `example-usage.tsx` for comprehensive examples of:
- Simple forms with basic fields
- Complex forms with sections
- Different confirmation patterns
- Validation examples
- Error handling

## Type Definitions

All types are exported from `@/types/form-types.ts` and can be imported from the modal index:

```tsx
import {
  FieldConfig,
  FormSection,
  GenericCrudModalProps,
  ConfirmationDialogProps
} from '@/components/modals'
```