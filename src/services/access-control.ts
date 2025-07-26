import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { User } from '@supabase/supabase-js'

export type EntityType = 'item' | 'incident' | 'person' | 'category' | 'cost' | 'book' | 'sale' | 'purchase'

export interface AccessCheckResult {
  hasAccess: boolean
  user?: User
  error?: string
}

export interface OwnershipCheckResult {
  isOwner: boolean
  entityOwnerId?: string
  error?: string
}

/**
 * AccessControlService - Centralized service for authentication and authorization
 * 
 * This service provides:
 * - User authentication verification
 * - Entity ownership validation
 * - Standardized access control patterns
 * - Type-safe methods for all entity types
 */
export class AccessControlService {
  /**
   * Get the current authenticated user
   * @returns User object if authenticated, null otherwise
   */
  static async getAuthenticatedUser(): Promise<User | null> {
    try {
      const supabase = await createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        console.error('Authentication error:', error)
        return null
      }
      
      return user
    } catch (error) {
      console.error('Failed to get authenticated user:', error)
      return null
    }
  }

  /**
   * Check if the current request is authenticated
   * @returns AccessCheckResult with user data and access status
   */
  static async checkAuthentication(): Promise<AccessCheckResult> {
    const user = await this.getAuthenticatedUser()
    
    if (!user) {
      return {
        hasAccess: false,
        error: 'Not authenticated'
      }
    }
    
    return {
      hasAccess: true,
      user
    }
  }

  /**
   * Check if the authenticated user owns a specific entity
   * @param entityType The type of entity
   * @param entityId The ID of the entity
   * @returns OwnershipCheckResult with ownership status
   */
  static async checkEntityOwnership(
    entityType: EntityType,
    entityId: string
  ): Promise<OwnershipCheckResult> {
    const authCheck = await this.checkAuthentication()
    
    if (!authCheck.hasAccess || !authCheck.user) {
      return {
        isOwner: false,
        error: authCheck.error || 'Not authenticated'
      }
    }
    
    const userId = authCheck.user.id
    
    try {
      switch (entityType) {
        case 'item':
          return await this.checkItemOwnership(entityId, userId)
        
        case 'incident':
          return await this.checkIncidentOwnership(entityId, userId)
        
        case 'person':
          return await this.checkPersonOwnership(entityId, userId)
        
        case 'category':
          return await this.checkCategoryOwnership(entityId, userId)
        
        case 'cost':
          return await this.checkCostOwnership(entityId, userId)
        
        case 'book':
          return await this.checkBookOwnership(entityId, userId)
        
        case 'sale':
          return await this.checkSaleOwnership(entityId, userId)
        
        case 'purchase':
          return await this.checkPurchaseOwnership(entityId, userId)
        
        default:
          return {
            isOwner: false,
            error: `Unknown entity type: ${entityType}`
          }
      }
    } catch (error) {
      console.error(`Failed to check ${entityType} ownership:`, error)
      return {
        isOwner: false,
        error: 'Failed to verify ownership'
      }
    }
  }

  /**
   * Check if user owns an item (through book ownership)
   */
  private static async checkItemOwnership(
    itemId: string,
    userId: string
  ): Promise<OwnershipCheckResult> {
    const item = await prisma.items.findFirst({
      where: {
        id: itemId,
        book: {
          user_id: userId
        }
      },
      select: {
        book: {
          select: {
            user_id: true
          }
        }
      }
    })
    
    return {
      isOwner: !!item,
      entityOwnerId: item?.book?.user_id || undefined
    }
  }

  /**
   * Check if user owns an incident (through item's book ownership)
   */
  private static async checkIncidentOwnership(
    incidentId: string,
    userId: string
  ): Promise<OwnershipCheckResult> {
    const incident = await prisma.item_incidents.findFirst({
      where: {
        id: incidentId,
        items: {
          book: {
            user_id: userId
          }
        }
      },
      select: {
        items: {
          select: {
            book: {
              select: {
                user_id: true
              }
            }
          }
        }
      }
    })
    
    return {
      isOwner: !!incident,
      entityOwnerId: incident?.items?.book?.user_id || undefined
    }
  }

  /**
   * Check if user owns a person
   */
  private static async checkPersonOwnership(
    personId: string,
    userId: string
  ): Promise<OwnershipCheckResult> {
    const person = await prisma.person.findFirst({
      where: {
        id: personId,
        user_id: userId
      },
      select: {
        user_id: true
      }
    })
    
    return {
      isOwner: !!person,
      entityOwnerId: person?.user_id || undefined
    }
  }

  /**
   * Check if user owns a category
   */
  private static async checkCategoryOwnership(
    categoryId: string,
    userId: string
  ): Promise<OwnershipCheckResult> {
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        user_id: userId
      },
      select: {
        user_id: true
      }
    })
    
    return {
      isOwner: !!category,
      entityOwnerId: category?.user_id || undefined
    }
  }

  /**
   * Check if user owns a cost record
   */
  private static async checkCostOwnership(
    costId: string,
    userId: string
  ): Promise<OwnershipCheckResult> {
    const cost = await prisma.costs.findFirst({
      where: {
        id: costId,
        user_id: userId
      },
      select: {
        user_id: true
      }
    })
    
    return {
      isOwner: !!cost,
      entityOwnerId: cost?.user_id || undefined
    }
  }

  /**
   * Check if user owns a book
   */
  private static async checkBookOwnership(
    bookId: string,
    userId: string
  ): Promise<OwnershipCheckResult> {
    const book = await prisma.book.findFirst({
      where: {
        id: bookId,
        user_id: userId
      },
      select: {
        user_id: true
      }
    })
    
    return {
      isOwner: !!book,
      entityOwnerId: book?.user_id || undefined
    }
  }

  /**
   * Check if user owns a sale (through item's book ownership)
   */
  private static async checkSaleOwnership(
    saleId: string,
    userId: string
  ): Promise<OwnershipCheckResult> {
    const sale = await prisma.item_sales.findFirst({
      where: {
        id: saleId,
        items: {
          book: {
            user_id: userId
          }
        }
      },
      select: {
        items: {
          select: {
            book: {
              select: {
                user_id: true
              }
            }
          }
        }
      }
    })
    
    return {
      isOwner: !!sale,
      entityOwnerId: sale?.items?.book?.user_id || undefined
    }
  }

  /**
   * Check if user owns a purchase (through item's book ownership)
   */
  private static async checkPurchaseOwnership(
    purchaseId: string,
    userId: string
  ): Promise<OwnershipCheckResult> {
    const purchase = await prisma.item_purchases.findFirst({
      where: {
        id: purchaseId,
        items: {
          book: {
            user_id: userId
          }
        }
      },
      select: {
        items: {
          select: {
            book: {
              select: {
                user_id: true
              }
            }
          }
        }
      }
    })
    
    return {
      isOwner: !!purchase,
      entityOwnerId: purchase?.items?.book?.user_id || undefined
    }
  }

  /**
   * Check if user can access an entity (shorthand for ownership check)
   * @param entityType The type of entity
   * @param entityId The ID of the entity
   * @returns boolean indicating if user has access
   */
  static async canAccess(
    entityType: EntityType,
    entityId: string
  ): Promise<boolean> {
    const result = await this.checkEntityOwnership(entityType, entityId)
    return result.isOwner
  }

  /**
   * Assert that user has access to an entity, throw error if not
   * @param entityType The type of entity
   * @param entityId The ID of the entity
   * @throws Error if user doesn't have access
   */
  static async assertAccess(
    entityType: EntityType,
    entityId: string
  ): Promise<void> {
    const result = await this.checkEntityOwnership(entityType, entityId)
    
    if (!result.isOwner) {
      throw new Error(result.error || `Access denied to ${entityType}`)
    }
  }

  /**
   * Get current user ID if authenticated
   * @returns User ID or null
   */
  static async getCurrentUserId(): Promise<string | null> {
    const user = await this.getAuthenticatedUser()
    return user?.id || null
  }

  /**
   * Check multiple entities at once
   * @param checks Array of entity type and ID pairs
   * @returns Map of entityId to ownership status
   */
  static async checkBulkOwnership(
    checks: Array<{ entityType: EntityType; entityId: string }>
  ): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>()
    
    // Check authentication once
    const authCheck = await this.checkAuthentication()
    if (!authCheck.hasAccess) {
      checks.forEach(({ entityId }) => results.set(entityId, false))
      return results
    }
    
    // Check each entity
    await Promise.all(
      checks.map(async ({ entityType, entityId }) => {
        const ownershipResult = await this.checkEntityOwnership(entityType, entityId)
        results.set(entityId, ownershipResult.isOwner)
      })
    )
    
    return results
  }
}

// Export static methods for convenience
export const {
  getAuthenticatedUser,
  checkAuthentication,
  checkEntityOwnership,
  canAccess,
  assertAccess,
  getCurrentUserId,
  checkBulkOwnership
} = AccessControlService