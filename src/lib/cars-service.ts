import { buildCarsOrderBy, buildCarsWhere, type CarsQuery } from "@/lib/cars-query";
import { prisma } from "@/lib/prisma";

type CarPhotoLite = {
  url: string;
};

type CarRecord = {
  id: string;
  sourceUrl: string;
  title: string;
  brand: string;
  model: string;
  year: number | null;
  mileageKm: number | null;
  totalPriceYen: number | null;
  vehiclePriceYen: number | null;
  color: string | null;
  fuelType: string | null;
  transmission: string | null;
  location: string | null;
  scrapedAt: Date;
  photos: CarPhotoLite[];
};

export type CarListItem = Pick<
  CarRecord,
  "id" |
  "sourceUrl" |
  "title" |
  "brand" |
  "model" |
  "year" |
  "mileageKm" |
  "totalPriceYen" |
  "vehiclePriceYen" |
  "color" |
  "fuelType" |
  "transmission" |
  "location" |
  "scrapedAt"
> & {
  coverPhoto: string | null;
};

export type CarsResult = {
  items: CarListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const RETRYABLE_DB_MESSAGE_PARTS = [
  "connection terminated unexpectedly",
  "can't reach database server",
  "server has closed the connection",
  "timed out fetching a new connection",
  "connection reset",
];

function isRetryableDbError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as { message?: string; code?: string };
  const message = maybeError.message?.toLowerCase() ?? "";

  if (maybeError.code === "P1001") {
    return true;
  }

  return RETRYABLE_DB_MESSAGE_PARTS.some((part) => message.includes(part));
}

async function withDbRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryableDbError(error) || attempt === retries) {
        throw error;
      }

      const backoffMs = 250 * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      attempt += 1;
    }
  }

  throw lastError;
}

function mapCarListItem(car: CarRecord): CarListItem {
  return {
    id: car.id,
    sourceUrl: car.sourceUrl,
    title: car.title,
    brand: car.brand,
    model: car.model,
    year: car.year,
    mileageKm: car.mileageKm,
    totalPriceYen: car.totalPriceYen,
    vehiclePriceYen: car.vehiclePriceYen,
    color: car.color,
    fuelType: car.fuelType,
    transmission: car.transmission,
    location: car.location,
    scrapedAt: car.scrapedAt,
    coverPhoto: car.photos[0]?.url ?? null,
  };
}

export async function queryCars(query: CarsQuery): Promise<CarsResult> {
  const where = buildCarsWhere(query);
  const orderBy = buildCarsOrderBy(query);
  const skip = (query.page - 1) * query.limit;

  const [total, cars] = await withDbRetry(async () =>
    Promise.all([
      prisma.car.count({ where }),
      prisma.car.findMany({
        where,
        orderBy,
        skip,
        take: query.limit,
        include: {
          photos: {
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
        },
      }),
    ])
  );

  const totalPages = Math.max(1, Math.ceil(total / query.limit));

  return {
    items: cars.map(mapCarListItem),
    total,
    page: query.page,
    limit: query.limit,
    totalPages,
  };
}

export async function getCarById(id: string) {
  return withDbRetry(() =>
    prisma.car.findUnique({
      where: { id },
      include: {
        photos: {
          orderBy: { sortOrder: "asc" },
        },
      },
    })
  );
}
