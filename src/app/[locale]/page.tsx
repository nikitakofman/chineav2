import { createClient } from '@/utils/supabase/server'
import { redirect } from "next/navigation"
import { Link } from '@/i18n/routing'
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { getTranslations } from 'next-intl/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const t = await getTranslations()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold truncate">{t('common.appName')}</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            <Link href="/connect">
              <Button size="sm" className="sm:size-default">{t('common.signIn')}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-8 sm:py-12">
        <div className="container mx-auto max-w-2xl text-center px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            {t('home.title')}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-lg mx-auto leading-relaxed">
            {t('home.subtitle')}
          </p>
          <Link href="/connect">
            <Button 
              size="lg" 
              className="gap-2 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg min-h-[44px] w-full sm:w-auto"
            >
              {t('home.getStarted')} <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </Link>
        </div>
      </main>

      <footer className="border-t py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6 text-center text-xs sm:text-sm text-muted-foreground">
          © 2025 {t('common.appName')}. {t('home.footer')}
        </div>
      </footer>
    </div>
  );
}