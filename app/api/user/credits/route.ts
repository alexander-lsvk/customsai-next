import { auth } from "@clerk/nextjs/server";
import { getUserCredits } from "@/lib/credits";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const credits = await getUserCredits(userId);

    if (!credits) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(credits), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching credits:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch credits" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
