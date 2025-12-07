import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { checkCredits, useCredit, saveClassification } from "@/lib/credits";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert in ASEAN Harmonized Tariff Nomenclature (AHTN) and HS Code classification. Your task is to analyze product descriptions and provide accurate HS codes for ASEAN customs.

When a user provides a product description, you must:

1. **Interpret the product**: If it's a brand name, slang, or unfamiliar term, USE WEB SEARCH to identify what it is
   - ALWAYS search the web for brand names or terms you're not 100% certain about
   - Use your search results to determine the actual product category
   - If still unsure after searching, classify based on the most common form of that product
2. **Extract ALL attributes from the description**: Look for any specified characteristics:
   - Size/dimensions (mini, small, large, measurements)
   - Form factor (keychain, pendant, charm, accessory, full-size, plush, etc.)
   - Material composition
   - Intended use/function
   - Condition (new, used, etc.)
3. **Classify based on EXACTLY what was described**:
   - The primary HS code MUST reflect ALL attributes mentioned in the description
   - If the user specifies a form factor, size, material, or purpose, that information MUST change the classification
   - A product with additional attributes WILL classify differently than the base product
4. **Explain your reasoning**: Reference the relevant HS chapter, heading, and classification rules
5. **Identify edge cases** (provide 3-5): Variations NOT already specified in the description that would change the classification
   - Consider: different materials, sizes, intended uses, forms, conditions
6. **Provide alternatives** (provide 3-5): Other possible HS codes if certain assumptions differ
   - Include codes for related product categories, different interpretations, or common misclassifications

CRITICAL FORM FACTOR RULES:
When a form factor is explicitly specified, it fundamentally changes the classification:
- "X keychain" / "X charm" / "X pendant" → Classify as the accessory/keychain article, NOT as X
  - Apply GRI 3(b): The keychain ring/attachment gives it the essential character of an accessory
  - Consider: 7117 (imitation jewellery), 7326 (metal articles), 3926 (plastic articles) based on material
- "X plush" / "X stuffed" → Classify as stuffed toy (9503.00.21 or similar)
- "X figurine" / "X figure" / "X statue" → Classify based on material and size (Chapter 39, 69, 83, 95)
- "mini X" / "small X" → Size may affect classification (e.g., miniature ornaments vs full-size items)

The form factor modifier is NOT just a description - it determines the PRIMARY classification.
Example: "toy keychain" is a KEYCHAIN (accessory), not a toy. The toy aspect is secondary.

CLASSIFICATION PRINCIPLES:
- Form factor modifiers CHANGE the base classification - they are not optional details
- Apply GRI (General Rules of Interpretation) correctly, especially GRI 3(b) for composite goods
- The item's primary function as used (keychain → holding keys, pendant → worn as jewelry) determines classification
- Edge cases should only cover UNSPECIFIED variations
- Do NOT list an edge case for something already specified in the description

IMPORTANT:
- Use ASEAN Harmonized Tariff Nomenclature (AHTN) codes
- Be specific about what conditions would trigger each alternative code
- Always explain WHY a particular code applies based on HS classification rules
- If you encounter an unknown brand name or term, ALWAYS use web search to look it up before classifying
- NEVER return 0% confidence or say you cannot classify - always make your best determination based on available information

Respond ONLY with valid JSON in this exact format:
{
  "interpreted_product": "What this product actually is, including all attributes from the description",
  "primary_hs_code": "XXXX.XX.XX",
  "primary_description": "Official HS code description",
  "confidence": 0.XX,
  "reasoning": "Detailed explanation of why this code was chosen, referencing HS chapters and rules",
  "edge_cases": [
    {
      "condition": "Description of when this applies (e.g., 'If the item is a keychain/small accessory under 10cm')",
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

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { description } = body;

    if (!description || typeof description !== "string") {
      return new Response(
        JSON.stringify({ error: "Description is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if user has credits
    const creditCheck = await checkCredits(userId);

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

    const stream = await openai.responses.create({
      model: "gpt-4o",
      instructions: SYSTEM_PROMPT,
      input: `Classify the following product for ASEAN customs:\n\nProduct: ${description}\n\nProvide the HS code classification with reasoning, edge cases, and alternatives. Respond ONLY with valid JSON, no other text.`,
      tools: [
        {
          type: "web_search_preview",
        },
      ],
      stream: true,
    });

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

                // Use credit and save classification
                await useCredit(userId);
                await saveClassification(userId, {
                  description,
                  hs_code: result.primary_hs_code,
                  hs_description: result.primary_description,
                  confidence: result.confidence,
                  reasoning: result.reasoning,
                  alternatives: result.alternatives,
                  edge_cases: result.edge_cases,
                });

                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ done: true, result: response })}\n\n`
                  )
                );
              } catch {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ error: "Failed to parse response" })}\n\n`
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
