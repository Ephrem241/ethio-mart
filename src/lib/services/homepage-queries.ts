import { createClient } from "@/lib/supabase/server"
import {
  settingsFromSections,
  DEFAULT_HOMEPAGE_SETTINGS,
  type HomepageSectionRow,
  type HomepageSettings,
} from "@/lib/services/homepage"

// Server-side read for the storefront. `homepage_sections` is publicly
// readable (guests must see the homepage); only admins can write it.
export async function getHomepageSettings(): Promise<HomepageSettings> {
  const { data, error } = await (await createClient()).from("homepage_sections").select("section_key, content")

  if (error) {
    console.error("Failed to load homepage sections:", error.message)
    return DEFAULT_HOMEPAGE_SETTINGS
  }
  return settingsFromSections((data ?? []) as HomepageSectionRow[])
}
