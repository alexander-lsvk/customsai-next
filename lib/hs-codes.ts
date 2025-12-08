import { supabaseAdmin } from "./supabase";

export interface HSCodeResult {
  hs_code: string;
  description: string;
  full_path: string;
  duty_rate: string;
}

/**
 * Get all HS codes by 4-digit heading prefix (e.g., "3402")
 */
export async function getHSCodesByHeading(heading: string): Promise<HSCodeResult[]> {
  if (!supabaseAdmin) {
    console.error("Supabase not configured");
    return [];
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("hs_codes")
      .select("hs_code, description, full_path, duty_rate")
      .like("hs_code", `${heading}%`)
      .order("hs_code");

    if (error) {
      console.error("Heading search error:", error);
      return [];
    }

    return (data || []).map((row) => ({
      hs_code: row.hs_code,
      description: row.description,
      full_path: row.full_path,
      duty_rate: row.duty_rate,
    }));
  } catch (error) {
    console.error("Heading search error:", error);
    return [];
  }
}

/**
 * Format HS codes for AI prompt
 */
export function formatHSCodesForPrompt(results: HSCodeResult[]): string {
  if (results.length === 0) return "No relevant codes found.";

  return results
    .map((r) => `- ${r.hs_code}: ${r.full_path} (Duty: ${r.duty_rate}%)`)
    .join("\n");
}
