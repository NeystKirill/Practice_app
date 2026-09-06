import { stats } from "@/lib/words";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ stats: stats() });
}
