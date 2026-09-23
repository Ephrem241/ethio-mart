"use client"

import { useRemote, type Remote } from "@/lib/hooks/use-remote"
import { fetchAdminCategories, fetchAdminProduct, fetchAdminProducts } from "@/lib/services/admin-catalog"
import { fetchProfiles, type AdminProfile } from "@/lib/services/admin-customers"
import { fetchHomepageSettings } from "@/lib/services/admin-homepage"
import type { HomepageSettings } from "@/lib/services/homepage"
import type { Product } from "@/lib/data/products"
import type { Category } from "@/lib/data/categories"

// Admin views load everything under one fixed key. RLS decides what the
// caller actually receives, so a non-admin who somehow reached these hooks
// would get only what they're allowed to see.
const loadProducts = () => fetchAdminProducts()
const loadCategories = () => fetchAdminCategories()
const loadProfiles = () => fetchProfiles()

export function useAdminProducts(): Remote<Product[]> {
  return useRemote("all", loadProducts)
}

const loadProduct = (id: string) => fetchAdminProduct(id)

// `data` is `null` when there is no such product.
export function useAdminProduct(id: string): Remote<Product | null> {
  return useRemote(id, loadProduct)
}

export function useAdminCategories(): Remote<Category[]> {
  return useRemote("all", loadCategories)
}

const loadHomepage = () => fetchHomepageSettings()

export function useHomepageSettings(): Remote<HomepageSettings> {
  return useRemote("homepage", loadHomepage)
}

export function useProfiles(): Remote<AdminProfile[]> {
  return useRemote("all", loadProfiles)
}
