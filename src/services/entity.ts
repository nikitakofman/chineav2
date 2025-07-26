import { prisma } from '@/lib/prisma'
import { AccessControlService, EntityType } from './access-control'
import { ValidationService } from './validation'
import { SerializationService } from './serialization'
import { revalidatePath } from 'next/cache'

export interface EntityServiceOptions {
  validateBeforeCreate?: boolean
  validateBeforeUpdate?: boolean
  checkAccessControl?: boolean
  serializeResponse?: boolean
  revalidatePaths?: string[]
}

export interface CreateEntityResult<T> {
  success: boolean
  data?: T
  error?: string
  validationErrors?: string[]
}

export interface UpdateEntityResult<T> {
  success: boolean
  data?: T
  error?: string
  validationErrors?: string[]
}

export interface DeleteEntityResult {
  success: boolean
  error?: string
  validationErrors?: string[]
}

export interface GetEntityResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface ListEntitiesResult<T> {
  success: boolean
  data?: T[]
  total?: number
  error?: string
}

/**
 * EntityService - Generic CRUD operations for all entities
 * 
 * This service provides:
 * - Standardized CRUD operations
 * - Automatic access control
 * - Integrated validation
 * - Response serialization
 * - Error handling
 */
export class EntityService {
  private static defaultOptions: EntityServiceOptions = {
    validateBeforeCreate: true,
    validateBeforeUpdate: true,
    checkAccessControl: true,
    serializeResponse: true,
    revalidatePaths: []
  }

  /**
   * Create a new entity with validation and access control
   */
  static async create<T>(
    entityType: EntityType,
    data: any,
    options: EntityServiceOptions = {}
  ): Promise<CreateEntityResult<T>> {
    const opts = { ...this.defaultOptions, ...options }
    
    try {
      // Check authentication
      if (opts.checkAccessControl) {
        const authCheck = await AccessControlService.checkAuthentication()
        if (!authCheck.hasAccess) {
          return {
            success: false,
            error: authCheck.error || 'Not authenticated'
          }
        }
      }
      
      // Get current user ID
      const userId = await AccessControlService.getCurrentUserId()
      if (!userId) {
        return {
          success: false,
          error: 'User ID not found'
        }
      }
      
      // Validate if needed
      if (opts.validateBeforeCreate) {
        const validation = await this.validateForCreate(entityType, data, userId)
        if (!validation.isValid) {
          return {
            success: false,
            validationErrors: validation.errors
          }
        }
      }
      
      // Create entity
      let result: any
      switch (entityType) {
        case 'category':
          result = await prisma.category.create({
            data: {
              ...data,
              user_id: userId
            }
          })
          break
          
        case 'person':
          result = await prisma.person.create({
            data: {
              ...data,
              user_id: userId
            }
          })
          break
          
        case 'cost':
          result = await prisma.costs.create({
            data: {
              ...data,
              user_id: userId
            }
          })
          break
          
        case 'book':
          result = await prisma.book.create({
            data: {
              ...data,
              user_id: userId
            }
          })
          break
          
        case 'item':
          result = await prisma.items.create({
            data: data
          })
          break
          
        case 'incident':
          result = await prisma.item_incidents.create({
            data: data
          })
          break
          
        case 'sale':
          result = await prisma.item_sales.create({
            data: data
          })
          break
          
        case 'purchase':
          result = await prisma.item_purchases.create({
            data: data
          })
          break
          
        default:
          return {
            success: false,
            error: `Unsupported entity type: ${entityType}`
          }
      }
      
      // Revalidate paths
      if (opts.revalidatePaths?.length) {
        opts.revalidatePaths.forEach(path => revalidatePath(path))
      }
      
      // Serialize response
      const serializedResult = opts.serializeResponse
        ? SerializationService.serialize<T>(result)
        : result as T
      
      return {
        success: true,
        data: serializedResult
      }
    } catch (error) {
      console.error(`Failed to create ${entityType}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create entity'
      }
    }
  }

  /**
   * Update an entity with validation and access control
   */
  static async update<T>(
    entityType: EntityType,
    entityId: string,
    data: any,
    options: EntityServiceOptions = {}
  ): Promise<UpdateEntityResult<T>> {
    const opts = { ...this.defaultOptions, ...options }
    
    try {
      // Check access control
      if (opts.checkAccessControl) {
        const accessCheck = await AccessControlService.checkEntityOwnership(entityType, entityId)
        if (!accessCheck.isOwner) {
          return {
            success: false,
            error: accessCheck.error || 'Access denied'
          }
        }
      }
      
      // Get current user ID
      const userId = await AccessControlService.getCurrentUserId()
      if (!userId) {
        return {
          success: false,
          error: 'User ID not found'
        }
      }
      
      // Validate if needed
      if (opts.validateBeforeUpdate) {
        const validation = await this.validateForUpdate(entityType, entityId, data, userId)
        if (!validation.isValid) {
          return {
            success: false,
            validationErrors: validation.errors
          }
        }
      }
      
      // Update entity
      let result: any
      const updateData = {
        ...data,
        updated_at: new Date()
      }
      
      switch (entityType) {
        case 'category':
          result = await prisma.category.update({
            where: { id: entityId },
            data: updateData
          })
          break
          
        case 'person':
          result = await prisma.person.update({
            where: { id: entityId },
            data: updateData
          })
          break
          
        case 'cost':
          result = await prisma.costs.update({
            where: { id: entityId },
            data: updateData
          })
          break
          
        case 'book':
          result = await prisma.book.update({
            where: { id: entityId },
            data: updateData
          })
          break
          
        case 'item':
          result = await prisma.items.update({
            where: { id: entityId },
            data: updateData
          })
          break
          
        case 'incident':
          result = await prisma.item_incidents.update({
            where: { id: entityId },
            data: updateData
          })
          break
          
        case 'sale':
          result = await prisma.item_sales.update({
            where: { id: entityId },
            data: updateData
          })
          break
          
        case 'purchase':
          result = await prisma.item_purchases.update({
            where: { id: entityId },
            data: updateData
          })
          break
          
        default:
          return {
            success: false,
            error: `Unsupported entity type: ${entityType}`
          }
      }
      
      // Revalidate paths
      if (opts.revalidatePaths?.length) {
        opts.revalidatePaths.forEach(path => revalidatePath(path))
      }
      
      // Serialize response
      const serializedResult = opts.serializeResponse
        ? SerializationService.serialize<T>(result)
        : result as T
      
      return {
        success: true,
        data: serializedResult
      }
    } catch (error) {
      console.error(`Failed to update ${entityType}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update entity'
      }
    }
  }

  /**
   * Delete an entity with dependency checking and access control
   */
  static async delete(
    entityType: EntityType,
    entityId: string,
    options: EntityServiceOptions = {}
  ): Promise<DeleteEntityResult> {
    const opts = { ...this.defaultOptions, ...options }
    
    try {
      // Check access control
      if (opts.checkAccessControl) {
        const accessCheck = await AccessControlService.checkEntityOwnership(entityType, entityId)
        if (!accessCheck.isOwner) {
          return {
            success: false,
            error: accessCheck.error || 'Access denied'
          }
        }
      }
      
      // Get current user ID
      const userId = await AccessControlService.getCurrentUserId()
      if (!userId) {
        return {
          success: false,
          error: 'User ID not found'
        }
      }
      
      // Check deletion dependencies
      if (['category', 'person', 'cost_event_type'].includes(entityType)) {
        const dependencyCheck = await ValidationService.checkDeletionDependencies({
          entityType: entityType as any,
          entityId,
          userId
        })
        
        if (!dependencyCheck.isValid) {
          return {
            success: false,
            validationErrors: dependencyCheck.errors
          }
        }
      }
      
      // Delete entity
      switch (entityType) {
        case 'category':
          await prisma.category.delete({ where: { id: entityId } })
          break
          
        case 'person':
          await prisma.person.delete({ where: { id: entityId } })
          break
          
        case 'cost':
          await prisma.costs.delete({ where: { id: entityId } })
          break
          
        case 'book':
          await prisma.book.delete({ where: { id: entityId } })
          break
          
        case 'item':
          await prisma.items.delete({ where: { id: entityId } })
          break
          
        case 'incident':
          await prisma.item_incidents.delete({ where: { id: entityId } })
          break
          
        case 'sale':
          await prisma.item_sales.delete({ where: { id: entityId } })
          break
          
        case 'purchase':
          await prisma.item_purchases.delete({ where: { id: entityId } })
          break
          
        default:
          return {
            success: false,
            error: `Unsupported entity type: ${entityType}`
          }
      }
      
      // Revalidate paths
      if (opts.revalidatePaths?.length) {
        opts.revalidatePaths.forEach(path => revalidatePath(path))
      }
      
      return {
        success: true
      }
    } catch (error) {
      console.error(`Failed to delete ${entityType}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete entity'
      }
    }
  }

  /**
   * Get a single entity with access control
   */
  static async get<T>(
    entityType: EntityType,
    entityId: string,
    options: EntityServiceOptions & { include?: any } = {}
  ): Promise<GetEntityResult<T>> {
    const opts = { ...this.defaultOptions, ...options }
    
    try {
      // Check access control
      if (opts.checkAccessControl) {
        const accessCheck = await AccessControlService.checkEntityOwnership(entityType, entityId)
        if (!accessCheck.isOwner) {
          return {
            success: false,
            error: accessCheck.error || 'Access denied'
          }
        }
      }
      
      // Get entity
      let result: any
      const queryOptions = opts.include ? { include: opts.include } : {}
      
      switch (entityType) {
        case 'category':
          result = await prisma.category.findUnique({
            where: { id: entityId },
            ...queryOptions
          })
          break
          
        case 'person':
          result = await prisma.person.findUnique({
            where: { id: entityId },
            ...queryOptions
          })
          break
          
        case 'cost':
          result = await prisma.costs.findUnique({
            where: { id: entityId },
            ...queryOptions
          })
          break
          
        case 'book':
          result = await prisma.book.findUnique({
            where: { id: entityId },
            ...queryOptions
          })
          break
          
        case 'item':
          result = await prisma.items.findUnique({
            where: { id: entityId },
            ...queryOptions
          })
          break
          
        case 'incident':
          result = await prisma.item_incidents.findUnique({
            where: { id: entityId },
            ...queryOptions
          })
          break
          
        case 'sale':
          result = await prisma.item_sales.findUnique({
            where: { id: entityId },
            ...queryOptions
          })
          break
          
        case 'purchase':
          result = await prisma.item_purchases.findUnique({
            where: { id: entityId },
            ...queryOptions
          })
          break
          
        default:
          return {
            success: false,
            error: `Unsupported entity type: ${entityType}`
          }
      }
      
      if (!result) {
        return {
          success: false,
          error: 'Entity not found'
        }
      }
      
      // Serialize response
      const serializedResult = opts.serializeResponse
        ? SerializationService.serialize<T>(result)
        : result as T
      
      return {
        success: true,
        data: serializedResult
      }
    } catch (error) {
      console.error(`Failed to get ${entityType}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get entity'
      }
    }
  }

  /**
   * List entities with filtering and pagination
   */
  static async list<T>(
    entityType: EntityType,
    options: EntityServiceOptions & {
      where?: any
      orderBy?: any
      include?: any
      skip?: number
      take?: number
    } = {}
  ): Promise<ListEntitiesResult<T>> {
    const opts = { ...this.defaultOptions, ...options }
    
    try {
      // Check authentication
      if (opts.checkAccessControl) {
        const authCheck = await AccessControlService.checkAuthentication()
        if (!authCheck.hasAccess) {
          return {
            success: false,
            error: authCheck.error || 'Not authenticated'
          }
        }
      }
      
      // Get current user ID
      const userId = await AccessControlService.getCurrentUserId()
      if (!userId) {
        return {
          success: false,
          error: 'User ID not found'
        }
      }
      
      // Build query
      const queryOptions: any = {
        where: opts.where || {},
        orderBy: opts.orderBy || { created_at: 'desc' }
      }
      
      if (opts.include) queryOptions.include = opts.include
      if (opts.skip !== undefined) queryOptions.skip = opts.skip
      if (opts.take !== undefined) queryOptions.take = opts.take
      
      // Add user filter for user-scoped entities
      if (['category', 'person', 'cost', 'book'].includes(entityType)) {
        queryOptions.where.user_id = userId
      }
      
      // Get entities
      let results: any[]
      let total: number | undefined
      
      switch (entityType) {
        case 'category':
          results = await prisma.category.findMany(queryOptions)
          if (opts.take) total = await prisma.category.count({ where: queryOptions.where })
          break
          
        case 'person':
          results = await prisma.person.findMany(queryOptions)
          if (opts.take) total = await prisma.person.count({ where: queryOptions.where })
          break
          
        case 'cost':
          results = await prisma.costs.findMany(queryOptions)
          if (opts.take) total = await prisma.costs.count({ where: queryOptions.where })
          break
          
        case 'book':
          results = await prisma.book.findMany(queryOptions)
          if (opts.take) total = await prisma.book.count({ where: queryOptions.where })
          break
          
        case 'item':
          // Items need to be filtered by book ownership
          queryOptions.where = {
            ...queryOptions.where,
            book: {
              user_id: userId
            }
          }
          results = await prisma.items.findMany(queryOptions)
          if (opts.take) total = await prisma.items.count({ where: queryOptions.where })
          break
          
        case 'incident':
          // Incidents need to be filtered by item's book ownership
          queryOptions.where = {
            ...queryOptions.where,
            items: {
              book: {
                user_id: userId
              }
            }
          }
          results = await prisma.item_incidents.findMany(queryOptions)
          if (opts.take) total = await prisma.item_incidents.count({ where: queryOptions.where })
          break
          
        case 'sale':
          // Sales need to be filtered by item's book ownership
          queryOptions.where = {
            ...queryOptions.where,
            items: {
              book: {
                user_id: userId
              }
            }
          }
          results = await prisma.item_sales.findMany(queryOptions)
          if (opts.take) total = await prisma.item_sales.count({ where: queryOptions.where })
          break
          
        case 'purchase':
          // Purchases need to be filtered by item's book ownership
          queryOptions.where = {
            ...queryOptions.where,
            items: {
              book: {
                user_id: userId
              }
            }
          }
          results = await prisma.item_purchases.findMany(queryOptions)
          if (opts.take) total = await prisma.item_purchases.count({ where: queryOptions.where })
          break
          
        default:
          return {
            success: false,
            error: `Unsupported entity type: ${entityType}`
          }
      }
      
      // Serialize response
      const serializedResults = opts.serializeResponse
        ? SerializationService.serializePrismaResult<T[]>(results)
        : results as T[]
      
      return {
        success: true,
        data: serializedResults,
        total
      }
    } catch (error) {
      console.error(`Failed to list ${entityType}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list entities'
      }
    }
  }

  /**
   * Validate data for entity creation
   */
  private static async validateForCreate(
    entityType: EntityType,
    data: any,
    userId: string
  ) {
    switch (entityType) {
      case 'category':
        return ValidationService.checkUniqueness({
          entityType: 'category',
          field: 'name',
          value: data.name,
          userId
        })
        
      case 'person':
        return ValidationService.checkUniqueness({
          entityType: 'person',
          field: 'name',
          value: data.name,
          userId
        })
        
      case 'item':
        return ValidationService.validateItem({
          itemNumber: data.item_number,
          description: data.description,
          bookId: data.book_id,
          userId
        })
        
      case 'sale':
        return ValidationService.validateSale({
          itemId: data.item_id,
          clientId: data.client_id,
          salePrice: data.sale_price,
          saleDate: data.sale_date
        })
        
      case 'purchase':
        return ValidationService.validatePurchase({
          itemId: data.item_id,
          sellerId: data.seller_id,
          purchasePrice: data.purchase_price,
          purchaseDate: data.purchase_date
        })
        
      case 'cost':
        return ValidationService.validateCost({
          amount: data.amount,
          date: data.date,
          costEventTypeId: data.costs_event_type_id,
          bookId: data.book_id
        })
        
      default:
        return { isValid: true, errors: [] }
    }
  }

  /**
   * Validate data for entity update
   */
  private static async validateForUpdate(
    entityType: EntityType,
    entityId: string,
    data: any,
    userId: string
  ) {
    switch (entityType) {
      case 'category':
        if (data.name) {
          return ValidationService.checkUniqueness({
            entityType: 'category',
            field: 'name',
            value: data.name,
            userId,
            excludeId: entityId
          })
        }
        break
        
      case 'person':
        if (data.name) {
          return ValidationService.checkUniqueness({
            entityType: 'person',
            field: 'name',
            value: data.name,
            userId,
            excludeId: entityId
          })
        }
        break
    }
    
    return { isValid: true, errors: [] }
  }
}