'use client'

import { useTranslations } from 'next-intl'
import { Shield, Download, Send, QrCode, FileText, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function ControlPage() {
  const t = useTranslations('control')

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-lg text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
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
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('qrInstructions')}
              </p>
            </CardContent>
          </Card>

          {/* Available Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('availableActions')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
                {/* Download Registry Button */}
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 p-4"
                  onClick={() => {
                    // TODO: Implement download functionality
                    console.log('Download registry')
                  }}
                >
                  <Download className="w-6 h-6" />
                  <span className="text-sm font-medium text-center">
                    {t('downloadRegistry')}
                  </span>
                </Button>

                {/* Send to Authorities Button */}
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 p-4"
                  onClick={() => {
                    // TODO: Implement send functionality
                    console.log('Send to authorities')
                  }}
                >
                  <Send className="w-6 h-6" />
                  <span className="text-sm font-medium text-center">
                    {t('sendToAuthorities')}
                  </span>
                </Button>

                {/* QR Scanner Button */}
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 p-4"
                  onClick={() => {
                    // TODO: Implement QR scanner functionality
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
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('noExportsFound')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Card (Future Enhancement) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Items</span>
                <span className="font-medium">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last Export</span>
                <span className="font-medium">Never</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Registry Status</span>
                <span className="font-medium text-green-600">Up to date</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}