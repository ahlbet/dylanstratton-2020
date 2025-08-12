// Central Supabase configuration constants

export const SUPABASE_PUBLIC_URL_DOMAIN =
  process.env.GATSBY_SUPABASE_PUBLIC_URL_DOMAIN ||
  process.env.SUPABASE_PUBLIC_URL_DOMAIN ||
  'uzsnbfnteazzwirbqgzb.supabase.co'

export const SUPABASE_CONFIG = {
  publicUrlDomain: SUPABASE_PUBLIC_URL_DOMAIN,
  // Add other Supabase config here as needed
}
