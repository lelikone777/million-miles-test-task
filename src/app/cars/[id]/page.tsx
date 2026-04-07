import Link from "next/link";
import { notFound } from "next/navigation";
import { CarPhotoGallery } from "@/components/car-photo-gallery";
import { SiteLogo } from "@/components/site-logo";
import { requireWebAuth } from "@/lib/auth";
import { getCarById } from "@/lib/cars-service";
import { formatKm, formatYen } from "@/lib/format";
import { containsJapanese, translateToRussianCached } from "@/lib/scraper/translator";

type PageProps = {
  params: Promise<{ id: string }>;
};

type SpecItem = {
  key: string;
  value: string;
};

type CarPhotoItem = {
  id: string;
  url: string;
};

const EMPTY_VALUE = "Н/Д";

const SPEC_LABELS_RU: Record<string, string> = {
  year: "Год выпуска",
  mileage: "Пробег",
  repair_history: "Ремонт/ДТП",
  inspection: "Техосмотр",
  total_price: "Цена итоговая",
  vehicle_price: "Цена авто",
  color: "Цвет",
  engine_displacement: "Объем двигателя",
  fuel_type: "Тип топлива",
  body_type: "Тип кузова",
  drive_type: "Привод",
  transmission: "Коробка передач",
  steering: "Руль",
  location: "Локация",
  warranty: "Гарантия",
  legal_maintenance: "Предпродажное обслуживание",
};

function prettifyFallbackLabel(key: string): string {
  return key
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function extractSpecs(rawSpecs: unknown): SpecItem[] {
  if (!rawSpecs || typeof rawSpecs !== "object") {
    return [];
  }

  const translated = (rawSpecs as { translated?: unknown }).translated;
  if (translated && typeof translated === "object") {
    return Object.entries(translated as Record<string, unknown>)
      .map(([key, value]) => ({ key, value: String(value ?? "").trim() }))
      .filter((item) => item.value.length > 0);
  }

  const jpSpecs = (rawSpecs as { jp?: unknown }).jp;
  if (jpSpecs && typeof jpSpecs === "object") {
    return Object.entries(jpSpecs as Record<string, unknown>)
      .map(([key, value]) => ({ key, value: String(value ?? "").trim() }))
      .filter((item) => item.value.length > 0);
  }

  return [];
}

async function translateField(
  value: string | null | undefined,
  contextHint: string
): Promise<string | null> {
  if (!value) {
    return null;
  }
  return (await translateToRussianCached(value, contextHint)) ?? value;
}

async function localizeSpecLabel(key: string): Promise<string> {
  const knownLabel = SPEC_LABELS_RU[key];
  if (knownLabel) {
    return knownLabel;
  }

  if (!containsJapanese(key)) {
    return prettifyFallbackLabel(key);
  }

  const translated = await translateToRussianCached(key, "Название характеристики автомобиля");
  return translated ?? prettifyFallbackLabel(key);
}

async function localizeSpecs(rawSpecs: unknown): Promise<SpecItem[]> {
  const items = extractSpecs(rawSpecs);
  if (items.length === 0) {
    return [];
  }

  const localized = await Promise.all(
    items.map(async (item) => {
      const [key, value] = await Promise.all([
        localizeSpecLabel(item.key),
        translateField(item.value, `Значение характеристики "${item.key}"`),
      ]);

      return {
        key,
        value: value ?? item.value,
      };
    })
  );

  return localized.filter((item) => item.value.trim().length > 0);
}

export const dynamic = "force-dynamic";

export default async function CarDetailsPage({ params }: PageProps) {
  await requireWebAuth();
  const { id } = await params;
  const car = await getCarById(id);

  if (!car) {
    notFound();
  }

  const [
    localizedTitle,
    localizedModel,
    localizedColor,
    localizedFuelType,
    localizedTransmission,
    localizedLocation,
    localizedDescription,
    specs,
  ] = await Promise.all([
    translateField(car.title, "Заголовок объявления автомобиля"),
    translateField(car.model, "Модель и комплектация автомобиля"),
    translateField(car.color, "Цвет автомобиля"),
    translateField(car.fuelType, "Тип топлива автомобиля"),
    translateField(car.transmission, "Коробка передач автомобиля"),
    translateField(car.location, "Регион/город автомобиля"),
    translateField(car.description, "Описание объявления автомобиля"),
    localizeSpecs(car.rawSpecs),
  ]);

  const cardTitle = [car.brand, localizedModel ?? car.model, car.year ? `(${car.year})` : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="flex-1 py-5 sm:py-8">
      <div className="page-shell grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SiteLogo />
          <div className="flex flex-wrap gap-2">
          <Link href="/cars" className="btn btn-secondary">
            К списку
          </Link>
          <a className="btn btn-primary" href={car.sourceUrl} target="_blank" rel="noreferrer">
            Открыть на CarSensor
          </a>
          </div>
        </div>

        <header className="glass-panel p-5 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{cardTitle}</h1>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <p>
              <span className="muted">Марка:</span> {car.brand}
            </p>
            <p>
              <span className="muted">Модель:</span> {localizedModel ?? car.model ?? EMPTY_VALUE}
            </p>
            <p>
              <span className="muted">Год:</span> {car.year ?? EMPTY_VALUE}
            </p>
            <p>
              <span className="muted">Пробег:</span> {formatKm(car.mileageKm)}
            </p>
            <p>
              <span className="muted">Цена (итог):</span> {formatYen(car.totalPriceYen)}
            </p>
            <p>
              <span className="muted">Цена авто:</span> {formatYen(car.vehiclePriceYen)}
            </p>
            <p>
              <span className="muted">Цвет:</span> {localizedColor ?? EMPTY_VALUE}
            </p>
            <p>
              <span className="muted">Топливо:</span> {localizedFuelType ?? EMPTY_VALUE}
            </p>
            <p>
              <span className="muted">КПП:</span> {localizedTransmission ?? EMPTY_VALUE}
            </p>
            <p>
              <span className="muted">Локация:</span> {localizedLocation ?? EMPTY_VALUE}
            </p>
          </div>
          {localizedDescription ? <p className="muted mt-4 text-sm">{localizedDescription}</p> : null}
        </header>

        <section className="glass-panel p-5 sm:p-6">
          <h2 className="mb-4 text-xl font-semibold">Фотографии ({car.photos.length})</h2>
          <CarPhotoGallery
            photos={car.photos.map((photo: CarPhotoItem) => ({ id: photo.id, url: photo.url }))}
            alt={localizedTitle ?? cardTitle}
          />
        </section>

        <section className="glass-panel p-5 sm:p-6">
          <h2 className="mb-4 text-xl font-semibold">Характеристики</h2>
          {specs.length === 0 ? (
            <p className="muted">Детальные характеристики пока не собраны.</p>
          ) : (
            <div className="grid gap-2">
              {specs.map((spec) => (
                <div
                  key={`${spec.key}-${spec.value}`}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <p className="muted text-xs uppercase tracking-wider">{spec.key}</p>
                  <p className="mt-1">{spec.value}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
