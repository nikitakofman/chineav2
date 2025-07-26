'use client'

import { useTranslations } from 'next-intl'
import {
  Book,
  Package,
  Users,
  DollarSign,
  FolderOpen,
  AlertTriangle,
  FileText,
  Settings,
  HelpCircle,
  ChevronRight,
  Home,
  ShoppingCart,
  UserCheck,
  CreditCard,
  Shield,
  BarChart3,
  Globe,
  Moon,
  Download,
  Search
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface DocumentationContentProps {
  locale: string
}

export function DocumentationContent({ locale }: DocumentationContentProps) {
  const t = useTranslations('documentation')

  const features = [
    {
      icon: Book,
      title: t('features.books.title'),
      description: t('features.books.description'),
      items: [
        t('features.books.item1'),
        t('features.books.item2'),
        t('features.books.item3'),
        t('features.books.item4')
      ]
    },
    {
      icon: Package,
      title: t('features.items.title'),
      description: t('features.items.description'),
      items: [
        t('features.items.item1'),
        t('features.items.item2'),
        t('features.items.item3'),
        t('features.items.item4'),
        t('features.items.item5')
      ]
    },
    {
      icon: FolderOpen,
      title: t('features.categories.title'),
      description: t('features.categories.description'),
      items: [
        t('features.categories.item1'),
        t('features.categories.item2'),
        t('features.categories.item3')
      ]
    },
    {
      icon: Users,
      title: t('features.people.title'),
      description: t('features.people.description'),
      items: [
        t('features.people.item1'),
        t('features.people.item2'),
        t('features.people.item3'),
        t('features.people.item4')
      ]
    },
    {
      icon: DollarSign,
      title: t('features.costs.title'),
      description: t('features.costs.description'),
      items: [
        t('features.costs.item1'),
        t('features.costs.item2'),
        t('features.costs.item3'),
        t('features.costs.item4')
      ]
    },
    {
      icon: AlertTriangle,
      title: t('features.incidents.title'),
      description: t('features.incidents.description'),
      items: [
        t('features.incidents.item1'),
        t('features.incidents.item2'),
        t('features.incidents.item3')
      ]
    }
  ]

  const gettingStartedSteps = [
    {
      icon: UserCheck,
      title: t('gettingStarted.step1.title'),
      description: t('gettingStarted.step1.description')
    },
    {
      icon: Book,
      title: t('gettingStarted.step2.title'),
      description: t('gettingStarted.step2.description')
    },
    {
      icon: FolderOpen,
      title: t('gettingStarted.step3.title'),
      description: t('gettingStarted.step3.description')
    },
    {
      icon: Package,
      title: t('gettingStarted.step4.title'),
      description: t('gettingStarted.step4.description')
    },
    {
      icon: ShoppingCart,
      title: t('gettingStarted.step5.title'),
      description: t('gettingStarted.step5.description')
    }
  ]

  const faqs = [
    {
      question: t('faq.q1.question'),
      answer: t('faq.q1.answer')
    },
    {
      question: t('faq.q2.question'),
      answer: t('faq.q2.answer')
    },
    {
      question: t('faq.q3.question'),
      answer: t('faq.q3.answer')
    },
    {
      question: t('faq.q4.question'),
      answer: t('faq.q4.answer')
    },
    {
      question: t('faq.q5.question'),
      answer: t('faq.q5.answer')
    },
    {
      question: t('faq.q6.question'),
      answer: t('faq.q6.answer')
    }
  ]

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t('intro.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{t('intro.description')}</p>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>{t('intro.compliance')}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Main Documentation Tabs */}
      <Tabs defaultValue="getting-started" className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 h-auto">
          <TabsTrigger value="getting-started" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Home className="mr-2 h-4 w-4" />
            {t('tabs.gettingStarted')}
          </TabsTrigger>
          <TabsTrigger value="features" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Package className="mr-2 h-4 w-4" />
            {t('tabs.features')}
          </TabsTrigger>
          <TabsTrigger value="workflows" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BarChart3 className="mr-2 h-4 w-4" />
            {t('tabs.workflows')}
          </TabsTrigger>
          <TabsTrigger value="faq" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <HelpCircle className="mr-2 h-4 w-4" />
            {t('tabs.faq')}
          </TabsTrigger>
        </TabsList>

        {/* Getting Started Tab */}
        <TabsContent value="getting-started" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('gettingStarted.title')}</CardTitle>
              <CardDescription>{t('gettingStarted.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {gettingStartedSteps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {index + 1}
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <step.icon className="h-4 w-4" />
                      {step.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('quickTips.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 text-primary" />
                  <span className="text-sm">{t('quickTips.tip1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 text-primary" />
                  <span className="text-sm">{t('quickTips.tip2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 text-primary" />
                  <span className="text-sm">{t('quickTips.tip3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 text-primary" />
                  <span className="text-sm">{t('quickTips.tip4')}</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <feature.icon className="h-5 w-5 text-primary" />
                    {feature.title}
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {feature.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                {t('features.additional.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold">{t('features.additional.languages.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('features.additional.languages.description')}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Moon className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold">{t('features.additional.theme.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('features.additional.theme.description')}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Download className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold">{t('features.additional.export.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('features.additional.export.description')}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Search className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold">{t('features.additional.search.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('features.additional.search.description')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('workflows.inventory.title')}</CardTitle>
              <CardDescription>{t('workflows.inventory.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <Badge className="min-w-fit">1</Badge>
                  <span className="text-sm">{t('workflows.inventory.step1')}</span>
                </li>
                <li className="flex gap-3">
                  <Badge className="min-w-fit">2</Badge>
                  <span className="text-sm">{t('workflows.inventory.step2')}</span>
                </li>
                <li className="flex gap-3">
                  <Badge className="min-w-fit">3</Badge>
                  <span className="text-sm">{t('workflows.inventory.step3')}</span>
                </li>
                <li className="flex gap-3">
                  <Badge className="min-w-fit">4</Badge>
                  <span className="text-sm">{t('workflows.inventory.step4')}</span>
                </li>
                <li className="flex gap-3">
                  <Badge className="min-w-fit">5</Badge>
                  <span className="text-sm">{t('workflows.inventory.step5')}</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('workflows.sales.title')}</CardTitle>
              <CardDescription>{t('workflows.sales.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <Badge className="min-w-fit">1</Badge>
                  <span className="text-sm">{t('workflows.sales.step1')}</span>
                </li>
                <li className="flex gap-3">
                  <Badge className="min-w-fit">2</Badge>
                  <span className="text-sm">{t('workflows.sales.step2')}</span>
                </li>
                <li className="flex gap-3">
                  <Badge className="min-w-fit">3</Badge>
                  <span className="text-sm">{t('workflows.sales.step3')}</span>
                </li>
                <li className="flex gap-3">
                  <Badge className="min-w-fit">4</Badge>
                  <span className="text-sm">{t('workflows.sales.step4')}</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('workflows.compliance.title')}</CardTitle>
              <CardDescription>{t('workflows.compliance.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <Badge className="min-w-fit">1</Badge>
                  <span className="text-sm">{t('workflows.compliance.step1')}</span>
                </li>
                <li className="flex gap-3">
                  <Badge className="min-w-fit">2</Badge>
                  <span className="text-sm">{t('workflows.compliance.step2')}</span>
                </li>
                <li className="flex gap-3">
                  <Badge className="min-w-fit">3</Badge>
                  <span className="text-sm">{t('workflows.compliance.step3')}</span>
                </li>
                <li className="flex gap-3">
                  <Badge className="min-w-fit">4</Badge>
                  <span className="text-sm">{t('workflows.compliance.step4')}</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('faq.title')}</CardTitle>
              <CardDescription>{t('faq.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('support.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{t('support.description')}</p>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>{t('support.email')}:</strong> support@chinea.app
                </p>
                <p className="text-sm">
                  <strong>{t('support.hours')}:</strong> {t('support.hoursValue')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}