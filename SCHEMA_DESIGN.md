# Centralized Document and Image Management Schema

## Overview

This document describes the new centralized database schema for documents and images with polymorphic relationships, designed to support flexible file management across all entities in the system.

## Schema Design

### Core Tables

#### 1. `document_types`
Defines the types of documents that can be stored in the system.

```sql
- id: UUID (Primary Key)
- name: VARCHAR(100) UNIQUE (e.g., "item", "incident", "user", "person", "book")
- description: TEXT (Optional description)
- created_at, updated_at: TIMESTAMP
```

#### 2. `documents`
Centralized document storage with polymorphic relationships.

```sql
- id: UUID (Primary Key)
- document_type_id: UUID (Foreign Key to document_types)
- entity_type: VARCHAR(50) (Entity type: "item", "incident", "user", etc.)
- entity_id: UUID (Polymorphic foreign key to any entity)
- title: VARCHAR(255) (Document title/name)
- original_name: VARCHAR(255) (Original filename)
- file_name: VARCHAR(255) (Stored filename)
- file_path: VARCHAR(500) (Storage path)
- file_size: BIGINT (File size in bytes)
- mime_type: VARCHAR(100) (MIME type)
- storage_provider: VARCHAR(50) ("s3", "local", "supabase")
- storage_url: VARCHAR(500) (Public URL if available)
- description: TEXT
- issued_by: VARCHAR(255) (Document issuer)
- issued_date: DATE
- document_number: VARCHAR(100) (Document reference number)
- expiry_date: DATE
- is_deleted: BOOLEAN (Soft delete flag)
- deleted_at: TIMESTAMP
- created_at, updated_at: TIMESTAMP
```

#### 3. `image_types`
Defines the types of images that can be stored in the system.

```sql
- id: UUID (Primary Key)
- name: VARCHAR(100) UNIQUE (e.g., "item", "incident", "profile", "document_preview")
- description: TEXT (Optional description)
- created_at, updated_at: TIMESTAMP
```

#### 4. `images`
Centralized image storage with polymorphic relationships.

```sql
- id: UUID (Primary Key)
- image_type_id: UUID (Foreign Key to image_types)
- entity_type: VARCHAR(50) (Entity type: "item", "incident", "user", etc.)
- entity_id: UUID (Polymorphic foreign key to any entity)
- title: VARCHAR(255) (Optional image title)
- original_name: VARCHAR(255) (Original filename)
- file_name: VARCHAR(255) (Stored filename)
- file_path: VARCHAR(500) (Storage path)
- file_size: BIGINT (File size in bytes)
- mime_type: VARCHAR(100) (MIME type)
- storage_provider: VARCHAR(50) ("s3", "local", "supabase")
- storage_url: VARCHAR(500) (Public URL if available)
- width: INT (Image width in pixels)
- height: INT (Image height in pixels)
- alt_text: VARCHAR(500) (Accessibility alt text)
- is_primary: BOOLEAN (Primary image for entity)
- position: INT (Display order)
- is_deleted: BOOLEAN (Soft delete flag)
- deleted_at: TIMESTAMP
- created_at, updated_at: TIMESTAMP
```

## Key Features

### 1. Polymorphic Relationships
- Both `documents` and `images` tables use `entity_type` + `entity_id` for polymorphic relationships
- Can link to any entity (items, incidents, users, persons, books, etc.)
- Flexible and extensible design

### 2. File Metadata Support
- Complete file information: original name, stored name, path, size, MIME type
- Storage provider abstraction (S3, local, Supabase, etc.)
- Public URL support for direct access

### 3. Soft Deletes
- `is_deleted` and `deleted_at` fields for both tables
- Allows recovery and audit trails
- Preserves data integrity

### 4. Optimized Indexing
- Composite indexes on `(entity_type, entity_id)` for fast polymorphic queries
- Indexes on `document_type_id`, `image_type_id`
- Indexes on `is_deleted`, `is_primary`, `position`
- Indexes on `expiry_date` for document expiration queries

### 5. Domain-Specific Fields
- **Documents**: Support for issued_by, issued_date, expiry_date, document_number
- **Images**: Support for dimensions (width/height), alt_text, positioning

## Usage Examples

### TypeScript/Prisma Usage

#### 1. Insert a Document for an Item
```typescript
const document = await prisma.documents.create({
  data: {
    document_type_id: documentTypeId,
    entity_type: "item",
    entity_id: itemId,
    title: "Item Certificate",
    original_name: "certificate.pdf",
    file_name: "cert_123456.pdf",
    file_path: "/uploads/documents/cert_123456.pdf",
    file_size: 2048000,
    mime_type: "application/pdf",
    storage_provider: "s3",
    storage_url: "https://bucket.s3.amazonaws.com/cert_123456.pdf",
    description: "Authentication certificate for item"
  }
});
```

#### 2. Insert Multiple Images for an Incident
```typescript
const images = await prisma.images.createMany({
  data: [
    {
      image_type_id: imageTypeId,
      entity_type: "incident",
      entity_id: incidentId,
      original_name: "damage1.jpg",
      file_name: "dmg_001.jpg",
      file_path: "/uploads/images/dmg_001.jpg",
      file_size: 1024000,
      mime_type: "image/jpeg",
      width: 1920,
      height: 1080,
      is_primary: true,
      position: 1
    },
    {
      image_type_id: imageTypeId,
      entity_type: "incident",
      entity_id: incidentId,
      original_name: "damage2.jpg",
      file_name: "dmg_002.jpg",
      file_path: "/uploads/images/dmg_002.jpg",
      file_size: 856000,
      mime_type: "image/jpeg",
      width: 1920,
      height: 1080,
      is_primary: false,
      position: 2
    }
  ]
});
```

#### 3. Query All Documents for an Entity
```typescript
const itemDocuments = await prisma.documents.findMany({
  where: {
    entity_type: "item",
    entity_id: itemId,
    is_deleted: false
  },
  include: {
    document_type: true
  },
  orderBy: {
    created_at: 'desc'
  }
});
```

#### 4. Query Primary Image for Multiple Entities
```typescript
const primaryImages = await prisma.images.findMany({
  where: {
    entity_type: "item",
    entity_id: { in: itemIds },
    is_primary: true,
    is_deleted: false
  },
  include: {
    image_type: true
  }
});
```

#### 5. Soft Delete a Document
```typescript
const deletedDocument = await prisma.documents.update({
  where: { id: documentId },
  data: {
    is_deleted: true,
    deleted_at: new Date()
  }
});
```

### SQL Query Examples

#### 1. Get All Images for Items with Their Types
```sql
SELECT 
  i.id,
  i.entity_id as item_id,
  i.title,
  i.file_name,
  i.storage_url,
  i.is_primary,
  it.name as image_type
FROM images i
JOIN image_types it ON i.image_type_id = it.id
WHERE i.entity_type = 'item' 
  AND i.is_deleted = false
ORDER BY i.entity_id, i.position;
```

#### 2. Find Expiring Documents
```sql
SELECT 
  d.id,
  d.entity_type,
  d.entity_id,
  d.title,
  d.expiry_date,
  dt.name as document_type
FROM documents d
JOIN document_types dt ON d.document_type_id = dt.id
WHERE d.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
  AND d.expiry_date > CURRENT_DATE
  AND d.is_deleted = false
ORDER BY d.expiry_date;
```

## Migration Strategy

### Legacy Tables
The following tables are marked as legacy and should be migrated:
- `item_images` → `images` (with entity_type = "item")
- `item_documents` → `documents` (with entity_type = "item")  
- `incident_images` → `images` (with entity_type = "incident")

### Migration Steps
1. Create new tables and types
2. Migrate existing data from legacy tables
3. Update application code to use new tables
4. Remove legacy tables after validation

## Benefits

1. **Consistency**: Unified structure for all file types across entities
2. **Flexibility**: Easy to add new entity types without schema changes
3. **Scalability**: Optimized indexes for large datasets
4. **Maintainability**: Single source of truth for file management
5. **Feature Rich**: Built-in support for soft deletes, expiration, positioning
6. **Storage Agnostic**: Supports multiple storage providers

## Integration Points

The new schema integrates with existing tables:
- `items` - Can have documents and images via polymorphic relationship
- `item_incidents` - Can have documents and images via polymorphic relationship  
- `users` - Can have profile images and documents
- `person` - Can have documents and images
- `book` - Can have documents and images

All existing relationships are preserved while providing a more flexible and maintainable structure for file management.