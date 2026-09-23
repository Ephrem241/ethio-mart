import {
  Shirt,
  Home,
  UtensilsCrossed,
  Sparkles,
  Headphones,
  Watch,
  Armchair,
  Star,
  Package,
  type LucideIcon,
} from "lucide-react"

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  fashion: Shirt,
  home: Home,
  kitchen: UtensilsCrossed,
  beauty: Sparkles,
  electronics: Headphones,
  accessories: Watch,
  lifestyle: Armchair,
  "new-arrivals": Star,
}

export function getCategoryIcon(slug: string): LucideIcon {
  return CATEGORY_ICONS[slug] ?? Package
}
