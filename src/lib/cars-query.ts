import type { Prisma } from "@prisma/client";

export type CarSort =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "year_desc"
  | "year_asc"
  | "mileage_asc"
  | "mileage_desc";

export type CarsQuery = {
  page: number;
  limit: number;
  brand?: string;
  model?: string;
  q?: string;
  yearFrom?: number;
  yearTo?: number;
  priceFrom?: number;
  priceTo?: number;
  mileageFrom?: number;
  mileageTo?: number;
  sort: CarSort;
};

const SORT_VALUES: CarSort[] = [
  "newest",
  "price_asc",
  "price_desc",
  "year_desc",
  "year_asc",
  "mileage_asc",
  "mileage_desc",
];

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 60;

function takeString(
  source: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const value = source[key];
  if (Array.isArray(value)) {
    return value[0]?.trim() || undefined;
  }
  return value?.trim() || undefined;
}

function takeNumber(
  source: Record<string, string | string[] | undefined>,
  key: string
): number | undefined {
  const raw = takeString(source, key);
  if (!raw) {
    return undefined;
  }
  const normalized = raw.replace(/[^\d.-]/g, "");
  if (!normalized) {
    return undefined;
  }
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseCarsQuery(
  source: Record<string, string | string[] | undefined>
): CarsQuery {
  const rawPage = takeNumber(source, "page") ?? 1;
  const rawLimit = takeNumber(source, "limit") ?? DEFAULT_LIMIT;
  const rawSort = takeString(source, "sort");
  const sort = SORT_VALUES.includes(rawSort as CarSort)
    ? (rawSort as CarSort)
    : "newest";

  return {
    page: Math.max(1, rawPage),
    limit: Math.max(1, Math.min(MAX_LIMIT, rawLimit)),
    brand: takeString(source, "brand"),
    model: takeString(source, "model"),
    q: takeString(source, "q"),
    yearFrom: takeNumber(source, "yearFrom"),
    yearTo: takeNumber(source, "yearTo"),
    priceFrom: takeNumber(source, "priceFrom"),
    priceTo: takeNumber(source, "priceTo"),
    mileageFrom: takeNumber(source, "mileageFrom"),
    mileageTo: takeNumber(source, "mileageTo"),
    sort,
  };
}

export function buildCarsWhere(query: CarsQuery): Prisma.CarWhereInput {
  const where: Prisma.CarWhereInput = {};
  const andFilters: Prisma.CarWhereInput[] = [];

  if (query.brand) {
    andFilters.push({
      brand: {
        contains: query.brand,
        mode: "insensitive",
      },
    });
  }

  if (query.model) {
    andFilters.push({
      model: {
        contains: query.model,
        mode: "insensitive",
      },
    });
  }

  if (query.q) {
    andFilters.push({
      OR: [
        {
          title: {
            contains: query.q,
            mode: "insensitive",
          },
        },
        {
          brand: {
            contains: query.q,
            mode: "insensitive",
          },
        },
        {
          model: {
            contains: query.q,
            mode: "insensitive",
          },
        },
        {
          location: {
            contains: query.q,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  if (query.yearFrom !== undefined || query.yearTo !== undefined) {
    andFilters.push({
      year: {
        gte: query.yearFrom,
        lte: query.yearTo,
      },
    });
  }

  if (query.priceFrom !== undefined || query.priceTo !== undefined) {
    andFilters.push({
      totalPriceYen: {
        gte: query.priceFrom,
        lte: query.priceTo,
      },
    });
  }

  if (query.mileageFrom !== undefined || query.mileageTo !== undefined) {
    andFilters.push({
      mileageKm: {
        gte: query.mileageFrom,
        lte: query.mileageTo,
      },
    });
  }

  if (andFilters.length > 0) {
    where.AND = andFilters;
  }

  return where;
}

export function buildCarsOrderBy(
  query: CarsQuery
): Prisma.CarOrderByWithRelationInput[] {
  switch (query.sort) {
    case "price_asc":
      return [{ totalPriceYen: "asc" }, { scrapedAt: "desc" }];
    case "price_desc":
      return [{ totalPriceYen: "desc" }, { scrapedAt: "desc" }];
    case "year_asc":
      return [{ year: "asc" }, { scrapedAt: "desc" }];
    case "year_desc":
      return [{ year: "desc" }, { scrapedAt: "desc" }];
    case "mileage_asc":
      return [{ mileageKm: "asc" }, { scrapedAt: "desc" }];
    case "mileage_desc":
      return [{ mileageKm: "desc" }, { scrapedAt: "desc" }];
    case "newest":
    default:
      return [{ scrapedAt: "desc" }];
  }
}

export function serializeQuery(query: CarsQuery): URLSearchParams {
  const params = new URLSearchParams();
  params.set("page", String(query.page));
  params.set("limit", String(query.limit));
  params.set("sort", query.sort);

  if (query.brand) params.set("brand", query.brand);
  if (query.model) params.set("model", query.model);
  if (query.q) params.set("q", query.q);
  if (query.yearFrom !== undefined) params.set("yearFrom", String(query.yearFrom));
  if (query.yearTo !== undefined) params.set("yearTo", String(query.yearTo));
  if (query.priceFrom !== undefined) params.set("priceFrom", String(query.priceFrom));
  if (query.priceTo !== undefined) params.set("priceTo", String(query.priceTo));
  if (query.mileageFrom !== undefined) {
    params.set("mileageFrom", String(query.mileageFrom));
  }
  if (query.mileageTo !== undefined) {
    params.set("mileageTo", String(query.mileageTo));
  }

  return params;
}
