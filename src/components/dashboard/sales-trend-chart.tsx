'use client'

import React from 'react'
import { Chart } from 'react-charts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'
import { useTranslations } from 'next-intl'

type SalesDatum = {
  month: string
  amount: number
  count: number
}

type Series = {
  label: string
  data: SalesDatum[]
}

interface SalesTrendChartProps {
  salesData: SalesDatum[]
}

export function SalesTrendChart({ salesData }: SalesTrendChartProps) {
  const t = useTranslations('dashboard')

  const data: Series[] = React.useMemo(
    () => [
      {
        label: 'Revenue',
        data: salesData
      }
    ],
    [salesData]
  )

  const primaryAxis = React.useMemo(
    () => ({
      getValue: (datum: SalesDatum) => datum.month,
    }),
    []
  )

  const secondaryAxes = React.useMemo(
    () => [
      {
        getValue: (datum: SalesDatum) => datum.amount,
        elementType: 'bar' as const,
      },
    ],
    []
  )

  const totalRevenue = salesData.reduce((sum, m) => sum + m.amount, 0)
  const totalInvoices = salesData.reduce((sum, m) => sum + m.count, 0)

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          {t('salesTrend')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <Chart
            options={{
              data,
              primaryAxis,
              secondaryAxes,
              tooltip: {
                render: ({ datum }) => {
                  const data = datum?.originalDatum as SalesDatum
                  if (!data) return null
                  
                  return (
                    <div className="bg-gray-900 text-white text-xs rounded px-2 py-1">
                      <div>{data.month}</div>
                      <div className="font-bold">€{data.amount.toLocaleString()}</div>
                      <div>{data.count} {data.count === 1 ? 'invoice' : 'invoices'}</div>
                    </div>
                  )
                }
              }
            }}
          />
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            {t('totalInvoices')}: {totalInvoices} • 
            {t('totalRevenue')}: €{totalRevenue.toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}