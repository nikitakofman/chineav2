'use client'

import { useState } from 'react'
import { Eye, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { useTranslations } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { useLocale } from 'next-intl'
import { IncidentModal } from './incident-modal'
import { ImageViewer } from '@/components/ui/image-viewer'

interface IncidentsGridProps {
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

export function IncidentsGrid({ incidents }: IncidentsGridProps) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {incidents.map((incident) => (
        <Card key={incident.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              {getIncidentTypeBadge(incident.incident_type)}
              {getStatusBadge(incident.resolution_status)}
            </div>
          </CardHeader>
          
          <CardContent className="pb-4">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg truncate">
                  {incident.items?.item_number || 'No item number'}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {incident.items?.description || 'No description'}
                </p>
                {incident.items?.category && (
                  <p className="text-xs text-muted-foreground">
                    {incident.items.category.name}
                  </p>
                )}
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3.75rem]">
                  {incident.description || 'No incident description'}
                </p>
              </div>
              
              {/* Image Preview */}
              {incident.primaryImage && (
                <div className="mt-3">
                  <div 
                    className="w-full h-24 bg-muted rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
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
                  {incident.imageCount && incident.imageCount > 1 && (
                    <div className="text-xs text-muted-foreground text-center mt-1">
                      +{incident.imageCount - 1} more image{incident.imageCount > 2 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <br />
                  <span className="font-medium">
                    {incident.incident_date
                      ? formatDistanceToNow(new Date(incident.incident_date), {
                          addSuffix: true,
                          locale: dateLocale,
                        })
                      : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Reported by:</span>
                  <br />
                  <span className="font-medium truncate">{incident.reported_by || '-'}</span>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="pt-0">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => setViewingIncident(incident)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>
          </CardFooter>
        </Card>
      ))}
      
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