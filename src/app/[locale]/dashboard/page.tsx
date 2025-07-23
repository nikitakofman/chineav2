import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { StatsCard } from '@/components/dashboard/stats-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, DollarSign, AlertTriangle, Target, Plus, FileText, UserPlus, TrendingUp, Users, Calendar, ShoppingCart, BarChart3 } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { checkUserBooks } from '@/app/actions/books'
import Link from 'next/link'

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
  const selectedBookId = books[0].id // Will be improved with cookie storage

  // Fetch essential stats from database
  const [totalItems, totalIncidents, totalCosts, recentSales, soldItems, totalPeople, todaysItems] = await Promise.all([
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
    prisma.item_sales.count({ 
      where: { 
        items: { book_id: selectedBookId },
        sale_date: {
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

  // Calculate financial metrics
  const [inventoryValue, totalRevenue, totalExpenses] = await Promise.all([
    prisma.item_purchases.aggregate({
      where: { items: { book_id: selectedBookId } },
      _sum: { purchase_price: true }
    }),
    prisma.item_sales.aggregate({
      where: { items: { book_id: selectedBookId } },
      _sum: { sale_price: true }
    }),
    prisma.costs.aggregate({
      where: { book_id: selectedBookId },
      _sum: { amount: true }
    })
  ])

  // Calculate profit/loss
  const revenue = totalRevenue._sum.sale_price || 0
  const expenses = (inventoryValue._sum.purchase_price || 0) + (totalExpenses._sum.amount || 0)
  const profitLoss = revenue - expenses

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
                <div className="text-2xl font-bold">{recentSales}</div>
                <p className="text-xs text-muted-foreground">sales</p>
              </div>
              <ShoppingCart className="w-5 h-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Chart Placeholder - Wide */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Sales Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-end justify-between gap-2">
              {[65, 45, 78, 52, 89, 67, 43, 76, 58, 82, 94, 71].map((height, i) => (
                <div
                  key={i}
                  className="bg-primary/20 rounded-t flex-1 min-w-0 transition-all hover:bg-primary/30"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">Last 12 months overview</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t('quickActions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/dashboard/items">
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors">
                  <Plus className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{t('addNewItem')}</p>
                  </div>
                </div>
              </Link>
              
              <Link href="/dashboard/people">
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">{t('addNewPerson')}</p>
                  </div>
                </div>
              </Link>
              
              <Link href="/dashboard/incidents">
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors">
                  <FileText className="w-4 h-4 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium">{t('viewIncidents')}</p>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

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
                  <span className="font-medium">{recentSales}</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${recentSales > 0 ? Math.min(100, (recentSales / soldItems || 1) * 100) : 0}%` }}
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