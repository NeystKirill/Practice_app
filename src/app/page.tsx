import { ButtonLink } from "@/components/ui";
import { stats } from "@/lib/words";

export const dynamic = "force-dynamic";

function plural(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

export default function HomePage() {
  const s = stats();

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <p className="text-sm text-muted">Тренажёр английских слов</p>

        {s.total === 0 ? (
          <h1 className="font-serif text-3xl leading-snug sm:text-4xl">
            Словарь пуст.
            <br />
            Добавьте первые карточки.
          </h1>
        ) : s.due > 0 ? (
          <h1 className="font-serif text-3xl leading-snug sm:text-4xl">
            <span className="text-accent tabular-nums">{s.due}</span>{" "}
            {plural(s.due, ["карточка ждёт", "карточки ждут", "карточек ждут"])}{" "}
            повторения
          </h1>
        ) : (
          <h1 className="font-serif text-3xl leading-snug sm:text-4xl">
            На сегодня всё повторено.
          </h1>
        )}

        <div className="flex flex-wrap gap-2.5">
          {s.total === 0 ? (
            <ButtonLink href="/words">Добавить карточки</ButtonLink>
          ) : (
            <>
              <ButtonLink
                href="/review"
                variant={s.due > 0 ? "primary" : "secondary"}
              >
                {s.due > 0 ? "Начать повторение" : "Повторение"}
              </ButtonLink>
              <ButtonLink href="/words" variant="secondary">
                Словарь
              </ButtonLink>
            </>
          )}
        </div>
      </section>

      {s.total > 0 && (
        <section className="border-t border-border pt-6">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <Metric label="Всего карточек" value={s.total} />
            <Metric label="Из них предложений" value={s.phrases} />
            <Metric label="Новых, ещё не повторяли" value={s.fresh} />
            <Metric label="Выучено" value={s.learned} accent />
            <Metric label="Повторено сегодня" value={s.reviewedToday} />
          </dl>
        </section>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div>
      <dd
        className={`font-serif text-2xl tabular-nums ${
          accent ? "text-success" : ""
        }`}
      >
        {value}
      </dd>
      <dt className="mt-0.5 text-xs leading-tight text-muted">{label}</dt>
    </div>
  );
}
