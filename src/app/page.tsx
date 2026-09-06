import Link from "next/link";
import { stats } from "@/lib/words";

export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1 text-sm text-muted">{label}</div>
    </div>
  );
}

export default function HomePage() {
  const s = stats();

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Обзор</h1>
        <p className="mt-1 text-sm text-muted">
          Интервальные повторения по алгоритму SM-2.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Всего слов" value={s.total} />
        <Stat label="К повторению сейчас" value={s.due} />
        <Stat label="Новых" value={s.fresh} />
        <Stat label="Предложений" value={s.phrases} />
        <Stat label="Выучено (интервал ≥ 21 дн.)" value={s.learned} />
        <Stat label="Повторено сегодня" value={s.reviewedToday} />
      </section>

      <section className="flex flex-wrap gap-3">
        <Link
          href="/review"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {s.due > 0 ? `Повторять (${s.due})` : "Повторять"}
        </Link>
        <Link
          href="/words"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-card"
        >
          Добавить слова
        </Link>
      </section>

      {s.total === 0 && (
        <p className="text-sm text-muted">
          Словарь пуст. Откройте «Словарь» и добавьте первые слова — перевод
          можно ввести самому или запросить у ИИ.
        </p>
      )}
    </div>
  );
}
