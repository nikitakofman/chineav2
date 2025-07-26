/**
 * Centralized Services Export
 * 
 * This file exports all service classes and their commonly used methods
 * for easy import throughout the application.
 */

// Export all services
export { AccessControlService } from './access-control'
export { ValidationService } from './validation'
export { SerializationService } from './serialization'
export { EntityService } from './entity'
export { FileService } from './file'

// Export types
export type {
  EntityType,
  AccessCheckResult,
  OwnershipCheckResult
} from './access-control'

export type {
  ValidationResult,
  UniquenessCheck,
  DeletionDependencyCheck,
  ValidationRule
} from './validation'

export type {
  SerializableValue,
  SerializableObject,
  SerializableArray,
  Serializable,
  SerializationOptions
} from './serialization'

export type {
  EntityServiceOptions,
  CreateEntityResult,
  UpdateEntityResult,
  DeleteEntityResult,
  GetEntityResult,
  ListEntitiesResult
} from './entity'

export type {
  FileUploadOptions,
  FileServiceResult,
  ImageData,
  DocumentData
} from './file'

// Export commonly used static methods for convenience
export {
  getAuthenticatedUser,
  checkAuthentication,
  checkEntityOwnership,
  canAccess,
  assertAccess,
  getCurrentUserId,
  checkBulkOwnership
} from './access-control'