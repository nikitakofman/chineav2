'use client'

import { useState } from 'react'
import { Eye, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useTranslations } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { useLocale } from 'next-intl'
import { IncidentModal } from './incident-modal'
import { ImageViewer } from '@/components/ui/image-viewer'

interface IncidentsTableProps {
  incidents: Array<{
    id: string
    incident_type: string | null
    description: string | null
    incident_date: Date | null
    reported_by: string | null
    resolution_status: string | null
    created_at: Date | null
    updated_at: Date | null
    items: {
      id: string
      item_number: string | null
      description: string | null
      category: {
        id: string
        name: string
      } | null
    } | null
    images: Array<{
      id: string
      storage_url: string | null
      original_name: string
      file_name: string
      file_size: string | null
      mime_type: string | null
      title: string | null
      alt_text: string | null
      width: number | null
      height: number | null
    }>
    primaryImage?: {
      id: string
      url: string
      alt_text?: string | null
      title?: string | null
    } | null
    imageCount: number
  }>
}

export function IncidentsTable({ incidents }: IncidentsTableProps) {
  const [viewingIncident, setViewingIncident] = useState<(typeof incidents)[0] | null>(null)
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt?: string } | null>(null)
  const t = useTranslations()
  const locale = useLocale()
  const dateLocale = locale === 'fr' ? fr : enUS

  const getStatusBadge = (status: string | null) => {
    if (!status) return null
    
    const normalizedStatus = status.toLowerCase()
    switch (normalizedStatus) {
      case 'open':
        return <Badge variant="destructive">{t('items.statusOpen', 'Open')}</Badge>
      case 'resolved':
        return <Badge variant="default">{t('items.statusResolved', 'Resolved')}</Badge>
      case 'closed':
        return <Badge variant="secondary">{t('items.statusClosed', 'Closed')}</Badge>
      default:
        return <Badge variant="outline">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
    }
  }

  const getIncidentTypeBadge = (type: string | null) => {
    if (!type) return null

    const normalizedType = type.toLowerCase()
    switch (normalizedType) {
      case 'damage':
        return <Badge variant="destructive">{t('items.incidentDamage', 'Damage')}</Badge>
      case 'loss':
        return <Badge variant="destructive">{t('items.incidentLoss', 'Loss')}</Badge>
      case 'theft':
        return <Badge variant="destructive">{t('items.incidentTheft', 'Theft')}</Badge>
      case 'maintenance':
        return <Badge variant="secondary">{t('items.incidentMaintenance', 'Maintenance')}</Badge>
      case 'quality':
        return <Badge variant="outline">{t('items.incidentQuality', 'Quality Issue')}</Badge>
      default:
        return <Badge variant="outline">{type.charAt(0).toUpperCase() + type.slice(1)}</Badge>
    }
  }

  if (incidents.length === 0) {
    return (
      <div className="bg-white dark:bg-card rounded-lg border border-border p-8">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('items.noIncidents', 'No incidents found')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('items.noIncidentsDescription', 'Item incidents and issues will appear here')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-card rounded-lg border border-border">
      <div className="overflow-x-auto">
        <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px] text-muted-foreground">Image</TableHead>
            <TableHead className="text-muted-foreground">{t('items.item', 'Item')}</TableHead>
            <TableHead className="text-muted-foreground">{t('items.incidentType', 'Type')}</TableHead>
            <TableHead className="text-muted-foreground">{t('items.description')}</TableHead>
            <TableHead className="text-muted-foreground">{t('items.incidentDate', 'Date')}</TableHead>
            <TableHead className="text-muted-foreground">{t('items.reportedBy', 'Reported By')}</TableHead>
            <TableHead className="text-muted-foreground">{t('items.status')}</TableHead>
            <TableHead className="w-[70px] text-muted-foreground">{t('items.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incidents.map((incident) => (
            <TableRow key={incident.id}>
              <TableCell>
                {incident.primaryImage ? (
                  <div 
                    className="w-10 h-10 bg-muted rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setSelectedImage({ 
                      url: incident.primaryImage!.url, 
                      alt: incident.primaryImage!.alt_text || 'Incident image' 
                    })}
                  >
                    <img
                      src={incident.primaryImage.url}
                      alt={incident.primaryImage.alt_text || 'Incident image'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-image.png'
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">-</span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {incident.items?.item_number || '-'}
                  </div>
                  <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                    {incident.items?.description || '-'}
                  </div>
                  {incident.items?.category && (
                    <div className="text-xs text-muted-foreground">
                      {incident.items.category.name}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {getIncidentTypeBadge(incident.incident_type)}
              </TableCell>
              <TableCell>
                <div className="max-w-[300px] truncate">
                  {incident.description || '-'}
                </div>
              </TableCell>
              <TableCell>
                {incident.incident_date
                  ? formatDistanceToNow(new Date(incident.incident_date), {
                      addSuffix: true,
                      locale: dateLocale,
                    })
                  : '-'}
              </TableCell>
              <TableCell>{incident.reported_by || '-'}</TableCell>
              <TableCell>
                {getStatusBadge(incident.resolution_status)}
              </TableCell>
              <TableCell>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setViewingIncident(incident)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </div>
      
      {viewingIncident && (
        <IncidentModal
          open={!!viewingIncident}
          onOpenChange={(open) => !open && setViewingIncident(null)}
          mode="view"
          item={viewingIncident.items ? {
            id: viewingIncident.items.id,
            item_number: viewingIncident.items.item_number,
            description: viewingIncident.items.description
          } : undefined}
          incident={{
            id: viewingIncident.id,
            incident_type: viewingIncident.incident_type,
            description: viewingIncident.description,
            incident_date: viewingIncident.incident_date,
            reported_by: viewingIncident.reported_by,
            resolution_status: viewingIncident.resolution_status,
            centralizedImages: viewingIncident.images
          }}
        />
      )}
      
      {/* Image Viewer */}
      <ImageViewer
        imageUrl={selectedImage?.url || ''}
        alt={selectedImage?.alt}
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  )
}