import { prisma } from '@/lib/prisma'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}

export interface UniquenessCheck {
  entityType: 'category' | 'person' | 'book' | 'cost_event_type'
  field: string
  value: string
  userId: string
  excludeId?: string // For updates, exclude current entity
}

export interface DeletionDependencyCheck {
  entityType: 'category' | 'person' | 'cost_event_type'
  entityId: string
  userId: string
}

export type ValidationRule<T> = {
  name: string
  validate: (value: T) => boolean | Promise<boolean>
  errorMessage: string
}

/**
 * ValidationService - Centralized business rule validation
 * 
 * This service provides:
 * - Uniqueness validation for entities
 * - Deletion dependency checks
 * - Custom validation rule engine
 * - Standardized validation patterns
 */
export class ValidationService {
  /**
   * Check if a value is unique for a specific entity field
   */
  static async checkUniqueness({
    entityType,
    field,
    value,
    userId,
    excludeId
  }: UniquenessCheck): Promise<ValidationResult> {
    const errors: string[] = []
    
    if (!value || !value.trim()) {
      return {
        isValid: false,
        errors: [`${field} is required`]
      }
    }
    
    try {
      const trimmedValue = value.trim()
      let existingRecord: any = null
      
      switch (entityType) {
        case 'category':
          existingRecord = await prisma.category.findFirst({
            where: {
              user_id: userId,
              name: trimmedValue,
              ...(excludeId ? { id: { not: excludeId } } : {})
            }
          })
          if (existingRecord) {
            errors.push('A category with this name already exists')
          }
          break
          
        case 'person':
          // For person, we might want to check name + lastname combination
          existingRecord = await prisma.person.findFirst({
            where: {
              user_id: userId,
              name: trimmedValue,
              ...(excludeId ? { id: { not: excludeId } } : {})
            }
          })
          if (existingRecord) {
            errors.push('A person with this name already exists')
          }
          break
          
        case 'book':
          // Check book reference uniqueness
          existingRecord = await prisma.book.findFirst({
            where: {
              user_id: userId,
              reference: trimmedValue,
              ...(excludeId ? { id: { not: excludeId } } : {})
            }
          })
          if (existingRecord) {
            errors.push('A book with this reference already exists')
          }
          break
          
        case 'cost_event_type':
          existingRecord = await prisma.costs_event_type.findFirst({
            where: {
              user_id: userId,
              name: trimmedValue,
              ...(excludeId ? { id: { not: excludeId } } : {})
            }
          })
          if (existingRecord) {
            errors.push('A cost event type with this name already exists')
          }
          break
      }
      
      return {
        isValid: errors.length === 0,
        errors
      }
    } catch (error) {
      console.error('Uniqueness check failed:', error)
      return {
        isValid: false,
        errors: ['Failed to validate uniqueness']
      }
    }
  }

  /**
   * Check if an entity can be deleted (no dependencies)
   */
  static async checkDeletionDependencies({
    entityType,
    entityId,
    userId
  }: DeletionDependencyCheck): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []
    
    try {
      switch (entityType) {
        case 'category':
          // Check if category is used by any items
          const itemsCount = await prisma.items.count({
            where: { category_id: entityId }
          })
          
          if (itemsCount > 0) {
            errors.push(`Cannot delete category that is being used by ${itemsCount} item${itemsCount > 1 ? 's' : ''}`)
          }
          
          // Check for child categories
          const childCategoriesCount = await prisma.category.count({
            where: { parent_category_id: entityId }
          })
          
          if (childCategoriesCount > 0) {
            errors.push(`Cannot delete category that has ${childCategoriesCount} sub-categor${childCategoriesCount > 1 ? 'ies' : 'y'}`)
          }
          break
          
        case 'person':
          // Check for associated purchases
          const purchasesCount = await prisma.item_purchases.count({
            where: { seller_id: entityId }
          })
          
          if (purchasesCount > 0) {
            errors.push(`Cannot delete person with ${purchasesCount} associated purchase${purchasesCount > 1 ? 's' : ''}`)
          }
          
          // Check for associated sales
          const salesCount = await prisma.item_sales.count({
            where: { client_id: entityId }
          })
          
          if (salesCount > 0) {
            errors.push(`Cannot delete person with ${salesCount} associated sale${salesCount > 1 ? 's' : ''}`)
          }
          break
          
        case 'cost_event_type':
          // Check for associated costs
          const costsCount = await prisma.costs.count({
            where: { 
              costs_event_type_id: entityId,
              user_id: userId
            }
          })
          
          if (costsCount > 0) {
            errors.push(`Cannot delete cost event type that is being used by ${costsCount} cost record${costsCount > 1 ? 's' : ''}`)
          }
          break
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings
      }
    } catch (error) {
      console.error('Deletion dependency check failed:', error)
      return {
        isValid: false,
        errors: ['Failed to check deletion dependencies']
      }
    }
  }

  /**
   * Validate using custom rules
   */
  static async validateWithRules<T>(
    value: T,
    rules: ValidationRule<T>[]
  ): Promise<ValidationResult> {
    const errors: string[] = []
    
    for (const rule of rules) {
      try {
        const isValid = await rule.validate(value)
        if (!isValid) {
          errors.push(rule.errorMessage)
        }
      } catch (error) {
        console.error(`Validation rule '${rule.name}' failed:`, error)
        errors.push(`Validation failed: ${rule.name}`)
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Common validation rules
   */
  static readonly rules = {
    required: (fieldName: string): ValidationRule<any> => ({
      name: `${fieldName}_required`,
      validate: (value) => !!value && (typeof value !== 'string' || value.trim().length > 0),
      errorMessage: `${fieldName} is required`
    }),
    
    minLength: (fieldName: string, min: number): ValidationRule<string> => ({
      name: `${fieldName}_min_length`,
      validate: (value) => !value || value.length >= min,
      errorMessage: `${fieldName} must be at least ${min} characters`
    }),
    
    maxLength: (fieldName: string, max: number): ValidationRule<string> => ({
      name: `${fieldName}_max_length`,
      validate: (value) => !value || value.length <= max,
      errorMessage: `${fieldName} must be no more than ${max} characters`
    }),
    
    email: (fieldName: string): ValidationRule<string> => ({
      name: `${fieldName}_email`,
      validate: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      errorMessage: `${fieldName} must be a valid email address`
    }),
    
    url: (fieldName: string): ValidationRule<string> => ({
      name: `${fieldName}_url`,
      validate: (value) => {
        if (!value) return true
        try {
          new URL(value)
          return true
        } catch {
          return false
        }
      },
      errorMessage: `${fieldName} must be a valid URL`
    }),
    
    positiveNumber: (fieldName: string): ValidationRule<number> => ({
      name: `${fieldName}_positive_number`,
      validate: (value) => value === null || value === undefined || value > 0,
      errorMessage: `${fieldName} must be a positive number`
    }),
    
    date: (fieldName: string): ValidationRule<string | Date> => ({
      name: `${fieldName}_date`,
      validate: (value) => {
        if (!value) return true
        const date = value instanceof Date ? value : new Date(value)
        return !isNaN(date.getTime())
      },
      errorMessage: `${fieldName} must be a valid date`
    }),
    
    futureDate: (fieldName: string): ValidationRule<string | Date> => ({
      name: `${fieldName}_future_date`,
      validate: (value) => {
        if (!value) return true
        const date = value instanceof Date ? value : new Date(value)
        return !isNaN(date.getTime()) && date > new Date()
      },
      errorMessage: `${fieldName} must be a future date`
    }),
    
    pastDate: (fieldName: string): ValidationRule<string | Date> => ({
      name: `${fieldName}_past_date`,
      validate: (value) => {
        if (!value) return true
        const date = value instanceof Date ? value : new Date(value)
        return !isNaN(date.getTime()) && date < new Date()
      },
      errorMessage: `${fieldName} must be a past date`
    })
  }

  /**
   * Validate item data
   */
  static async validateItem(data: {
    itemNumber: string
    description?: string
    bookId: string
    userId: string
  }): Promise<ValidationResult> {
    const errors: string[] = []
    
    // Check required fields
    if (!data.itemNumber?.trim()) {
      errors.push('Item number is required')
    }
    
    if (!data.bookId) {
      errors.push('Book is required')
    }
    
    // Check item number uniqueness within book
    if (data.itemNumber && data.bookId) {
      const existingItem = await prisma.items.findFirst({
        where: {
          book_id: data.bookId,
          item_number: data.itemNumber.trim()
        }
      })
      
      if (existingItem) {
        errors.push('An item with this number already exists in this book')
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate purchase data
   */
  static async validatePurchase(data: {
    itemId: string
    sellerId?: string
    purchasePrice?: number
    purchaseDate?: Date | string
  }): Promise<ValidationResult> {
    return this.validateWithRules(data, [
      this.rules.required('Item'),
      {
        name: 'purchase_price_positive',
        validate: (d) => !d.purchasePrice || d.purchasePrice > 0,
        errorMessage: 'Purchase price must be positive'
      },
      {
        name: 'purchase_date_past',
        validate: (d) => {
          if (!d.purchaseDate) return true
          const date = d.purchaseDate instanceof Date ? d.purchaseDate : new Date(d.purchaseDate)
          return date <= new Date()
        },
        errorMessage: 'Purchase date cannot be in the future'
      }
    ])
  }

  /**
   * Validate sale data
   */
  static async validateSale(data: {
    itemId: string
    clientId?: string
    salePrice?: number
    saleDate?: Date | string
  }): Promise<ValidationResult> {
    const errors: string[] = []
    
    // Basic validation
    const basicValidation = await this.validateWithRules(data, [
      this.rules.required('Item'),
      {
        name: 'sale_price_positive',
        validate: (d) => !d.salePrice || d.salePrice > 0,
        errorMessage: 'Sale price must be positive'
      },
      {
        name: 'sale_date_past',
        validate: (d) => {
          if (!d.saleDate) return true
          const date = d.saleDate instanceof Date ? d.saleDate : new Date(d.saleDate)
          return date <= new Date()
        },
        errorMessage: 'Sale date cannot be in the future'
      }
    ])
    
    errors.push(...basicValidation.errors)
    
    // Check if item is already sold
    if (data.itemId) {
      const existingSale = await prisma.item_sales.findFirst({
        where: { item_id: data.itemId }
      })
      
      if (existingSale) {
        errors.push('This item has already been sold')
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate cost data
   */
  static async validateCost(data: {
    amount: number
    date: Date | string
    costEventTypeId: string
    bookId?: string
  }): Promise<ValidationResult> {
    return this.validateWithRules(data, [
      this.rules.required('Amount'),
      this.rules.positiveNumber('Amount'),
      this.rules.required('Date'),
      this.rules.date('Date'),
      this.rules.required('Cost event type')
    ])
  }

  /**
   * Batch validation for multiple entities
   */
  static async validateBatch<T>(
    items: T[],
    validateFn: (item: T) => Promise<ValidationResult>
  ): Promise<{ results: ValidationResult[]; allValid: boolean }> {
    const results = await Promise.all(items.map(validateFn))
    const allValid = results.every(r => r.isValid)
    
    return { results, allValid }
  }
}