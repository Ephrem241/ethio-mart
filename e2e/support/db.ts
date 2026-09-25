import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Test-side access to the real Supabase project named in .env.
//
// The service-role key (which bypasses row-level security) is used HERE ONLY,
// to prepare and clean up test data. It is never sent to the app or a browser.
//
// SAFETY RULES — the suite shares a database with real data:
//  * it only ever creates accounts whose e-mail matches TEST_EMAIL below, and
//    only ever deletes accounts that match it (checked again at deletion);
//  * test products and categories carry the slug prefix "e2e-" and only those
//    are deleted;
//  * anything else it touches (a product's stock, when an order is placed) is
//    snapshotted before the run and put back after it (see global-teardown.ts).

export const TEST_EMAIL = /^e2e-[a-z0-9-]+@example\.com$/i
export const TEST_SLUG_PREFIX = "e2e-"

function need(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `${name} is not set. The end-to-end suite needs the Supabase project's URL, anon key and service-role key in .env (see README, "Testing").`
    )
  }
  return value
}

let adminClient: SupabaseClient | undefined
export function admin(): SupabaseClient {
  adminClient ??= createClient(need("NEXT_PUBLIC_SUPABASE_URL"), need("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return adminClient
}

/** A client that behaves like a browser session of `user` (row-level security applies). */
export async function clientFor(user: TestUser): Promise<SupabaseClient> {
  const client = createClient(need("NEXT_PUBLIC_SUPABASE_URL"), need("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error } = await client.auth.signInWithPassword({ email: user.email, password: user.password })
  if (error) throw new Error(`Could not sign the test user in: ${error.message}`)
  return client
}

/** A client with no session at all (a signed-out visitor). */
export function anonymousClient(): SupabaseClient {
  return createClient(need("NEXT_PUBLIC_SUPABASE_URL"), need("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export interface TestUser {
  id: string
  email: string
  password: string
  fullName: string
}

function uniqueSuffix(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function testEmail(tag: string): string {
  return `e2e-${tag}-${uniqueSuffix()}@example.com`.toLowerCase()
}

export function testPassword(): string {
  return `E2e-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}!9`
}

export async function createTestUser({ tag = "user", role = "customer" }: { tag?: string; role?: "customer" | "admin" } = {}): Promise<TestUser> {
  const email = testEmail(tag)
  const password = testPassword()
  const fullName = `E2E ${tag}`
  const { data, error } = await admin().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (error || !data.user) throw new Error(`Could not create a test user: ${error?.message}`)
  if (role === "admin") {
    const { error: promote } = await admin().from("profiles").update({ role: "admin" }).eq("id", data.user.id)
    if (promote) throw new Error(`Could not make the test user an admin: ${promote.message}`)
  }
  return { id: data.user.id, email, password, fullName }
}

export async function deleteTestUser(id: string): Promise<void> {
  const { data } = await admin().auth.admin.getUserById(id)
  const email = data.user?.email ?? ""
  if (!TEST_EMAIL.test(email)) return // never delete anything that is not a test account
  await admin().from("orders").delete().eq("user_id", id)
  await admin().from("addresses").delete().eq("user_id", id)
  await admin().from("cart_items").delete().eq("user_id", id)
  await admin().from("favorites").delete().eq("user_id", id)
  await admin().auth.admin.deleteUser(id)
}

/** Deletes every test account, including ones left behind by an interrupted run. */
export async function deleteAllTestUsers(): Promise<number> {
  let removed = 0
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin().auth.admin.listUsers({ page, perPage: 200 })
    if (error || data.users.length === 0) break
    for (const user of data.users) {
      if (TEST_EMAIL.test(user.email ?? "")) {
        await deleteTestUser(user.id)
        removed++
      }
    }
    if (data.users.length < 200) break
  }
  return removed
}

/** A test account created through the sign-up form: find it by e-mail. */
export async function findTestUserByEmail(email: string): Promise<{ id: string } | undefined> {
  if (!TEST_EMAIL.test(email)) return undefined
  const { data } = await admin().from("profiles").select("id").eq("email", email).maybeSingle()
  return data ?? undefined
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export interface CatalogProduct {
  id: string
  slug: string
  name_en: string
  name_am: string
  price: number
  stock: number
  compare_at_price: number | null
  category_id: string
  is_active: boolean
}

/** Real, active, well-stocked products, cheapest first. */
export async function stockedProducts(count = 3, minStock = 6): Promise<CatalogProduct[]> {
  const { data, error } = await admin()
    .from("products")
    .select("id, slug, name_en, name_am, price, stock, compare_at_price, category_id, is_active")
    .eq("is_active", true)
    .gte("stock", minStock)
    .not("slug", "like", `${TEST_SLUG_PREFIX}%`)
    .order("price", { ascending: true })
    .limit(Math.max(count, 10))
  if (error || !data || data.length < count) throw new Error(`The catalog needs at least ${count} active products with stock >= ${minStock}: ${error?.message ?? "not enough"}`)
  return (data as CatalogProduct[]).slice(0, count).map((p) => ({ ...p, price: Number(p.price) }))
}

export async function freeDeliveryThreshold(): Promise<number | null> {
  const { data } = await admin().from("store_settings").select("value").eq("key", "free_delivery_threshold").maybeSingle()
  const value = Number(data?.value)
  return Number.isFinite(value) ? value : null
}

export async function deliveryFee(city: string): Promise<number> {
  const { data } = await admin().from("delivery_fees").select("fee").eq("city", city).maybeSingle()
  return Number(data?.fee ?? 0)
}

export async function firstCategoryId(): Promise<string> {
  const { data } = await admin().from("categories").select("id").eq("is_active", true).order("sort_order").limit(1).single()
  return data!.id as string
}

/** A throwaway product (slug "e2e-…") for scenarios that need a specific state, e.g. sold out. */
export async function createTestProduct(overrides: Partial<CatalogProduct> & { imageUrl?: string } = {}): Promise<CatalogProduct> {
  const stamp = uniqueSuffix()
  const { imageUrl, ...rest } = overrides
  const row = {
    slug: `${TEST_SLUG_PREFIX}${stamp}`,
    sku: `E2E-${stamp}`.toUpperCase(),
    name_en: `E2E Product ${stamp}`,
    name_am: `የሙከራ ምርት ${stamp}`,
    description_en: "A throwaway product created by the end-to-end tests.",
    description_am: "በሙከራ የተፈጠረ ምርት።",
    price: 300,
    stock: 10,
    is_active: true,
    category_id: await firstCategoryId(),
    ...rest,
  }
  const { data, error } = await admin().from("products").insert(row).select("id, slug, name_en, name_am, price, stock, compare_at_price, category_id, is_active").single()
  if (error || !data) throw new Error(`Could not create a test product: ${error?.message}`)
  if (imageUrl) await admin().from("product_images").insert({ product_id: data.id, image_url: imageUrl, sort_order: 0, alt_text: "e2e" })
  return { ...(data as CatalogProduct), price: Number(data.price) }
}

export async function deleteTestCatalog(): Promise<void> {
  const { data: products } = await admin().from("products").select("id").like("slug", `${TEST_SLUG_PREFIX}%`)
  const ids = (products ?? []).map((p) => p.id as string)
  if (ids.length) {
    await admin().from("product_images").delete().in("product_id", ids)
    await admin().from("cart_items").delete().in("product_id", ids)
    await admin().from("favorites").delete().in("product_id", ids)
    await admin().from("products").delete().in("id", ids)
  }
  await admin().from("categories").delete().like("slug", `${TEST_SLUG_PREFIX}%`)
}

// ---------------------------------------------------------------------------
// Orders (placed the way the app does: through the place_order function)
// ---------------------------------------------------------------------------

export const DELIVERY_ADDRESS = {
  full_name: "E2E Buyer",
  phone: "0911223344",
  city: "Adama",
  sub_city: "Kebele 2",
  woreda: "05",
  address: "Behind the market, house 9",
}

export interface PlacedOrder {
  id: string
  order_number: string
  subtotal: number
  delivery_fee: number
  total: number
  status: string
}

export async function placeOrderAs(user: TestUser, items: { product_id: string; quantity: number }[], address = DELIVERY_ADDRESS): Promise<PlacedOrder> {
  const client = await clientFor(user)
  const { data, error } = await client.rpc("place_order", { p_delivery_address: address, p_payment_method: "cod", p_items: items })
  if (error) throw new Error(`place_order failed: ${error.message}`)
  return { ...data, subtotal: Number(data.subtotal), delivery_fee: Number(data.delivery_fee), total: Number(data.total) } as PlacedOrder
}
