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

  const [total, cars] = await Promise.all([
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
  ]);

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
  return prisma.car.findUnique({
    where: { id },
    include: {
      photos: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}
