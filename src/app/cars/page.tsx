import Image from "next/image";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { SiteLogo } from "@/components/site-logo";
import { ThemeTabs } from "@/components/theme-tabs";
import { requireWebAuth } from "@/lib/auth";
import { parseCarsQuery, serializeQuery, type CarsQuery } from "@/lib/cars-query";
import { queryCars } from "@/lib/cars-service";
import { formatDate, formatKm, formatYen } from "@/lib/format";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const SORT_OPTIONS: Array<{ value: CarsQuery["sort"]; label: string }> = [
  { value: "newest", label: "Сначала новые" },
  { value: "price_asc", label: "Цена: по возрастанию" },
  { value: "price_desc", label: "Цена: по убыванию" },
  { value: "year_desc", label: "Год: от новых к старым" },
  { value: "year_asc", label: "Год: от старых к новым" },
  { value: "mileage_asc", label: "Пробег: по возрастанию" },
  { value: "mileage_desc", label: "Пробег: по убыванию" },
];

function toInputValue(value: string | number | undefined): string {
  return value === undefined ? "" : String(value);
}

function buildPageHref(query: CarsQuery, targetPage: number): string {
  const params = serializeQuery({
    ...query,
    page: Math.max(1, targetPage),
  });
  return `/cars?${params.toString()}`;
}

function buildCardTitle(brand: string, model: string, year: number | null): string {
  const parts = [brand, model].filter(Boolean);
  if (year) {
    parts.push(`(${year})`);
  }
  return parts.join(" ");
}

export const dynamic = "force-dynamic";

export default async function CarsPage({ searchParams }: PageProps) {
  const auth = await requireWebAuth();
  const query = parseCarsQuery(await searchParams);
  const result = await queryCars(query);

  return (
    <main className="flex-1 py-5 sm:py-8">
      <div className="page-shell grid gap-5">
        <header className="glass-panel grid gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6">
          <div className="flex justify-start">
            <SiteLogo />
          </div>
          <div className="text-left sm:text-center">
            <p className="muted font-mono text-[0.68rem] uppercase tracking-[0.28em]">Каталог</p>
            <h1 className="mt-1 text-xl font-semibold italic tracking-[-0.03em] sm:text-2xl">Автомобили CarSensor</h1>
            <p className="muted mt-1 text-xs font-medium">
              Вы вошли как <b>{auth.username}</b>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <ThemeTabs />
            <span className="stat-chip">Авто: {result.total}</span>
            <span className="stat-chip">
              Страница {result.page}/{result.totalPages}
            </span>
            <LogoutButton />
          </div>
        </header>

        <section className="glass-panel p-5 sm:p-6">
          <form action="/cars" method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input
              className="input"
              name="q"
              placeholder="Поиск по названию/локации"
              defaultValue={toInputValue(query.q)}
            />
            <input
              className="input"
              name="brand"
              placeholder="Марка"
              defaultValue={toInputValue(query.brand)}
            />
            <input
              className="input"
              name="model"
              placeholder="Модель"
              defaultValue={toInputValue(query.model)}
            />
            <select name="sort" className="input default:h-[44px]" defaultValue={query.sort}>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <input
              className="input"
              name="yearFrom"
              placeholder="Год от"
              defaultValue={toInputValue(query.yearFrom)}
            />
            <input
              className="input"
              name="yearTo"
              placeholder="Год до"
              defaultValue={toInputValue(query.yearTo)}
            />
            <input
              className="input"
              name="priceFrom"
              placeholder="Цена от (JPY)"
              defaultValue={toInputValue(query.priceFrom)}
            />
            <input
              className="input"
              name="priceTo"
              placeholder="Цена до (JPY)"
              defaultValue={toInputValue(query.priceTo)}
            />

            <input
              className="input"
              name="mileageFrom"
              placeholder="Пробег от (км)"
              defaultValue={toInputValue(query.mileageFrom)}
            />
            <input
              className="input"
              name="mileageTo"
              placeholder="Пробег до (км)"
              defaultValue={toInputValue(query.mileageTo)}
            />
            <input
              className="input"
              name="limit"
              placeholder="Элементов на странице"
              defaultValue={toInputValue(query.limit)}
            />
            <div className="flex items-center gap-2">
              <button className="btn btn-primary" type="submit">
                Применить
              </button>
              <Link className="btn btn-secondary" href="/cars">
                Сбросить
              </Link>
            </div>
          </form>
        </section>

        <section className="grid gap-3">
          {result.items.length === 0 ? (
            <div className="glass-panel p-6">
              <h2 className="text-lg font-semibold">В базе пока нет автомобилей.</h2>
              <p className="muted mt-1 text-xs font-medium">
                Запустите `npm run scrape:once`, чтобы импортировать данные с CarSensor,
                затем обновите страницу.
              </p>
            </div>
          ) : null}

          {result.items.map((car) => {
            const cardTitle = buildCardTitle(car.brand, car.model, car.year);

            return (
              <article
                key={car.id}
                className="glass-panel grid gap-4 p-4 sm:grid-cols-[220px_1fr] sm:p-5"
              >
                <div className="h-[160px] overflow-hidden rounded-2xl bg-[var(--panel-soft)] sm:h-[150px]">
                  {car.coverPhoto ? (
                    <div className="relative h-full w-full">
                      <Image
                        src={car.coverPhoto}
                        alt={cardTitle}
                        fill
                        sizes="(max-width: 640px) 100vw, 220px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="muted grid h-full w-full place-items-center text-sm">
                      Нет фото
                    </div>
                  )}
                </div>

                <div className="grid gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="max-w-[70ch] text-lg font-semibold leading-snug">
                      {cardTitle}
                    </h3>
                    <span className="stat-chip">{formatDate(car.scrapedAt)}</span>
                  </div>

                  <div className="grid gap-1 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <p>
                      <span className="muted">Марка:</span> {car.brand}
                    </p>
                    <p>
                      <span className="muted">Модель:</span> {car.model}
                    </p>
                    <p>
                      <span className="muted">Год:</span> {car.year ?? "Н/Д"}
                    </p>
                    <p>
                      <span className="muted">Пробег:</span> {formatKm(car.mileageKm)}
                    </p>
                    <p>
                      <span className="muted">Цена (итог):</span> {formatYen(car.totalPriceYen)}
                    </p>
                    <p>
                      <span className="muted">Цвет:</span> {car.color ?? "Н/Д"}
                    </p>
                    <p>
                      <span className="muted">Топливо:</span> {car.fuelType ?? "Н/Д"}
                    </p>
                    <p>
                      <span className="muted">Локация:</span> {car.location ?? "Н/Д"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link className="btn btn-primary" href={`/cars/${car.id}`}>
                      Открыть карточку
                    </Link>
                    <a
                      className="btn btn-secondary"
                      href={car.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Источник
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <footer className="flex items-center justify-between gap-2 pb-4">
          <Link
            className={`btn btn-secondary ${query.page <= 1 ? "pointer-events-none opacity-50" : ""}`}
            href={buildPageHref(query, query.page - 1)}
          >
            Назад
          </Link>
          <p className="muted text-sm">
            Страница {result.page} из {result.totalPages}
          </p>
          <Link
            className={`btn btn-secondary ${query.page >= result.totalPages ? "pointer-events-none opacity-50" : ""}`}
            href={buildPageHref(query, query.page + 1)}
          >
            Вперед
          </Link>
        </footer>
      </div>
    </main>
  );
}
