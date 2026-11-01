import { NextResponse } from "next/server";
import { getServerEnvironment } from "@/lib/server-supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = await getServerEnvironment();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || url.includes("your_supabase")) {
    return NextResponse.json(
      { error: "Account sign-in is not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { url, anonKey },
    { headers: { "Cache-Control": "no-store" } }
  );
}
