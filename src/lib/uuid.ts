// Kept in its own tiny module (not next to the Supabase code that first used
// it) so that checking an id doesn't drag the Supabase client into a bundle.
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
