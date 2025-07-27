"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { DateRangePickerCompact } from "@/components/ui/date-range-picker-compact";
import { DateRange } from "react-day-picker";

interface Category {
  id: string;
  name: string;
}

interface SearchFiltersProps {
  categories: Category[];
  onSearchChange: (search: string) => void;
  onCategoryChange: (categoryId: string) => void;
  showDateFilter?: boolean;
  onDateRangeChange?: (dateRange: DateRange) => void;
  searchValue?: string;
  categoryValue?: string;
  hideDate?: boolean;
}

export function SearchFilters({
  categories,
  onSearchChange,
  onCategoryChange,
  showDateFilter = true,
  onDateRangeChange,
  searchValue = '',
  categoryValue = 'all',
  hideDate = false,
}: SearchFiltersProps) {
  const t = useTranslations();

  return (
    <div className="flex w-full flex-col lg:flex-row gap-4">
      {/* Search Input */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder={t("items.searchPlaceholder")}
          className="pl-10 pr-4 bg-white h-10"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Category Filter */}
      <Select value={categoryValue} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full lg:w-[200px] bg-white h-10">
          <SelectValue placeholder={t("items.allCategories")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("items.allCategories")}</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date Filter */}
      {showDateFilter && !hideDate && (
        <DateRangePickerCompact
          onUpdate={(values) => {
            onDateRangeChange?.(values.range);
          }}
          align="start"
        />
      )}
    </div>
  );
}
