export interface Category {
  id: string
  name_en: string
  name_am: string
  slug: string
  description_en: string
  description_am: string
  /** Real photography lands in a later phase; Phase 3 renders a deterministic placeholder graphic instead. */
  image_url: string
  sort_order: number
  is_active: boolean
  created_at: string
}

// Amharic strings below are a best-effort placeholder translation for development —
// review with a native speaker before Phase 13 (Localization) ships them for real.
export const categories: Category[] = [
  {
    id: "fashion",
    name_en: "Fashion",
    name_am: "ፋሽን",
    slug: "fashion",
    description_en: "Clothing and style for every occasion.",
    description_am: "ለማንኛውም አጋጣሚ የሚሆኑ አልባሳት እና ስታይል።",
    image_url: "",
    sort_order: 1,
    is_active: true,
    created_at: "2026-01-15T00:00:00.000Z",
  },
  {
    id: "home",
    name_en: "Home",
    name_am: "ቤት",
    slug: "home",
    description_en: "Everything to make your house a home.",
    description_am: "ቤትዎን የሚያሳምሩ ዕቃዎች።",
    image_url: "",
    sort_order: 2,
    is_active: true,
    created_at: "2026-01-15T00:00:00.000Z",
  },
  {
    id: "kitchen",
    name_en: "Kitchen",
    name_am: "ወጥ ቤት",
    slug: "kitchen",
    description_en: "Tools and essentials for your kitchen.",
    description_am: "ለወጥ ቤትዎ አስፈላጊ ቁሳቁሶች።",
    image_url: "",
    sort_order: 3,
    is_active: true,
    created_at: "2026-01-15T00:00:00.000Z",
  },
  {
    id: "beauty",
    name_en: "Beauty",
    name_am: "ውበት",
    slug: "beauty",
    description_en: "Skincare, cosmetics, and self-care.",
    description_am: "የቆዳ እንክብካቤ እና ውበት ውጤቶች።",
    image_url: "",
    sort_order: 4,
    is_active: true,
    created_at: "2026-01-15T00:00:00.000Z",
  },
  {
    id: "electronics",
    name_en: "Electronics",
    name_am: "ኤሌክትሮኒክስ",
    slug: "electronics",
    description_en: "Gadgets and devices for everyday life.",
    description_am: "ለዕለት ተዕለት ኑሮ የሚሆኑ መሳሪያዎች።",
    image_url: "",
    sort_order: 5,
    is_active: true,
    created_at: "2026-01-15T00:00:00.000Z",
  },
  {
    id: "accessories",
    name_en: "Accessories",
    name_am: "አክሰሰሪዎች",
    slug: "accessories",
    description_en: "Finishing touches for every outfit.",
    description_am: "ለአለባበስዎ ተጨማሪ ውበት የሚሰጡ ዕቃዎች።",
    image_url: "",
    sort_order: 6,
    is_active: true,
    created_at: "2026-01-15T00:00:00.000Z",
  },
  {
    id: "lifestyle",
    name_en: "Lifestyle",
    name_am: "የአኗኗር ዘይቤ",
    slug: "lifestyle",
    description_en: "Products for comfortable, everyday living.",
    description_am: "ለምቹ የዕለት ተዕለት ኑሮ የሚሆኑ ውጤቶች።",
    image_url: "",
    sort_order: 7,
    is_active: true,
    created_at: "2026-01-15T00:00:00.000Z",
  },
  {
    id: "new-arrivals",
    name_en: "New Arrivals",
    name_am: "አዲስ ምርቶች",
    slug: "new-arrivals",
    description_en: "The latest additions to our catalog.",
    description_am: "በቅርቡ የተጨመሩ አዳዲስ ምርቶች።",
    image_url: "",
    sort_order: 8,
    is_active: true,
    created_at: "2026-01-15T00:00:00.000Z",
  },
]
