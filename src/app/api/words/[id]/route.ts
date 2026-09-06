import { isResponse, jsonError, parseBody } from "@/lib/http";
import { updateWordSchema } from "@/lib/validation";
import { DuplicateTermError, deleteWord, updateWord } from "@/lib/words";

export const dynamic = "force-dynamic";

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  req: Request,
  ctx: RouteContext<"/api/words/[id]">,
) {
  const id = parseId((await ctx.params).id);
  if (id === null) return jsonError("Некорректный id", 400);

  try {
    const patch = await parseBody(req, updateWordSchema);
    const word = updateWord(id, patch);
    if (!word) return jsonError("Слово не найдено", 404);
    return Response.json({ word });
  } catch (err) {
    if (isResponse(err)) return err;
    if (err instanceof DuplicateTermError) return jsonError(err.message, 409);
    console.error(err);
    return jsonError("Не удалось обновить слово", 500);
  }
}

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/words/[id]">,
) {
  const id = parseId((await ctx.params).id);
  if (id === null) return jsonError("Некорректный id", 400);

  const ok = deleteWord(id);
  if (!ok) return jsonError("Слово не найдено", 404);
  return Response.json({ ok: true });
}
