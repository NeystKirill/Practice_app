import { z } from "zod";

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function parseBody<T>(
  req: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw jsonError("Ожидался JSON в теле запроса", 400);
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const msg = result.error.issues.map((i) => i.message).join("; ");
    throw jsonError(msg || "Некорректные данные", 422);
  }
  return result.data;
}

export function isResponse(x: unknown): x is Response {
  return x instanceof Response;
}
