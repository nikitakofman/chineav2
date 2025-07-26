# Service Layer Migration Guide

This guide explains how to migrate existing server actions to use the new centralized service layer.

## Overview

The service layer provides:
- **AccessControlService**: Centralized authentication and authorization
- **ValidationService**: Business rule validation and uniqueness checks
- **SerializationService**: Consistent data serialization for API responses
- **EntityService**: Generic CRUD operations with integrated access control
- **FileService**: Unified file upload/download with access control

## Migration Examples

### 1. Simple CRUD Operations

**Before:**
```typescript
export async function createCategory(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  // Manual validation
  if (!name.trim()) {
    return { error: 'Category name is required' }
  }
  
  // Manual uniqueness check
  const existing = await prisma.category.findFirst({
    where: { user_id: user.id, name: name.trim() }
  })
  
  if (existing) {
    return { error: 'A category with this name already exists' }
  }
  
  const category = await prisma.category.create({
    data: { user_id: user.id, name: name.trim() }
  })
  
  return { category }
}
```

**After:**
```typescript
export async function createCategory(name: string) {
  const result = await EntityService.create('category', {
    name: name.trim()
  }, {
    revalidatePaths: ['/dashboard/categories']
  })
  
  if (!result.success) {
    return { error: result.validationErrors?.[0] || result.error }
  }
  
  return { category: result.data }
}
```

### 2. Access Control Checks

**Before:**
```typescript
export async function updateItemCategory(itemId: string, categoryId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  // Manual ownership check
  const item = await prisma.items.findFirst({
    where: { id: itemId },
    include: { book: true }
  })
  
  if (!item || item.book.user_id !== user.id) {
    return { error: 'Item not found or access denied' }
  }
  
  // Update logic...
}
```

**After:**
```typescript
export async function updateItemCategory(itemId: string, categoryId: string | null) {
  // Access control is automatic
  const accessCheck = await AccessControlService.checkEntityOwnership('item', itemId)
  if (!accessCheck.isOwner) {
    return { error: accessCheck.error || 'Access denied' }
  }
  
  // Or use EntityService which includes access control
  const result = await EntityService.update('item', itemId, {
    category_id: categoryId
  })
  
  if (!result.success) {
    return { error: result.error }
  }
  
  return { item: result.data }
}
```

### 3. Validation

**Before:**
```typescript
export async function createPerson(formData: FormData) {
  // Manual field extraction and validation
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  
  if (!name || !name.trim()) {
    return { error: 'Name is required' }
  }
  
  // Create person...
}
```

**After:**
```typescript
export async function createPerson(formData: FormData) {
  const data = {
    name: formData.get('name') as string,
    phone: formData.get('phone') as string
  }
  
  // Use validation service
  const validation = await ValidationService.validateWithRules(data, [
    ValidationService.rules.required('Name'),
    ValidationService.rules.maxLength('Name', 100)
  ])
  
  if (!validation.isValid) {
    return { error: validation.errors[0] }
  }
  
  // Or use EntityService which includes validation
  const result = await EntityService.create('person', data)
  
  if (!result.success) {
    return { error: result.validationErrors?.[0] || result.error }
  }
  
  return { person: result.data }
}
```

### 4. Serialization

**Before:**
```typescript
export async function getItemWithImages(itemId: string) {
  const item = await prisma.items.findUnique({
    where: { id: itemId },
    include: { item_purchases: true }
  })
  
  // Manual BigInt/Decimal handling
  return {
    item: {
      ...item,
      item_purchases: item.item_purchases.map(p => ({
        ...p,
        purchase_price: p.purchase_price?.toNumber()
      }))
    }
  }
}
```

**After:**
```typescript
export async function getItemWithImages(itemId: string) {
  const result = await EntityService.get('item', itemId, {
    include: { item_purchases: true }
  })
  
  if (!result.success) {
    return { error: result.error }
  }
  
  // Serialization is automatic
  return { item: result.data }
}
```

### 5. File Operations

**Before:**
```typescript
export async function uploadItemImage(itemId: string, file: File) {
  // Manual access control
  const item = await prisma.items.findFirst({
    where: { id: itemId },
    include: { book: true }
  })
  
  if (!item || item.book.user_id !== user.id) {
    return { error: 'Access denied' }
  }
  
  // Manual file validation
  if (file.size > 10 * 1024 * 1024) {
    return { error: 'File too large' }
  }
  
  // Upload file...
}
```

**After:**
```typescript
export async function uploadItemImage(itemId: string, file: File) {
  // FileService handles access control and validation
  const result = await FileService.uploadImage(file, 'item', itemId, {
    maxSizeMB: 10,
    isPrimary: true
  })
  
  if (!result.success) {
    return { error: result.error }
  }
  
  return { image: result.data }
}
```

## Step-by-Step Migration Process

1. **Identify the operation type**
   - CRUD operation → Use `EntityService`
   - File operation → Use `FileService`
   - Custom validation → Use `ValidationService`
   - Access control only → Use `AccessControlService`

2. **Remove boilerplate code**
   - Remove manual authentication checks
   - Remove manual ownership verification
   - Remove manual validation logic
   - Remove serialization code

3. **Replace with service calls**
   - Use appropriate service method
   - Pass required parameters
   - Handle response consistently

4. **Test the migration**
   - Verify authentication works
   - Test access control
   - Check validation rules
   - Ensure data is properly serialized

## Common Patterns

### Pattern 1: Create with Validation
```typescript
const result = await EntityService.create('entity_type', data, {
  validateBeforeCreate: true,
  revalidatePaths: ['/dashboard/path']
})

if (!result.success) {
  return { 
    error: result.validationErrors?.[0] || result.error 
  }
}

return { entity: result.data }
```

### Pattern 2: Update with Access Control
```typescript
const result = await EntityService.update('entity_type', id, data, {
  checkAccessControl: true,
  revalidatePaths: ['/dashboard/path']
})

if (!result.success) {
  return { error: result.error }
}

return { entity: result.data }
```

### Pattern 3: Delete with Dependencies
```typescript
const result = await EntityService.delete('entity_type', id, {
  checkAccessControl: true,
  revalidatePaths: ['/dashboard/path']
})

if (!result.success) {
  return { 
    error: result.validationErrors?.[0] || result.error 
  }
}

return { success: true }
```

### Pattern 4: List with Filtering
```typescript
const result = await EntityService.list('entity_type', {
  where: { some_field: value },
  orderBy: { created_at: 'desc' },
  include: { relation: true }
})

if (!result.success) {
  return []
}

return result.data || []
```

## Benefits After Migration

1. **Reduced Code Duplication**
   - No more repeated auth checks
   - Standardized validation
   - Consistent error handling

2. **Improved Maintainability**
   - Business logic in one place
   - Easy to update validation rules
   - Centralized access control

3. **Better Type Safety**
   - Type-safe service methods
   - Consistent return types
   - Auto-completion support

4. **Enhanced Security**
   - Automatic access control
   - Consistent ownership checks
   - Validated file uploads

5. **Consistent API Responses**
   - Automatic serialization
   - Standardized error format
   - Predictable data structure

## Next Steps

1. Start with simple CRUD operations
2. Migrate one server action at a time
3. Test each migration thoroughly
4. Update related components if needed
5. Remove old utility functions once migration is complete