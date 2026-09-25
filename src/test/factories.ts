import type { Category } from "@/lib/data/categories"
import type { Product } from "@/lib/data/products"

// Small builders for test data, so each test states only what it cares about.
let counter = 0

export function makeCategory(overrides: Partial<Category> = {}): Category {
  counter += 1
  return {
    id: `cat-${counter}`,
    name_en: `Category ${counter}`,
    name_am: `ምድብ ${counter}`,
    slug: `category-${counter}`,
    description_en: "",
    description_am: "",
    image_url: "",
    sort_order: counter,
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

export function makeProduct(overrides: Partial<Product> = {}): Product {
  counter += 1
  return {
    id: `prod-${counter}`,
    category_id: "cat-1",
    name_en: `Product ${counter}`,
    name_am: `ምርት ${counter}`,
    slug: `product-${counter}`,
    description_en: "A product.",
    description_am: "ምርት።",
    price: 1000,
    compare_at_price: null,
    stock: 10,
    sku: `SKU-${counter}`,
    is_featured: false,
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}
