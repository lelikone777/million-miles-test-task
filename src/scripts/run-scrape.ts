import "dotenv/config";

import { prisma } from "../lib/prisma";
import { runCarSensorScrape } from "../lib/scraper";

async function main() {
  const maxPages = Number.parseInt(process.env.SCRAPE_MAX_PAGES ?? "1", 10);
  const maxCars = Number.parseInt(process.env.SCRAPE_MAX_CARS ?? "25", 10);

  const result = await runCarSensorScrape({
    maxPages: Number.isFinite(maxPages) ? maxPages : 1,
    maxCars: Number.isFinite(maxCars) ? maxCars : 25,
    debug: true,
  });

  console.log(result);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
