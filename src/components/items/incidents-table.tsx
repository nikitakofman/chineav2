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
  }>
}

export function IncidentsTable({ incidents }: IncidentsTableProps) {
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
                  onClick={() => {
                    // TODO: Open incident details modal
                    console.log('View incident:', incident.id)
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </div>
    </div>
  )
}