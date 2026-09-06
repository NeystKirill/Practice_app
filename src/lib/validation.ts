import { z } from "zod";

export const createWordSchema = z.object({
  term: z.string().trim().min(1, "Введите слово").max(200),
  translation: z.string().trim().max(500).optional().default(""),
  translationSource: z.enum(["user", "ai"]).optional().default("user"),
  note: z.string().trim().max(1000).optional().default(""),
});

export const updateWordSchema = z
  .object({
    term: z.string().trim().min(1).max(200),
    translation: z.string().trim().max(500),
    translationSource: z.enum(["user", "ai"]),
    note: z.string().trim().max(1000),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Нет полей для обновления");

export const gradeSchema = z.object({
  wordId: z.number().int().positive(),
  grade: z.number().int().min(0).max(5),
});

export const translateSchema = z.object({
  term: z.string().trim().min(1, "Введите слово").max(200),
});

export type CreateWordInput = z.infer<typeof createWordSchema>;
export type UpdateWordInput = z.infer<typeof updateWordSchema>;
export type GradeInput = z.infer<typeof gradeSchema>;
