import "dotenv/config";

import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { runCarSensorScrape } from "../lib/scraper";

const schedule = process.env.SCRAPE_CRON ?? "0 * * * *";

async function executeScrape() {
  try {
    const result = await runCarSensorScrape({
      maxPages: Number.parseInt(process.env.SCRAPE_MAX_PAGES ?? "1", 10),
      maxCars: Number.parseInt(process.env.SCRAPE_MAX_CARS ?? "25", 10),
    });
    console.log(`[${new Date().toISOString()}] scrape complete`, result);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] scrape failed`, error);
  }
}

console.log(`Hourly scraper started. Cron expression: ${schedule}`);
void executeScrape();

cron.schedule(schedule, () => {
  void executeScrape();
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
