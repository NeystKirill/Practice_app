import { GroqError, translateTerm } from "@/lib/groq";
import { isResponse, jsonError, parseBody } from "@/lib/http";
import { translateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { term } = await parseBody(req, translateSchema);
    const result = await translateTerm(term);
    return Response.json(result);
  } catch (err) {
    if (isResponse(err)) return err;
    if (err instanceof GroqError) return jsonError(err.message, err.status);
    console.error(err);
    return jsonError("Ошибка перевода", 500);
  }
}
