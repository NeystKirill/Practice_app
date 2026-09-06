import { isResponse, jsonError, parseBody } from "@/lib/http";
import { createWordSchema } from "@/lib/validation";
import { createWord, DuplicateTermError, listWords } from "@/lib/words";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? undefined;
  return Response.json({ words: listWords(q) });
}

export async function POST(req: Request) {
  try {
    const input = await parseBody(req, createWordSchema);
    const word = createWord(input);
    return Response.json({ word }, { status: 201 });
  } catch (err) {
    if (isResponse(err)) return err;
    if (err instanceof DuplicateTermError) return jsonError(err.message, 409);
    console.error(err);
    return jsonError("Не удалось сохранить слово", 500);
  }
}
