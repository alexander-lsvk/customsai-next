import { auth } from "@clerk/nextjs/server";
import { getClassificationHistory } from "@/lib/credits";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const history = await getClassificationHistory(userId, limit, offset);

    return new Response(JSON.stringify({ history }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch history" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
