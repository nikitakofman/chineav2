import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, DollarSign, AlertTriangle, Target, TrendingUp, Users, Calendar, ShoppingCart } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { checkUserBooks, getSelectedBookId } from '@/app/actions/books'
import { SalesTrendChart } from '@/components/dashboard/sales-trend-chart'
import { QuickActions } from '@/components/dashboard/quick-actions'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const t = await getTranslations('dashboard')

  if (!user) {
    return null
  }
  
  // Check if user has any books
  const books = await checkUserBooks()
  if (books.length === 0) {
    redirect('/books/setup')
  }
  
  // Get selected book ID from cookie or use first book
  const selectedBookId = await getSelectedBookId()
  
  if (!selectedBookId) {
    redirect('/books/setup')
  }

  // Fetch essential stats from database
  const [totalItems, totalIncidents, totalCosts, recentInvoices, soldItems, totalPeople, todaysItems] = await Promise.all([
    prisma.items.count({ where: { book_id: selectedBookId } }),
    prisma.item_incidents.count({ 
      where: { 
        items: { book_id: selectedBookId },
        incident_date: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30))
        }
      } 
    }),
    prisma.costs.count({ where: { book_id: selectedBookId } }),
    // Count recent invoices instead of item sales
    prisma.invoices.count({ 
      where: { 
        book_id: selectedBookId,
        invoice_date: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30))
        }
      } 
    }),
    prisma.item_sales.count({ where: { items: { book_id: selectedBookId } } }),
    prisma.person.count({ where: { user_id: user.id } }),
    prisma.items.count({
      where: { 
        book_id: selectedBookId,
        created_at: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    })
  ])

  // Get revenue and invoice count with a single aggregate query
  const invoiceStats = await prisma.invoices.aggregate({
    where: { 
      book_id: selectedBookId
    },
    _sum: {
      total_amount: true
    },
    _count: {
      id: true
    }
  })

  const totalRevenue = Number(invoiceStats._sum.total_amount || 0)
  const totalInvoices = invoiceStats._count.id

  // Calculate financial metrics
  const [inventoryValue, totalExpenses] = await Promise.all([
    prisma.item_purchases.aggregate({
      where: { items: { book_id: selectedBookId } },
      _sum: { purchase_price: true }
    }),
    prisma.costs.aggregate({
      where: { book_id: selectedBookId },
      _sum: { amount: true }
    })
  ])


  // Calculate profit/loss
  const revenue = totalRevenue
  const expenses = Number(inventoryValue._sum.purchase_price || 0) + Number(totalExpenses._sum.amount || 0)
  const profitLoss = revenue - expenses

  // Get sales trend data for the last 12 months with a single query
  const currentDate = new Date()
  const twelveMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 11, 1)
  
  // Fetch all invoices for the last 12 months in one query
  const last12MonthsInvoices = await prisma.invoices.findMany({
    where: {
      book_id: selectedBookId,
      invoice_date: {
        gte: twelveMonthsAgo
      }
    },
    select: {
      invoice_date: true,
      total_amount: true
    }
  })
  
  // Process the data into monthly buckets
  const salesByMonth = new Map()
  
  // Initialize all 12 months with zero values
  for (let i = 11; i >= 0; i--) {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() - i
    const targetDate = new Date(year, month, 1)
    const monthKey = targetDate.toLocaleDateString('en-US', { month: 'short' })
    salesByMonth.set(monthKey, { amount: 0, count: 0 })
  }
  
  // Aggregate invoices by month
  last12MonthsInvoices.forEach(invoice => {
    if (invoice.invoice_date) {
      const monthKey = invoice.invoice_date.toLocaleDateString('en-US', { month: 'short' })
      const existing = salesByMonth.get(monthKey) || { amount: 0, count: 0 }
      existing.amount += Number(invoice.total_amount || 0)
      existing.count += 1
      salesByMonth.set(monthKey, existing)
    }
  })
  
  // Convert to array format expected by the chart
  const salesTrend = Array.from(salesByMonth.entries()).map(([month, data]) => ({
    month,
    amount: data.amount,
    count: data.count
  }))
  

  // Fetch data for modals
  const [categories, personTypes] = await Promise.all([
    prisma.category.findMany({
      where: { user_id: user.id },
      orderBy: { name: 'asc' }
    }),
    prisma.person_type.findMany({
      orderBy: { name: 'asc' }
    })
  ])

  return (
    <div className="p-4 md:p-6">
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {/* Main Revenue Card - Large */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('totalRevenue')}</p>
                <div className="text-3xl font-bold">${revenue.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">
                  {t('profit')}: <span className={profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ${profitLoss.toLocaleString()}
                  </span>
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Items */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('totalItems')}</p>
                <div className="text-2xl font-bold">{totalItems.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{soldItems} sold</p>
              </div>
              <Package className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Today's Summary */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('today')}</p>
                <div className="text-2xl font-bold">{todaysItems}</div>
                <p className="text-xs text-muted-foreground">items added</p>
              </div>
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Row */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('totalPeople')}</p>
                <div className="text-2xl font-bold">{totalPeople}</div>
                <p className="text-xs text-muted-foreground">contacts</p>
              </div>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <div className="text-2xl font-bold">{recentInvoices}</div>
                <p className="text-xs text-muted-foreground">invoices</p>
              </div>
              <ShoppingCart className="w-5 h-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Sales Trend Chart */}
        <SalesTrendChart salesData={salesTrend} />

        {/* Quick Actions */}
        <QuickActions 
          categories={categories}
          personTypes={personTypes}
          bookId={selectedBookId}
        />

        {/* Inventory Value */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('inventoryValue')}</p>
                <div className="text-xl font-bold">${(inventoryValue._sum.purchase_price || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{totalCosts} costs</p>
              </div>
              <Target className="w-5 h-5 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        {/* Incidents Alert */}
        <Card className={totalIncidents > 0 ? "border-red-200 dark:border-red-800" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Incidents</p>
                <div className="text-2xl font-bold">{totalIncidents}</div>
                <p className="text-xs text-muted-foreground">recent issues</p>
              </div>
              <AlertTriangle className={`w-5 h-5 ${totalIncidents > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
            </div>
          </CardContent>
        </Card>


        {/* Performance Indicator */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm">
                  <span>Sales Rate</span>
                  <span className="font-medium">{soldItems > 0 ? Math.round((soldItems / totalItems) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full">
                  <div 
                    className="h-full bg-green-500 rounded-full" 
                    style={{ width: `${soldItems > 0 ? Math.min(100, (soldItems / totalItems) * 100) : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Monthly Activity</span>
                  <span className="font-medium">{recentInvoices}</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${recentInvoices > 0 ? Math.min(100, (recentInvoices / totalInvoices || 1) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}