import { getPublicBusinessSettings } from "@/lib/server/public-business-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ settings: await getPublicBusinessSettings() });
}
