import { supabaseAdmin } from "./supabase";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface HSCodeResult {
  hs_code: string;
  description: string;
  full_path: string;
  duty_rate: string;
  similarity: number;
  text_rank: number;
  combined_score: number;
}

/**
 * Generate embedding for a query
 */
async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

/**
 * Hybrid search: combines vector similarity + full-text search
 */
export async function searchHSCodesVector(
  query: string,
  limit: number = 50
): Promise<HSCodeResult[]> {
  if (!supabaseAdmin) {
    console.error("Supabase not configured");
    return [];
  }

  try {
    // Generate embedding for the query
    const embedding = await getEmbedding(query);

    // Call the hybrid search function
    const { data, error } = await supabaseAdmin.rpc("search_hs_codes", {
      query_embedding: embedding,
      query_text: query,
      match_count: limit,
    });

    if (error) {
      console.error("Vector search error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

/**
 * Format search results for AI prompt
 */
export function formatVectorResultsForPrompt(results: HSCodeResult[]): string {
  if (results.length === 0) return "No relevant codes found.";

  return results
    .map(
      (r) =>
        `- ${r.hs_code}: ${r.full_path} (Duty: ${r.duty_rate}%)`
    )
    .join("\n");
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
    // Query for all codes starting with this heading
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
      similarity: 0,
      text_rank: 0,
      combined_score: 0,
    }));
  } catch (error) {
    console.error("Heading search error:", error);
    return [];
  }
}
