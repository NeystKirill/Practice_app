import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyReview,
  initialSrsState,
  isLearned,
  MIN_EASE_FACTOR,
} from "./srs.ts";

const NOW = 1_700_000_000_000;
const DAY = 86_400_000;

test("новое слово: первый успешный повтор даёт интервал 1 день", () => {
  const out = applyReview(initialSrsState(), 4, NOW);
  assert.equal(out.repetitions, 1);
  assert.equal(out.intervalDays, 1);
  assert.equal(out.dueAt, NOW + DAY);
});

test("второй успешный повтор даёт интервал 6 дней", () => {
  let s = applyReview(initialSrsState(), 4, NOW);
  s = applyReview(s, 4, NOW);
  assert.equal(s.repetitions, 2);
  assert.equal(s.intervalDays, 6);
});

test("третий повтор умножает интервал на фактор лёгкости", () => {
  let s = applyReview(initialSrsState(), 5, NOW);
  s = applyReview(s, 5, NOW);
  const third = applyReview(s, 5, NOW);
  assert.equal(third.repetitions, 3);
  assert.equal(third.intervalDays, Math.round(6 * third.easeFactor));
  assert.ok(third.intervalDays > 6);
});

test("ошибка (grade < 3) сбрасывает повторения и возвращает слово через 10 минут", () => {
  let s = applyReview(initialSrsState(), 5, NOW);
  s = applyReview(s, 5, NOW);
  const lapse = applyReview(s, 1, NOW);
  assert.equal(lapse.repetitions, 0);
  assert.equal(lapse.intervalDays, 0);
  assert.equal(lapse.dueAt, NOW + 10 * 60_000);
});

test("фактор лёгкости не опускается ниже минимума", () => {
  let s = initialSrsState();
  for (let i = 0; i < 10; i++) s = applyReview(s, 3, NOW);
  assert.ok(s.easeFactor >= MIN_EASE_FACTOR);
});

test("грейд 5 повышает фактор лёгкости, грейд 3 понижает", () => {
  assert.ok(applyReview(initialSrsState(), 5, NOW).easeFactor > 2.5);
  assert.ok(applyReview(initialSrsState(), 3, NOW).easeFactor < 2.5);
});

test("isLearned: порог 21 день", () => {
  assert.equal(isLearned(20), false);
  assert.equal(isLearned(21), true);
});
