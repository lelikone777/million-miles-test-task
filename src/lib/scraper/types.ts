export type ScrapedCar = {
  sourceId: string;
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
  bodyType: string | null;
  driveType: string | null;
  steering: string | null;
  engineDisplacementCc: number | null;
  location: string | null;
  inspectionExpiry: string | null;
  repairHistory: string | null;
  description: string | null;
  rawSpecs: Record<string, string>;
  translatedSpecs: Record<string, string>;
  photos: string[];
};

export type ScrapeOptions = {
  maxPages?: number;
  maxCars?: number;
  debug?: boolean;
};

export type ScrapeResult = {
  pagesScanned: number;
  carsFound: number;
  carsUpserted: number;
};
