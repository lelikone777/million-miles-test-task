import "dotenv/config";

import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { containsJapanese, translateToRussianCached } from "../lib/scraper/translator";

type JsonObject = Record<string, unknown>;
type CarFieldKey =
  | "title"
  | "model"
  | "color"
  | "location"
  | "description"
  | "fuelType"
  | "transmission"
  | "bodyType"
  | "driveType"
  | "steering"
  | "inspectionExpiry"
  | "repairHistory";
type CarUpdateData = Prisma.CarUpdateInput & Record<string, unknown>;

const FIELD_CONTEXTS: Array<{ key: CarFieldKey; context: string }> = [
  { key: "title", context: "Заголовок объявления автомобиля" },
  { key: "model", context: "Модель и комплектация автомобиля" },
  { key: "color", context: "Цвет автомобиля" },
  { key: "location", context: "Локация автомобиля" },
  { key: "description", context: "Описание объявления автомобиля" },
  { key: "fuelType", context: "Тип топлива автомобиля" },
  { key: "transmission", context: "Коробка передач автомобиля" },
  { key: "bodyType", context: "Тип кузова автомобиля" },
  { key: "driveType", context: "Тип привода автомобиля" },
  { key: "steering", context: "Расположение руля автомобиля" },
  { key: "inspectionExpiry", context: "Срок техосмотра автомобиля" },
  { key: "repairHistory", context: "История ремонтов автомобиля" },
];

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function translateMaybe(value: string | null | undefined, context: string): Promise<string | null> {
  if (!value || !containsJapanese(value)) {
    return value ?? null;
  }

  const translated = await translateToRussianCached(value, context);
  return translated ?? value;
}

async function backfillOneCar(
  car: {
  id: string;
  sourceId: string;
  title: string;
  model: string;
  color: string | null;
  location: string | null;
  description: string | null;
  fuelType: string | null;
  transmission: string | null;
  bodyType: string | null;
  driveType: string | null;
  steering: string | null;
  inspectionExpiry: string | null;
  repairHistory: string | null;
  rawSpecs: Prisma.JsonValue | null;
},
  withSpecs: boolean
): Promise<boolean> {
  const updates: CarUpdateData = {};

  for (const { key, context } of FIELD_CONTEXTS) {
    const current = car[key];
    if (typeof current !== "string" || !containsJapanese(current)) {
      continue;
    }

    const translated = await translateMaybe(current, context);
    if (translated && translated !== current) {
      updates[key] = translated;
    }
  }

  if (withSpecs && isObject(car.rawSpecs) && isObject(car.rawSpecs.translated)) {
    const translatedSpecs = car.rawSpecs.translated as JsonObject;
    let translatedSpecsChanged = false;
    const normalizedSpecs: JsonObject = {};

    for (const [rawKey, rawValue] of Object.entries(translatedSpecs)) {
      const rawKeyNormalized = String(rawKey);
      const rawValueNormalized = String(rawValue ?? "");

      const [nextKey, nextValue] = await Promise.all([
        translateMaybe(rawKeyNormalized, "Название характеристики автомобиля"),
        translateMaybe(rawValueNormalized, `Значение характеристики "${rawKeyNormalized}"`),
      ]);

      const finalKey = nextKey ?? rawKeyNormalized;
      const finalValue = nextValue ?? rawValueNormalized;

      if (finalKey !== rawKeyNormalized || finalValue !== rawValueNormalized) {
        translatedSpecsChanged = true;
      }

      normalizedSpecs[finalKey] = finalValue;
    }

    if (translatedSpecsChanged) {
      updates.rawSpecs = {
        ...(car.rawSpecs as JsonObject),
        translated: normalizedSpecs,
      } as Prisma.InputJsonValue;
    }
  }

  if (Object.keys(updates).length === 0) {
    return false;
  }

  await prisma.car.update({
    where: { id: car.id },
    data: updates,
  });

  return true;
}

async function main() {
  const limitArg = Number.parseInt(process.env.BACKFILL_LIMIT ?? "0", 10);
  const limit = Number.isFinite(limitArg) && limitArg > 0 ? limitArg : undefined;
  const withSpecs = process.env.BACKFILL_WITH_SPECS === "1";
  const sourceIds = (process.env.BACKFILL_SOURCE_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const cars = await prisma.car.findMany({
    where: sourceIds.length > 0 ? { sourceId: { in: sourceIds } } : undefined,
    orderBy: { scrapedAt: "desc" },
    take: limit,
    select: {
      id: true,
      sourceId: true,
      title: true,
      model: true,
      color: true,
      location: true,
      description: true,
      fuelType: true,
      transmission: true,
      bodyType: true,
      driveType: true,
      steering: true,
      inspectionExpiry: true,
      repairHistory: true,
      rawSpecs: true,
    },
  });

  let updated = 0;
  for (const car of cars) {
    const changed = await backfillOneCar(car, withSpecs);
    if (changed) {
      updated += 1;
      console.log(`[BACKFILL-RU] updated ${car.sourceId}`);
    }
  }

  console.log(
    `[BACKFILL-RU] complete: checked=${cars.length} updated=${updated} unchanged=${cars.length - updated}`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
