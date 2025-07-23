"use client";

import { useState } from "react";
import { Link, usePathname } from "@/i18n/routing";
import {
  Package,
  Plus,
  LayoutGrid,
  FolderTree,
  Users,
  DollarSign,
  User,
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  AlertTriangle,
  Archive,
  CreditCard,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { AddItemModal } from "@/components/items/add-item-modal";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMobileSidebar } from "@/contexts/mobile-sidebar-context";

interface DashboardSidebarProps {
  categories: Array<{
    id: string;
    name: string;
    description: string | null;
    user_id: string | null;
    created_at: Date | null;
    updated_at: Date | null;
  }>;
}

export function DashboardSidebar({ categories }: DashboardSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [itemsExpanded, setItemsExpanded] = useState(
    pathname.startsWith("/dashboard/items") ||
      pathname.startsWith("/dashboard/sold") ||
      pathname.startsWith("/dashboard/incidents")
  );
  const { user } = useAuth();
  const { isOpen, setIsOpen } = useMobileSidebar();

  const userName = user?.email?.split("@")[0] || "User";

  const mainItems = [
    {
      label: t("overview"),
      icon: LayoutGrid,
      href: "/dashboard",
    },
  ];

  const itemsSubItems = [
    {
      label: t("inStock"),
      icon: Package,
      href: "/dashboard/items",
    },
    {
      label: t("sold"),
      icon: ShoppingCart,
      href: "/dashboard/sold",
    },
    {
      label: t("incidents"),
      icon: AlertTriangle,
      href: "/dashboard/incidents",
    },
  ];

  const secondaryItems = [
    {
      label: t("categories"),
      icon: FolderTree,
      href: "/dashboard/categories",
    },
    {
      label: t("people"),
      icon: Users,
      href: "/dashboard/people",
    },
  ];

  const bottomItems = [
    {
      label: userName,
      icon: User,
      href: "/dashboard/account",
    },
  ];

  // Handle navigation with mobile sheet closing
  const handleNavigation = () => {
    setIsOpen(false); // Close mobile sheet when navigating
  };

  // Reusable sidebar content
  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={cn("flex-1 flex-col h-full", isMobile && "pt-4")}>
      <div className="p-6 flex-1">
        <Button
          onClick={() => setShowAddItemModal(true)}
          className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground px-4 py-3 min-h-[48px] rounded-lg flex items-center justify-center space-x-2 mb-8 touch-manipulation"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium">{t("addNewItem")}</span>
        </Button>

        <nav className="space-y-2">
          {/* Main Navigation Items */}
          {mainItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavigation}
                className={cn(
                  "flex items-center space-x-3 px-3 py-3 min-h-[48px] rounded-lg transition-colors touch-manipulation w-full",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* Items Dropdown */}
          <div>
            <button
              onClick={() => setItemsExpanded(!itemsExpanded)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-3 min-h-[48px] rounded-lg transition-colors touch-manipulation",
                pathname.startsWith("/dashboard/items") ||
                  pathname.startsWith("/dashboard/sold") ||
                  pathname.startsWith("/dashboard/incidents")
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center space-x-3">
                <Archive className="w-5 h-5" />
                <span className="font-medium">{t("items")}</span>
              </div>
              {itemsExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {itemsExpanded && (
              <div className="ml-6 mt-2 space-y-1">
                {itemsSubItems.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavigation}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 min-h-[44px] rounded-lg transition-colors text-sm touch-manipulation w-full",
                        isActive
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Costs Item */}
          <Link
            href="/dashboard/costs"
            onClick={handleNavigation}
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
              pathname === "/dashboard/costs" ||
                pathname.startsWith("/dashboard/costs")
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <DollarSign className="w-5 h-5" />
            <span className="font-medium">{t("costs")}</span>
          </Link>
          
          {/* Control Item */}
          <Link
            href="/dashboard/control"
            onClick={handleNavigation}
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
              pathname === "/dashboard/control" ||
                pathname.startsWith("/dashboard/control")
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Shield className="w-5 h-5" />
            <span className="font-medium">{t("control")}</span>
          </Link>

          <Separator className="my-4" />

          {/* Secondary Navigation Items */}
          {secondaryItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavigation}
                className={cn(
                  "flex items-center space-x-3 px-3 py-3 min-h-[48px] rounded-lg transition-colors touch-manipulation w-full",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-6 border-t">
        <nav className="space-y-2">
          {/* Subscription Button */}
          <Link
            href="/dashboard/subscription"
            onClick={handleNavigation}
            className={cn(
              "flex items-center space-x-3 px-3 py-3 min-h-[48px] rounded-lg transition-colors touch-manipulation w-full",
              pathname === "/dashboard/subscription"
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <CreditCard className="w-5 h-5" />
            <span className="font-medium">{t("subscription")}</span>
          </Link>

          {/* Account Button */}
          {bottomItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavigation}
                className={cn(
                  "flex items-center space-x-3 px-3 py-3 min-h-[48px] rounded-lg transition-colors touch-manipulation w-full",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 bg-white dark:bg-card border-r border-border h-full">
        <SidebarContent />
      </div>

      {/* Mobile Sheet Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="left"
          className="w-[280px] sm:w-[320px] p-0 max-w-[85vw]"
        >
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="text-left">
              {t("dashboard")}
            </SheetTitle>
          </SheetHeader>
          <SidebarContent isMobile={true} />
        </SheetContent>
      </Sheet>

      <AddItemModal
        open={showAddItemModal}
        onOpenChange={setShowAddItemModal}
        categories={categories}
      />
    </>
  );
}
