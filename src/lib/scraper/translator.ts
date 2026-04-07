import { createHash } from "node:crypto";
import { config } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { normalizeText, translateDisplayText } from "@/lib/scraper/normalize";

const JAPANESE_REGEX =
  /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\u31f0-\u31ff]/;
const TRANSLATE_TIMEOUT_MS = 15000;
let openAiIssueLogged = false;

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

type GoogleTranslateResponse = unknown[];

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function normalizeJapanesePunctuation(text: string): string {
  return text
    .replaceAll("・", " ")
    .replaceAll("／", "/")
    .replaceAll("（", "(")
    .replaceAll("）", ")")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractOutputText(json: OpenAIResponse): string | null {
  if (typeof json.output_text === "string" && json.output_text.trim()) {
    return json.output_text.trim();
  }

  if (!Array.isArray(json.output)) {
    return null;
  }

  const chunks: string[] = [];
  for (const block of json.output) {
    if (!Array.isArray(block.content)) {
      continue;
    }
    for (const content of block.content) {
      if (typeof content.text === "string" && content.text.trim()) {
        chunks.push(content.text.trim());
      }
    }
  }

  if (chunks.length === 0) {
    return null;
  }

  return chunks.join(" ").trim();
}

function cleanTranslation(text: string): string {
  return normalizeJapanesePunctuation(text.replace(/^["'`]+|["'`]+$/g, "").trim());
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TRANSLATE_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function translateViaGoogleFallback(sourceText: string): Promise<string | null> {
  try {
    const url = new URL("https://translate.googleapis.com/translate_a/single");
    url.searchParams.set("client", "gtx");
    url.searchParams.set("sl", "ja");
    url.searchParams.set("tl", "ru");
    url.searchParams.set("dt", "t");
    url.searchParams.set("q", sourceText);

    const response = await fetchWithTimeout(url.toString(), {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as GoogleTranslateResponse;
    if (!Array.isArray(json) || !Array.isArray(json[0])) {
      return null;
    }

    const first = json[0] as unknown[];
    const chunks = first
      .map((item) => {
        if (!Array.isArray(item)) return "";
        const part = item[0];
        return typeof part === "string" ? part : "";
      })
      .filter(Boolean);

    const combined = chunks.join("").trim();
    return combined ? cleanTranslation(combined) : null;
  } catch {
    return null;
  }
}

async function translateViaOpenAI(
  sourceText: string,
  contextHint: string
): Promise<string | null> {
  if (!config.openAiApiKey) {
    if (!openAiIssueLogged) {
      console.warn(
        "[TRANSLATE] OPENAI_API_KEY is missing. Falling back to dictionary translation."
      );
      openAiIssueLogged = true;
    }
    return null;
  }

  const response = await fetchWithTimeout("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: config.openAiTranslateModel,
      temperature: 0,
      max_output_tokens: 400,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "Ты переводчик японских автомобильных объявлений. Переводи на естественный русский язык без комментариев. Сохраняй числа, VIN-подобные коды, названия комплектаций и технические термины.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Контекст: ${contextHint}\nПереведи на русский:\n${sourceText}`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    if (!openAiIssueLogged) {
      const body = await response.text().catch(() => "");
      console.warn(
        `[TRANSLATE] OpenAI translation unavailable (${response.status}). Falling back to dictionary translation. ${body.slice(
          0,
          200
        )}`
      );
      openAiIssueLogged = true;
    }
    return null;
  }

  const json = (await response.json()) as OpenAIResponse;
  const translated = extractOutputText(json);
  if (!translated) {
    return null;
  }

  return cleanTranslation(translated);
}

export function containsJapanese(input: string | null | undefined): boolean {
  if (!input) {
    return false;
  }

  return JAPANESE_REGEX.test(input);
}

export async function translateToRussianCached(
  input: string | null | undefined,
  contextHint: string
): Promise<string | null> {
  const normalized = normalizeText(input);
  if (!normalized) {
    return null;
  }

  if (!containsJapanese(normalized)) {
    return normalized;
  }

  const sourceHash = sha256(normalized);
  const existing = await prisma.translationCache.findUnique({
    where: {
      sourceHash_targetLang: {
        sourceHash,
        targetLang: "ru",
      },
    },
  });

  if (existing?.translatedText) {
    const sanitizedCached = normalizeJapanesePunctuation(existing.translatedText);
    const hasJapaneseInCached = containsJapanese(sanitizedCached);
    if (!hasJapaneseInCached) {
      if (sanitizedCached !== existing.translatedText) {
        await prisma.translationCache.update({
          where: { id: existing.id },
          data: { translatedText: sanitizedCached },
        });
      }
      return sanitizedCached;
    }
  }

  const translatedFromAi = await translateViaOpenAI(normalized, contextHint);
  const translatedFromGoogle = translatedFromAi
    ? null
    : await translateViaGoogleFallback(normalized);
  const translated =
    translatedFromAi ?? translatedFromGoogle ?? translateDisplayText(normalized);

  if (!translated) {
    return normalizeJapanesePunctuation(normalized);
  }

  const sanitizedTranslated = normalizeJapanesePunctuation(translated);
  const safeToCache = !containsJapanese(sanitizedTranslated);
  if (safeToCache) {
    await prisma.translationCache.upsert({
      where: {
        sourceHash_targetLang: {
          sourceHash,
          targetLang: "ru",
        },
      },
      update: {
        sourceText: normalized,
        translatedText: sanitizedTranslated,
      },
      create: {
        sourceHash,
        sourceText: normalized,
        targetLang: "ru",
        translatedText: sanitizedTranslated,
      },
    });
  }

  return sanitizedTranslated;
}
