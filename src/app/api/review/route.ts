import { isResponse, jsonError, parseBody } from "@/lib/http";
import type { Grade } from "@/lib/types";
import { gradeSchema } from "@/lib/validation";
import { dueQueue, gradeWord, stats } from "@/lib/words";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limitParam = Number(new URL(req.url).searchParams.get("limit"));
  const limit =
    Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(limitParam, 100)
      : 30;
  return Response.json({ queue: dueQueue(limit), stats: stats() });
}

export async function POST(req: Request) {
  try {
    const { wordId, grade } = await parseBody(req, gradeSchema);
    const word = gradeWord(wordId, grade as Grade);
    if (!word) return jsonError("Слово не найдено", 404);
    return Response.json({ word, stats: stats() });
  } catch (err) {
    if (isResponse(err)) return err;
    console.error(err);
    return jsonError("Не удалось сохранить результат", 500);
  }
}
