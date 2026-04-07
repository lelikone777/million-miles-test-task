import {
  translateBrand,
  translateFreeText,
  translateSpecKey,
  translateValue,
} from "@/lib/scraper/dictionary";

export function normalizeText(input: string | null | undefined): string {
  return (input ?? "").replace(/\s+/g, " ").trim();
}

export function parseJapanesePriceToYen(raw: string | null | undefined): number | null {
  const text = normalizeText(raw);
  if (!text) {
    return null;
  }

  const manMatch = text.match(/([\d.,]+)\s*\u4e07/);
  if (manMatch) {
    const value = Number.parseFloat(manMatch[1].replace(/,/g, ""));
    if (Number.isFinite(value)) {
      return Math.round(value * 10000);
    }
  }

  const yenMatch = text.match(/([\d,]+)\s*\u5186/);
  if (yenMatch) {
    const value = Number.parseInt(yenMatch[1].replace(/,/g, ""), 10);
    return Number.isFinite(value) ? value : null;
  }

  return null;
}

export function parseJapaneseMileageToKm(raw: string | null | undefined): number | null {
  const text = normalizeText(raw);
  if (!text) {
    return null;
  }

  const manKmMatch = text.match(/([\d.,]+)\s*\u4e07\s*km/i);
  if (manKmMatch) {
    const value = Number.parseFloat(manKmMatch[1].replace(/,/g, ""));
    if (Number.isFinite(value)) {
      return Math.round(value * 10000);
    }
  }

  const kmMatch = text.match(/([\d,]+)\s*km/i);
  if (kmMatch) {
    const value = Number.parseInt(kmMatch[1].replace(/,/g, ""), 10);
    return Number.isFinite(value) ? value : null;
  }

  return null;
}

export function parseYear(raw: string | null | undefined): number | null {
  const text = normalizeText(raw);
  if (!text) {
    return null;
  }

  const match = text.match(/(19|20)\d{2}/);
  if (!match) {
    return null;
  }

  const year = Number.parseInt(match[0], 10);
  return Number.isFinite(year) ? year : null;
}

export function parseCc(raw: string | null | undefined): number | null {
  const text = normalizeText(raw);
  if (!text) {
    return null;
  }

  const match = text.match(/([\d,]+)\s*cc/i);
  if (!match) {
    return null;
  }

  const cc = Number.parseInt(match[1].replace(/,/g, ""), 10);
  return Number.isFinite(cc) ? cc : null;
}

export function extractSourceIdFromUrl(url: string): string {
  const match = url.match(/\/detail\/([^/]+)\//);
  if (match?.[1]) {
    return match[1];
  }

  return Buffer.from(url).toString("base64").slice(0, 32);
}

export function splitBrandModel(title: string): { brand: string; model: string } {
  const normalized = normalizeText(title);
  if (!normalized) {
    return { brand: "Неизвестно", model: "Неизвестно" };
  }

  const [rawBrand, ...rest] = normalized.split(" ");
  if (!rest.length) {
    return {
      brand: translateBrand(rawBrand),
      model: rawBrand,
    };
  }

  const rawModel = rest.join(" ");
  const modelPart = rawModel.split("\u3000")[0]?.trim() || rawModel;

  return {
    brand: translateBrand(rawBrand),
    model: modelPart,
  };
}

export function normalizeSpecs(rawSpecs: Record<string, string>) {
  const translated: Record<string, string> = {};

  for (const [jpKey, jpValue] of Object.entries(rawSpecs)) {
    const key = translateSpecKey(jpKey);
    translated[key] = translateValue(normalizeText(jpValue));
  }

  return translated;
}

export function translateDisplayText(input: string): string {
  return translateFreeText(normalizeText(input));
}
