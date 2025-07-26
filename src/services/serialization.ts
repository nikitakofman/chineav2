import { Decimal } from '@prisma/client/runtime/library'

export type SerializableValue = string | number | boolean | null | Date | BigInt | Decimal
export type SerializableObject = { [key: string]: SerializableValue | SerializableObject | SerializableArray }
export type SerializableArray = SerializableValue[] | SerializableObject[]
export type Serializable = SerializableValue | SerializableObject | SerializableArray

export interface SerializationOptions {
  dateFormat?: 'iso' | 'timestamp' | 'string'
  includeNulls?: boolean
  convertBigIntToString?: boolean
  convertDecimalToNumber?: boolean
}

/**
 * SerializationService - Handle data serialization for API responses
 * 
 * This service provides:
 * - Decimal/BigInt serialization
 * - Date formatting
 * - Nested object handling
 * - Type-safe serialization
 */
export class SerializationService {
  private static defaultOptions: SerializationOptions = {
    dateFormat: 'iso',
    includeNulls: true,
    convertBigIntToString: true,
    convertDecimalToNumber: true
  }

  /**
   * Serialize a single value
   */
  static serializeValue(
    value: any,
    options: SerializationOptions = {}
  ): any {
    const opts = { ...this.defaultOptions, ...options }
    
    // Handle null/undefined
    if (value === null || value === undefined) {
      return opts.includeNulls ? null : undefined
    }
    
    // Handle BigInt
    if (typeof value === 'bigint') {
      return opts.convertBigIntToString ? value.toString() : Number(value)
    }
    
    // Handle Decimal (Prisma type)
    if (value instanceof Decimal) {
      return opts.convertDecimalToNumber ? value.toNumber() : value.toString()
    }
    
    // Handle Date
    if (value instanceof Date) {
      switch (opts.dateFormat) {
        case 'timestamp':
          return value.getTime()
        case 'string':
          return value.toLocaleString()
        case 'iso':
        default:
          return value.toISOString()
      }
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(item => this.serialize(item, opts))
    }
    
    // Handle objects
    if (typeof value === 'object' && value !== null) {
      return this.serializeObject(value, opts)
    }
    
    // Return primitive values as-is
    return value
  }

  /**
   * Serialize an object
   */
  static serializeObject(
    obj: any,
    options: SerializationOptions = {}
  ): any {
    const result: any = {}
    
    for (const [key, value] of Object.entries(obj)) {
      const serializedValue = this.serializeValue(value, options)
      
      if (serializedValue !== undefined) {
        result[key] = serializedValue
      }
    }
    
    return result
  }

  /**
   * Main serialization method
   */
  static serialize<T = any>(
    data: any,
    options: SerializationOptions = {}
  ): T {
    return this.serializeValue(data, options) as T
  }

  /**
   * Serialize for JSON response (convenience method)
   */
  static toJSON(data: any): any {
    return this.serialize(data, {
      dateFormat: 'iso',
      includeNulls: true,
      convertBigIntToString: true,
      convertDecimalToNumber: true
    })
  }

  /**
   * Serialize Prisma query result
   */
  static serializePrismaResult<T = any>(
    result: any,
    options: SerializationOptions = {}
  ): T {
    // Handle single result
    if (!Array.isArray(result)) {
      return this.serialize(result, options) as T
    }
    
    // Handle array of results
    return result.map(item => this.serialize(item, options)) as T
  }

  /**
   * Serialize with field selection
   */
  static serializeWithFields<T = any>(
    data: any,
    fields: string[],
    options: SerializationOptions = {}
  ): T {
    if (!data) return data
    
    // For arrays, apply field selection to each item
    if (Array.isArray(data)) {
      return data.map(item => this.serializeWithFields(item, fields, options)) as T
    }
    
    // For objects, only include specified fields
    const filtered: any = {}
    for (const field of fields) {
      if (field.includes('.')) {
        // Handle nested fields (e.g., 'user.name')
        const [parent, ...rest] = field.split('.')
        if (data[parent]) {
          if (!filtered[parent]) filtered[parent] = {}
          const nestedField = rest.join('.')
          const nestedValue = this.serializeWithFields(
            data[parent],
            [nestedField],
            options
          )
          Object.assign(filtered[parent], nestedValue)
        }
      } else if (field in data) {
        filtered[field] = data[field]
      }
    }
    
    return this.serialize(filtered, options) as T
  }

  /**
   * Serialize with field exclusion
   */
  static serializeExcluding<T = any>(
    data: any,
    excludeFields: string[],
    options: SerializationOptions = {}
  ): T {
    if (!data) return data
    
    // For arrays, apply exclusion to each item
    if (Array.isArray(data)) {
      return data.map(item => this.serializeExcluding(item, excludeFields, options)) as T
    }
    
    // For objects, exclude specified fields
    const filtered: any = {}
    for (const [key, value] of Object.entries(data)) {
      if (!excludeFields.includes(key)) {
        filtered[key] = value
      }
    }
    
    return this.serialize(filtered, options) as T
  }

  /**
   * Serialize with transformation
   */
  static serializeWithTransform<T = any>(
    data: any,
    transform: (key: string, value: any) => any,
    options: SerializationOptions = {}
  ): T {
    if (!data) return data
    
    // For arrays, apply transformation to each item
    if (Array.isArray(data)) {
      return data.map(item => this.serializeWithTransform(item, transform, options)) as T
    }
    
    // For objects, apply transformation
    const transformed: any = {}
    for (const [key, value] of Object.entries(data)) {
      const transformedValue = transform(key, value)
      if (transformedValue !== undefined) {
        transformed[key] = transformedValue
      }
    }
    
    return this.serialize(transformed, options) as T
  }

  /**
   * Common transformations
   */
  static readonly transformations = {
    // Convert file size from BigInt to formatted string
    fileSize: (value: any): string => {
      if (typeof value === 'bigint' || typeof value === 'number') {
        const bytes = Number(value)
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
      }
      return value
    },
    
    // Convert price to currency format
    currency: (value: any, currency = 'USD'): string => {
      if (value instanceof Decimal) {
        value = value.toNumber()
      }
      if (typeof value === 'number') {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency
        }).format(value)
      }
      return value
    },
    
    // Convert boolean to yes/no
    yesNo: (value: any): string => {
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No'
      }
      return value
    }
  }

  /**
   * Serialize pagination result
   */
  static serializePaginatedResult<T = any>(
    result: {
      data: any[]
      total: number
      page: number
      pageSize: number
    },
    options: SerializationOptions = {}
  ): {
    data: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
    hasMore: boolean
  } {
    const serializedData = this.serializePrismaResult<T[]>(result.data, options)
    const totalPages = Math.ceil(result.total / result.pageSize)
    
    return {
      data: serializedData,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages,
      hasMore: result.page < totalPages
    }
  }

  /**
   * Batch serialization for performance
   */
  static async serializeBatch<T = any>(
    items: any[],
    serializeFn: (item: any) => any = (item) => this.serialize(item),
    batchSize = 100
  ): Promise<T[]> {
    const results: T[] = []
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      const serializedBatch = await Promise.all(
        batch.map(item => Promise.resolve(serializeFn(item)))
      )
      results.push(...serializedBatch)
    }
    
    return results
  }

  /**
   * Create a serialization preset
   */
  static createPreset(options: SerializationOptions) {
    return {
      serialize: <T = any>(data: any) => this.serialize<T>(data, options),
      serializeWithFields: <T = any>(data: any, fields: string[]) => 
        this.serializeWithFields<T>(data, fields, options),
      serializeExcluding: <T = any>(data: any, excludeFields: string[]) =>
        this.serializeExcluding<T>(data, excludeFields, options)
    }
  }

  /**
   * Common presets
   */
  static readonly presets = {
    api: this.createPreset({
      dateFormat: 'iso',
      includeNulls: true,
      convertBigIntToString: true,
      convertDecimalToNumber: true
    }),
    
    database: this.createPreset({
      dateFormat: 'iso',
      includeNulls: true,
      convertBigIntToString: false,
      convertDecimalToNumber: false
    }),
    
    export: this.createPreset({
      dateFormat: 'string',
      includeNulls: false,
      convertBigIntToString: true,
      convertDecimalToNumber: true
    })
  }
}