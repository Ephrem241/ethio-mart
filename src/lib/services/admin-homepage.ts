import { createClient } from "@/lib/supabase/client"
import { translate } from "@/lib/i18n/translate"
import {
  settingsFromSections,
  sectionsFromSettings,
  type HomepageSectionRow,
  type HomepageSettings,
} from "@/lib/services/homepage"

// Browser-side read/write for the admin homepage form. Writes are refused by
// the database itself unless the caller is an admin (RLS: is_admin()).

export async function fetchHomepageSettings(): Promise<HomepageSettings> {
  const { data, error } = await createClient().from("homepage_sections").select("section_key, content")
  if (error) throw new Error(`Failed to load homepage settings: ${error.message}`) // i18n-ignore: developer-facing
  return settingsFromSections((data ?? []) as HomepageSectionRow[])
}

export async function updateHomepageSettings(
  settings: HomepageSettings
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = createClient()

  for (const row of sectionsFromSettings(settings)) {
    // .select() so a write RLS silently refused (0 rows) is detected rather
    // than reported as success.
    const { data, error } = await supabase
      .from("homepage_sections")
      .update({ content: row.content })
      .eq("section_key", row.section_key)
      .select("section_key")

    if (error) return { success: false, error: translate("common.somethingWentWrong") }
    if (!data || data.length === 0) {
      return { success: false, error: translate("admin.homepage.noPermission") }
    }
  }
  return { success: true }
}
