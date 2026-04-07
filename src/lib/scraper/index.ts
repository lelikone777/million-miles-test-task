import { chromium, type Page } from "playwright";
import { prisma } from "@/lib/prisma";
import {
  extractSourceIdFromUrl,
  normalizeText,
  normalizeSpecs,
  parseCc,
  parseJapaneseMileageToKm,
  parseJapanesePriceToYen,
  parseYear,
  splitBrandModel,
} from "@/lib/scraper/normalize";
import type { ScrapeOptions, ScrapeResult, ScrapedCar } from "@/lib/scraper/types";
import { translateToRussianCached } from "@/lib/scraper/translator";

const BASE_URL = "https://www.carsensor.net";

function buildListingUrl(pageNumber: number): string {
  return pageNumber === 1
    ? `${BASE_URL}/usedcar/`
    : `${BASE_URL}/usedcar/index${pageNumber}.html`;
}

function toAbsoluteUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return new URL(url, BASE_URL).toString();
}

async function collectDetailUrls(page: Page, listUrl: string): Promise<string[]> {
  await page.goto(listUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2500);

  const links = await page.$$eval("a[href*='/usedcar/detail/']", (anchors) =>
    anchors
      .map((anchor) => anchor.getAttribute("href") || "")
      .filter(Boolean)
      .map((href) => href.replace(/^https?:\/\/www\.carsensor\.net/i, ""))
  );

  return [...new Set(links)].map((href) =>
    href.startsWith("/") ? `https://www.carsensor.net${href}` : href
  );
}

async function scrapeDetail(page: Page, url: string): Promise<ScrapedCar | null> {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2500);

    const extracted = await page.evaluate(() => {
      const title = (document.querySelector("h1")?.textContent || "").replace(
        /\s+/g,
        " "
      );

      const description =
        document.querySelector("meta[name='description']")?.getAttribute("content")?.trim() ??
        null;

      const specs: Record<string, string> = {};
      document.querySelectorAll("table tr").forEach((row) => {
        const key = row.querySelector("th")?.textContent?.replace(/\s+/g, " ").trim();
        const value = row.querySelector("td")?.textContent?.replace(/\s+/g, " ").trim();

        if (key && value) {
          specs[key] = value;
        }
      });

      const photos = Array.from(document.querySelectorAll("img"))
        .map((img) => img.getAttribute("src") || "")
        .filter((src) => /CSphoto/i.test(src))
        .map((src) => (src.startsWith("//") ? `https:${src}` : src))
        .filter((src) => !/loading/i.test(src));

      return {
        title,
        description,
        specs,
        photos,
      };
    });

    const normalizedTitle = normalizeText(extracted.title);
    if (!normalizedTitle) {
      return null;
    }

    const sourceId = extractSourceIdFromUrl(url);
    const translatedSpecs = normalizeSpecs(extracted.specs);
    const { brand, model } = splitBrandModel(normalizedTitle);
    const uniquePhotos = [...new Set(extracted.photos.map(toAbsoluteUrl))];

    const rawLocation = normalizeText(translatedSpecs.location) || null;
    const rawColor = normalizeText(translatedSpecs.color) || null;
    const rawDescription = extracted.description ? normalizeText(extracted.description) : null;

    const [translatedTitle, translatedModel, translatedLocation, translatedColor, translatedDescription] =
      await Promise.all([
        translateToRussianCached(normalizedTitle, "Заголовок объявления авто"),
        translateToRussianCached(model, "Модель и комплектация авто"),
        translateToRussianCached(rawLocation, "Город/регион авто"),
        translateToRussianCached(rawColor, "Цвет автомобиля"),
        translateToRussianCached(rawDescription, "Описание объявления авто"),
      ]);

    return {
      sourceId,
      sourceUrl: url,
      title: translatedTitle ?? normalizedTitle,
      brand,
      model: translatedModel ?? model,
      year: parseYear(translatedSpecs.year),
      mileageKm: parseJapaneseMileageToKm(translatedSpecs.mileage),
      totalPriceYen: parseJapanesePriceToYen(translatedSpecs.total_price),
      vehiclePriceYen: parseJapanesePriceToYen(translatedSpecs.vehicle_price),
      color: translatedColor ?? rawColor,
      fuelType: normalizeText(translatedSpecs.fuel_type) || null,
      transmission: normalizeText(translatedSpecs.transmission) || null,
      bodyType: normalizeText(translatedSpecs.body_type) || null,
      driveType: normalizeText(translatedSpecs.drive_type) || null,
      steering: normalizeText(translatedSpecs.steering) || null,
      engineDisplacementCc: parseCc(translatedSpecs.engine_displacement),
      location: translatedLocation ?? rawLocation,
      inspectionExpiry: normalizeText(translatedSpecs.inspection) || null,
      repairHistory: normalizeText(translatedSpecs.repair_history) || null,
      description: translatedDescription ?? rawDescription,
      rawSpecs: extracted.specs,
      translatedSpecs,
      photos: uniquePhotos.slice(0, 40),
    };
  } catch {
    return null;
  }
}

async function upsertCar(car: ScrapedCar): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const upserted = await tx.car.upsert({
      where: { sourceId: car.sourceId },
      create: {
        source: "carsensor",
        sourceId: car.sourceId,
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
        bodyType: car.bodyType,
        driveType: car.driveType,
        steering: car.steering,
        engineDisplacementCc: car.engineDisplacementCc,
        location: car.location,
        inspectionExpiry: car.inspectionExpiry,
        repairHistory: car.repairHistory,
        description: car.description,
        rawSpecs: {
          jp: car.rawSpecs,
          translated: car.translatedSpecs,
        },
        scrapedAt: new Date(),
      },
      update: {
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
        bodyType: car.bodyType,
        driveType: car.driveType,
        steering: car.steering,
        engineDisplacementCc: car.engineDisplacementCc,
        location: car.location,
        inspectionExpiry: car.inspectionExpiry,
        repairHistory: car.repairHistory,
        description: car.description,
        rawSpecs: {
          jp: car.rawSpecs,
          translated: car.translatedSpecs,
        },
        scrapedAt: new Date(),
      },
    });

    await tx.carPhoto.deleteMany({ where: { carId: upserted.id } });

    if (car.photos.length > 0) {
      await tx.carPhoto.createMany({
        data: car.photos.map((photoUrl, index) => ({
          carId: upserted.id,
          url: photoUrl,
          sortOrder: index,
        })),
        skipDuplicates: true,
      });
    }
  });
}

export async function runCarSensorScrape(options: ScrapeOptions = {}): Promise<ScrapeResult> {
  const maxPages = Math.max(1, options.maxPages ?? 1);
  const maxCars = Math.max(1, options.maxCars ?? 25);

  const run = await prisma.scrapeRun.create({
    data: {
      status: "running",
    },
  });

  let pagesScanned = 0;
  let carsFound = 0;
  let carsUpserted = 0;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ locale: "ja-JP" });

  try {
    const collectedUrls = new Set<string>();

    for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
      const listUrl = buildListingUrl(pageNumber);
      const urls = await collectDetailUrls(page, listUrl);
      urls.forEach((detailUrl) => collectedUrls.add(detailUrl));

      pagesScanned += 1;
      if (collectedUrls.size >= maxCars) {
        break;
      }
    }

    const finalUrls = [...collectedUrls].slice(0, maxCars);
    carsFound = finalUrls.length;

    for (const detailUrl of finalUrls) {
      const car = await scrapeDetail(page, detailUrl);
      if (!car) {
        continue;
      }

      await upsertCar(car);
      carsUpserted += 1;

      if (options.debug) {
        console.log(`[SCRAPE] upserted: ${car.sourceId} ${car.brand} ${car.model}`);
      }
    }

    await prisma.scrapeRun.update({
      where: { id: run.id },
      data: {
        status: "completed",
        finishedAt: new Date(),
        pagesScanned,
        carsFound,
        carsUpserted,
      },
    });

    return {
      pagesScanned,
      carsFound,
      carsUpserted,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown scrape error";
    await prisma.scrapeRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        message,
        finishedAt: new Date(),
        pagesScanned,
        carsFound,
        carsUpserted,
      },
    });
    throw error;
  } finally {
    await page.close();
    await browser.close();
  }
}
