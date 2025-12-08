import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { checkCredits, useCredit, saveClassification } from "@/lib/credits";
import {
  formatHSCodesForPrompt,
  getHSCodesByHeading,
} from "@/lib/hs-codes";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Classification mode: "chapter" (recommended) or "llm-only"
type ClassificationMode = "chapter" | "llm-only";
const CLASSIFICATION_MODE: ClassificationMode = "chapter";

const SYSTEM_PROMPT_CHAPTER = `You are an expert in ASEAN Harmonized Tariff Nomenclature (AHTN) 2022 and Thailand Customs Tariff. Your task is to analyze product descriptions and provide accurate HS codes based on the AHTN 2022 nomenclature.

CRITICAL - USE ONLY VALID THAILAND HS CODES:
You will be provided with a list of VALID Thailand HS codes that match the product description. You MUST select your classification from these codes ONLY.
- DO NOT invent or guess HS codes - use ONLY codes from the provided list
- The provided codes are the ONLY valid 8-digit Thailand AHTN 2022 codes
- If none of the provided codes seem to fit, choose the closest match and explain why

CRITICAL - CHOOSE THE MOST SPECIFIC CODE:
- ALWAYS prefer a SPECIFIC named code over a generic "Other" code
- If a code description matches exactly what the product IS, use that code
- Codes with "Other" in the description are catch-all codes - only use them if NO specific code matches the product

WEB SEARCH FOR PRODUCT IDENTIFICATION:
- Use web search to identify what the product actually is (especially for brand names)
- Use web search to understand the product's composition and characteristics
- BUT for the final HS code, you MUST select from the provided valid codes list

When a user provides a product description, you must:

1. **Interpret the product**: If it's a brand name, trade name, or unfamiliar term, USE WEB SEARCH to identify what it is
   - ALWAYS search the web for brand names, chemical trade names, or terms you're not 100% certain about
   - Use your search results to determine the actual product category and composition
   - If still unsure after searching, classify based on the most common form of that product
2. **Extract ALL attributes from the description**: Look for any specified characteristics relevant to HS classification (material, form, function, size, state, etc.)
3. **Classify based on EXACTLY what was described**:
   - The primary HS code MUST reflect ALL attributes mentioned in the description
   - Apply General Rules of Interpretation (GRI) correctly
   - Consider the product's essential character when classifying composite goods
4. **Explain your reasoning**: Reference the relevant HS chapter, heading, and classification rules
5. **Identify edge cases** (provide 3-5): Variations NOT already specified in the description that would change the classification
6. **Provide alternatives** (provide 3-5): Other possible HS codes if certain assumptions differ
   - Include codes for related product categories, different interpretations, or common misclassifications

CLASSIFICATION PRINCIPLES:
- Apply GRI (General Rules of Interpretation) in order: GRI 1, then GRI 2, then GRI 3, etc.
- Classify by actual product characteristics, not by brand or trade name
- For composite goods, determine essential character per GRI 3(b)
- Edge cases should only cover UNSPECIFIED variations
- Do NOT list an edge case for something already specified in the description

IMPORTANT:
- Use AHTN 2022 (ASEAN Harmonized Tariff Nomenclature 2022) codes - NOT older versions
- For Thailand: use 8-digit codes in format XXXX.XX.XX
- Be specific about what conditions would trigger each alternative code
- Always explain WHY a particular code applies based on HS classification rules
- If you encounter an unknown brand name or term, ALWAYS use web search to look it up before classifying
- NEVER return 0% confidence or say you cannot classify - always make your best determination based on available information
- When searching, specifically look for "HS 2022" or "AHTN 2022" classification codes

Respond ONLY with valid JSON in this exact format:
{
  "interpreted_product": "What this product actually is, including all attributes from the description",
  "primary_hs_code": "XXXX.XX.XX",
  "primary_description": "Official HS code description",
  "confidence": 0.XX,
  "reasoning": "Brief explanation (3-5 sentences max) of why this code was chosen",
  "edge_cases": [
    {
      "condition": "Description of when this alternative classification applies",
      "hs_code": "XXXX.XX.XX",
      "description": "Official HS code description",
      "explanation": "Why this code applies under this condition"
    }
  ],
  "alternatives": [
    {
      "hs_code": "XXXX.XX.XX",
      "description": "Official HS code description",
      "reason": "When/why this alternative might apply"
    }
  ]
}`;

// LLM-only system prompt (no vector search constraints)
const SYSTEM_PROMPT_LLM = `You are an expert in ASEAN Harmonized Tariff Nomenclature (AHTN) 2022 and Thailand Customs Tariff. Your task is to analyze product descriptions and provide accurate HS codes based on the AHTN 2022 nomenclature.

When a user provides a product description, you must:

1. **Interpret the product**: If it's a brand name, trade name, or unfamiliar term, USE WEB SEARCH to identify what it is
   - ALWAYS search the web for brand names, chemical trade names, or terms you're not 100% certain about
   - Use your search results to determine the actual product category and composition
   - If still unsure after searching, classify based on the most common form of that product
2. **Extract ALL attributes from the description**: Look for any specified characteristics relevant to HS classification (material, form, function, size, state, etc.)
3. **Classify based on EXACTLY what was described**:
   - The primary HS code MUST reflect ALL attributes mentioned in the description
   - Apply General Rules of Interpretation (GRI) correctly
   - Consider the product's essential character when classifying composite goods
4. **Explain your reasoning**: Reference the relevant HS chapter, heading, and classification rules
5. **Identify edge cases** (provide 3-5): Variations NOT already specified in the description that would change the classification
6. **Provide alternatives** (provide 3-5): Other possible HS codes if certain assumptions differ

CLASSIFICATION PRINCIPLES:
- Apply GRI (General Rules of Interpretation) in order: GRI 1, then GRI 2, then GRI 3, etc.
- Classify by actual product characteristics, not by brand or trade name
- For composite goods, determine essential character per GRI 3(b)
- Edge cases should only cover UNSPECIFIED variations

IMPORTANT:
- Use AHTN 2022 (ASEAN Harmonized Tariff Nomenclature 2022) codes - NOT older versions
- For Thailand: use 8-digit codes in format XXXX.XX.XX
- Always explain WHY a particular code applies based on HS classification rules
- If you encounter an unknown brand name or term, ALWAYS use web search to look it up before classifying
- NEVER return 0% confidence or say you cannot classify - always make your best determination
- When searching, specifically look for "AHTN 2022" classification codes

Respond ONLY with valid JSON in this exact format:
{
  "interpreted_product": "What this product actually is, including all attributes from the description",
  "primary_hs_code": "XXXX.XX.XX",
  "primary_description": "Official HS code description",
  "confidence": 0.XX,
  "reasoning": "Brief explanation (3-5 sentences max) of why this code was chosen",
  "edge_cases": [
    {
      "condition": "Description of when this applies",
      "hs_code": "XXXX.XX.XX",
      "description": "Official HS code description",
      "explanation": "Why this code applies under this condition"
    }
  ],
  "alternatives": [
    {
      "hs_code": "XXXX.XX.XX",
      "description": "Official HS code description",
      "reason": "When/why this alternative might apply"
    }
  ]
}`;

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  try {
    // Get authenticated user
    const { userId } = await auth();
    const testMode = process.env.NODE_ENV === "development" && !userId;

    if (!userId && !testMode) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const effectiveUserId = userId || "test-user";

    const body = await request.json();
    const { description } = body;

    if (!description || typeof description !== "string") {
      return new Response(
        JSON.stringify({ error: "Description is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if user has credits (skip in test mode)
    const creditCheck = testMode
      ? { allowed: true, remaining: 999, plan: "test", message: "" }
      : await checkCredits(effectiveUserId);

    if (!creditCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: creditCheck.message,
          credits_remaining: creditCheck.remaining,
          plan: creditCheck.plan,
        }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    let stream;

    if (CLASSIFICATION_MODE === "chapter") {
      // === CHAPTER-BASED MODE (recommended) ===
      // STEP 1: LLM identifies product and returns 4-digit HS heading
      console.log("Using chapter-based mode for classification");
      const identifyResponse = await openai.responses.create({
        model: "gpt-5.1",
        input: `Identify what this product is and determine the correct 4-digit HS heading: "${description}"

If it's a brand name or unfamiliar term, search the web to find out what it actually is.

Return ONLY a JSON object:
{
  "product_name": "What this product actually is",
  "hs_heading": "XXXX",
  "heading_description": "Description of this HS heading",
  "reasoning": "Why this heading"
}

Return ONLY valid JSON, no other text.`,
        tools: [{ type: "web_search_preview" }],
        reasoning: { effort: "none" },
      });

      // Parse the heading
      let hsHeading = "";
      let productIdentification = "";
      try {
        const identifyText = identifyResponse.output_text || "";
        console.log("AI identification response:", identifyText);
        const jsonMatch = identifyText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const identified = JSON.parse(jsonMatch[0]);
          hsHeading = identified.hs_heading?.replace(/\./g, "") || "";
          productIdentification = identified.product_name || description;
          console.log("Identified heading:", hsHeading, "Product:", productIdentification);
        }
      } catch {
        console.log("Failed to parse identification");
      }

      if (!hsHeading || hsHeading.length !== 4) {
        // Fallback to LLM-only if heading identification fails
        console.log("Heading identification failed, falling back to LLM-only");
        stream = await openai.responses.create({
          model: "gpt-5.1",
          instructions: SYSTEM_PROMPT_LLM,
          input: `Classify the following product for ASEAN/Thailand customs using HS 2022 codes:

Product: ${description}

Respond ONLY with valid JSON, no other text.`,
          tools: [{ type: "web_search_preview" }],
          stream: true,
          reasoning: { effort: "none" },
        });
      } else {
        // STEP 2: Get all codes from this heading
        const headingCodes = await getHSCodesByHeading(hsHeading);
        console.log(`Found ${headingCodes.length} codes for heading ${hsHeading}`);
        const codesContext = formatHSCodesForPrompt(headingCodes);

        // STEP 3: LLM picks the right code from valid options
        stream = await openai.responses.create({
          model: "gpt-5.1",
          instructions: SYSTEM_PROMPT_CHAPTER,
          input: `Classify this product for Thailand customs.

Product: ${description}
Identified as: ${productIdentification}

VALID THAILAND HS CODES for heading ${hsHeading} (you MUST choose from these):
${codesContext}

Pick the most specific code that matches this product. Respond ONLY with valid JSON.`,
          tools: [{ type: "web_search_preview" }],
          stream: true,
          reasoning: { effort: "none" },
        });
      }
    } else {
      // === LLM-ONLY MODE ===
      console.log("Using LLM-only mode for classification");
      stream = await openai.responses.create({
        model: "gpt-5.1",
        instructions: SYSTEM_PROMPT_LLM,
        input: `Classify the following product for ASEAN/Thailand customs using HS 2022 codes:

Product: ${description}

Respond ONLY with valid JSON, no other text.`,
        tools: [{ type: "web_search_preview" }],
        stream: true,
        reasoning: { effort: "none" },
      });
    }

    const readableStream = new ReadableStream({
      async start(controller) {
        let fullText = "";

        try {
          for await (const event of stream) {
            if (
              event.type === "response.output_text.delta" &&
              "delta" in event
            ) {
              const delta = event.delta as string;
              fullText += delta;
              // Send full text to client for partial parsing
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ fullText })}\n\n`)
              );
            }

            if (event.type === "response.completed") {
              // Extract JSON from full text (may be wrapped in markdown)
              let content = fullText;
              const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
              if (jsonMatch) {
                content = jsonMatch[1].trim();
              }

              try {
                const result = JSON.parse(content);
                const response = {
                  primary_hs_code_thailand: result.primary_hs_code,
                  confidence: result.confidence,
                  reasoning: result.reasoning,
                  alternatives: result.alternatives || [],
                  interpreted_product: result.interpreted_product,
                  primary_description: result.primary_description,
                  edge_cases: result.edge_cases || [],
                };

                // Use credit and save classification (skip in test mode)
                if (!testMode) {
                  await useCredit(effectiveUserId);
                  await saveClassification(effectiveUserId, {
                    description,
                    hs_code: result.primary_hs_code,
                    hs_description: result.primary_description,
                    confidence: result.confidence,
                    reasoning: result.reasoning,
                    alternatives: result.alternatives,
                    edge_cases: result.edge_cases,
                  });
                }

                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      done: true,
                      result: response,
                    })}\n\n`
                  )
                );
              } catch {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      error: "Failed to parse response",
                    })}\n\n`
                  )
                );
              }
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Stream error occurred" })}\n\n`
            )
          );
        }

        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Classification error:", error);
    return new Response(
      JSON.stringify({ error: "Classification failed. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
