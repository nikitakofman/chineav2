'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { 
  Shield, Download, Send, QrCode, FileText, Clock, 
  TrendingUp, Package, DollarSign, Activity, Calendar,
  AlertCircle, CheckCircle2, User, BarChart3
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { GenericCrudModal } from '@/components/shared/generic-crud-modal'
import type { FieldConfig } from '@/types/form-types'
import { format } from 'date-fns'

interface ControlStats {
  totalItems: number
  soldItems: number
  incidentItems: number
  totalValue: number
  monthlyRevenue: number
  lastExport: Date | null
  registryStatus: 'up-to-date' | 'needs-update' | 'overdue'
}

interface ExportHistory {
  id: string
  date: Date
  type: 'registry' | 'financial' | 'incident'
  recipient?: string
  itemCount: number
}

interface ControlPageClientProps {
  stats: ControlStats
  exportHistory: ExportHistory[]
  bookId: string
}

export function ControlPageClient({ stats, exportHistory, bookId }: ControlPageClientProps) {
  const t = useTranslations('control')
  const [showAuthorityModal, setShowAuthorityModal] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const response = await fetch(`/api/export/csv?bookId=${bookId}`)
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `police-registry-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up-to-date': return 'text-green-600 dark:text-green-400'
      case 'needs-update': return 'text-yellow-600 dark:text-yellow-400'
      case 'overdue': return 'text-red-600 dark:text-red-400'
      default: return 'text-muted-foreground'
    }
  }

  const authorityModalConfig = {
    title: t('sendToAuthorities'),
    description: t('sendToAuthoritiesDescription'),
    icon: Send,
    fields: [
      {
        name: 'authorityEmail',
        label: t('authorityEmail'),
        type: 'email' as const,
        required: true,
        placeholder: 'police@example.com'
      },
      {
        name: 'authorityName',
        label: t('authorityName'),
        type: 'text' as const,
        required: true,
        placeholder: t('authorityNamePlaceholder')
      },
      {
        name: 'subject',
        label: t('emailSubject'),
        type: 'text' as const,
        required: true,
        defaultValue: t('defaultSubject')
      },
      {
        name: 'message',
        label: t('message'),
        type: 'textarea' as const,
        required: false,
        placeholder: t('messagePlaceholder')
      }
    ] as FieldConfig[],
    submitLabel: t('sendReport'),
    loadingLabel: t('sending'),
    mode: 'create' as const
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">{t('subtitle')}</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalItems')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.soldItems} {t('itemsSold')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalValue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              €{stats.monthlyRevenue} {t('thisMonth')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('incidents')}</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.incidentItems}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.incidentItems / Math.max(stats.totalItems, 1)) * 100).toFixed(1)}% {t('incidentRate')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('registryStatus')}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(stats.registryStatus)}`}>
              {t(`status.${stats.registryStatus}`)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.lastExport ? format(stats.lastExport, 'MMM d, yyyy') : t('neverExported')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Police Registry Management Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t('policeRegistry')}
              </CardTitle>
              <CardDescription>
                {t('generateReports')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('description')}
              </p>
              
              <Separator />
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('instructions')}
              </p>
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="font-medium">{t('keyFeatures')}</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• {t('feature1')}</li>
                  <li>• {t('feature2')}</li>
                  <li>• {t('feature3')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Available Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('availableActions')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 p-4"
                  onClick={handleExportCSV}
                  disabled={isExporting}
                >
                  <Download className="w-6 h-6" />
                  <span className="text-sm font-medium text-center">
                    {t('downloadRegistry')}
                  </span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 p-4"
                  onClick={() => setShowAuthorityModal(true)}
                >
                  <Send className="w-6 h-6" />
                  <span className="text-sm font-medium text-center">
                    {t('sendToAuthorities')}
                  </span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 p-4"
                  onClick={() => {
                    console.log('Open QR scanner')
                  }}
                >
                  <QrCode className="w-6 h-6" />
                  <span className="text-sm font-medium text-center">
                    {t('qrScanner')}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Export History Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {t('exportHistory')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {exportHistory.length > 0 ? (
                <div className="space-y-4">
                  {exportHistory.slice(0, 3).map((export_) => (
                    <div key={export_.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium capitalize">{export_.type} Export</p>
                          <p className="text-xs text-muted-foreground">
                            {format(export_.date, 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{export_.itemCount} items</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('noExportsFound')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compliance Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t('compliance')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm">{t('gdprCompliant')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm">{t('dataEncrypted')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm">{t('regularBackups')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Right Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        <Button
          size="lg"
          className="rounded-full shadow-lg"
          onClick={handleExportCSV}
          disabled={isExporting}
          title={t('exportCSV')}
        >
          <Download className="w-5 h-5" />
        </Button>
        
        <Button
          size="lg"
          className="rounded-full shadow-lg"
          onClick={() => setShowAuthorityModal(true)}
          title={t('sendToAuthorities')}
        >
          <Send className="w-5 h-5" />
        </Button>
        
        <Button
          size="lg"
          variant="outline"
          className="rounded-full shadow-lg"
          onClick={() => console.log('QR Scanner')}
          title={t('qrScanner')}
        >
          <QrCode className="w-5 h-5" />
        </Button>
      </div>

      {/* Authority Modal */}
      <GenericCrudModal
        open={showAuthorityModal}
        onOpenChange={setShowAuthorityModal}
        config={authorityModalConfig}
        onSubmit={async (data) => {
          console.log('Send to authority:', data)
          return { success: true }
        }}
        onSuccess={() => {
          // Success handling
        }}
      />
    </div>
  )
}