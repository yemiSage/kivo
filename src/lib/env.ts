const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const env = {
  supabaseUrl: supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey: supabaseAnonKey || "placeholder",
  configured: Boolean(supabaseUrl && supabaseAnonKey),
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  brevoApiKey: process.env.BREVO_API_KEY ?? "",
  fromEmail: process.env.KIVO_FROM_EMAIL ?? "",
};
