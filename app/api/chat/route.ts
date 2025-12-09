import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { getHSCodesByHeading, formatHSCodesForPrompt } from "@/lib/hs-codes";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ClassificationContext {
  product_description: string;
  hs_code: string;
  hs_description: string;
  confidence: number;
  reasoning: string;
  alternatives?: Array<{
    hs_code: string;
    description: string;
    reason: string;
  }>;
  edge_cases?: Array<{
    condition: string;
    hs_code: string;
    description: string;
    explanation: string;
  }>;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const CHAT_SYSTEM_PROMPT_WITH_CONTEXT = `You are a helpful customs classification assistant specializing in Thailand AHTN 2022 HS codes. You have access to the classification result and can answer follow-up questions.

CONTEXT:
You've just helped classify a product. The user may ask:
- Why a specific code was chosen over alternatives
- About duty rates and import requirements
- For clarification on HS code categories
- About related codes or sub-categories
- General customs/import questions for Thailand

GUIDELINES:
- Be concise but thorough
- Reference specific HS codes when relevant
- If asked about a different HS heading, you can look it up
- For legal/compliance questions, recommend consulting a licensed customs broker
- Answer in the same language the user asks (Thai or English)
- Format HS codes as XXXX.XX.XX

AVAILABLE DATA:
- Classification result with reasoning
- Thailand AHTN 2022 HS code database (can query by heading)`;

const CHAT_SYSTEM_PROMPT_GENERAL = `You are a helpful customs classification assistant specializing in Thailand AHTN 2022 HS codes.

You can help users with:
- Understanding HS code structure and classification rules
- Explaining different chapters and headings
- General Rules of Interpretation (GRI)
- Thailand-specific tariff questions
- How to classify different types of products
- Duty rates and import requirements

GUIDELINES:
- Be concise but thorough
- Reference specific HS codes when relevant
- If the user mentions a specific heading (4-digit code), you can look up all codes under that heading
- For legal/compliance questions, recommend consulting a licensed customs broker
- Answer in the same language the user asks (Thai or English)
- Format HS codes as XXXX.XX.XX

AVAILABLE DATA:
- Thailand AHTN 2022 HS code database (can query by heading)`;

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const { userId } = await auth();
    const testMode = process.env.NODE_ENV === "development" && !userId;

    if (!userId && !testMode) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const {
      message,
      context,
      history = [],
    }: {
      message: string;
      context: ClassificationContext;
      history: ChatMessage[];
    } = body;

    if (!message || !context) {
      return new Response(
        JSON.stringify({ error: "Message and context are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Determine if this is a general inquiry or about a specific classification
    const isGeneralInquiry =
      context.hs_code === "general" || !context.product_description;

    // Build context string for classification-specific queries
    let classificationContext = "";
    if (!isGeneralInquiry) {
      classificationContext = `
CLASSIFICATION RESULT:
- Product: ${context.product_description}
- HS Code: ${context.hs_code}
- Description: ${context.hs_description}
- Confidence: ${Math.round(context.confidence * 100)}%
- Reasoning: ${context.reasoning}

${
  context.alternatives?.length
    ? `ALTERNATIVES CONSIDERED:
${context.alternatives
  .map((a) => `- ${a.hs_code}: ${a.description} (${a.reason})`)
  .join("\n")}`
    : ""
}

${
  context.edge_cases?.length
    ? `EDGE CASES:
${context.edge_cases.map((e) => `- ${e.hs_code}: ${e.condition}`).join("\n")}`
    : ""
}`;
    }

    // Check if user is asking about a specific heading - fetch those codes
    const headingMatch = message.match(/\b(\d{4})(?:\.\d{2})?(?:\.\d{2})?\b/);
    let additionalContext = "";

    if (headingMatch) {
      const heading = headingMatch[1];
      const codes = await getHSCodesByHeading(heading);
      if (codes.length > 0) {
        additionalContext = `\n\nRELATED HS CODES FOR HEADING ${heading}:\n${formatHSCodesForPrompt(
          codes
        )}`;
      }
    }

    // Build messages array with appropriate system prompt
    const systemPrompt = isGeneralInquiry
      ? CHAT_SYSTEM_PROMPT_GENERAL
      : CHAT_SYSTEM_PROMPT_WITH_CONTEXT + "\n" + classificationContext;

    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [
      {
        role: "system",
        content: systemPrompt + additionalContext,
      },
    ];

    // Add conversation history
    for (const msg of history.slice(-10)) {
      // Keep last 10 messages for context
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add current message
    messages.push({
      role: "user",
      content: message,
    });

    // Stream the response
    const stream = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages,
      reasoning_effort: "minimal",
      stream: true,
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              );
            }
          }
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
          );
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Stream error" })}\n\n`
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
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: "Chat failed. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
