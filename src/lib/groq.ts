import "server-only";
import type { TranslationResult } from "./types";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export class GroqError extends Error {
  constructor(
    message: string,
    readonly status = 500,
  ) {
    super(message);
    this.name = "GroqError";
  }
}

const SYSTEM_PROMPT = `Ты — англо-русский словарь. Пользователь присылает английское слово или фразу.
Верни СТРОГО JSON без markdown:
{
  "translation": "перевод на русский, до 3 самых частых значений через запятую",
  "transcription": "IPA-транскрипция в квадратных скобках или null",
  "part_of_speech": "часть речи по-русски (существительное, глагол, ...) или null"
}
Только перевод, ничего не выдумывай, никаких пояснений вне JSON.`;

export async function translateTerm(term: string): Promise<TranslationResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new GroqError(
      "GROQ_API_KEY не задан. Добавьте ключ в .env.local и перезапустите сервер.",
      503,
    );
  }

  let res: Response;
  try {
    res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || DEFAULT_MODEL,
        temperature: 0.2,
        max_tokens: 300,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: term },
        ],
      }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (err) {
    throw new GroqError(
      err instanceof Error && err.name === "TimeoutError"
        ? "Groq не ответил за 20 секунд"
        : "Не удалось связаться с Groq API",
      502,
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GroqError(
      `Groq API вернул ${res.status}: ${body.slice(0, 200)}`,
      res.status === 401 ? 401 : 502,
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new GroqError("Пустой ответ от Groq", 502);

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new GroqError("Groq вернул невалидный JSON", 502);
  }

  const translation = String(parsed.translation ?? "").trim();
  if (!translation) throw new GroqError("Groq не вернул перевод", 502);

  const clean = (v: unknown): string | null => {
    const s = typeof v === "string" ? v.trim() : "";
    return s && s.toLowerCase() !== "null" ? s : null;
  };

  return {
    translation,
    transcription: clean(parsed.transcription),
    partOfSpeech: clean(parsed.part_of_speech),
  };
}
