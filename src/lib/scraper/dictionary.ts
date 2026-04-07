const SPEC_KEY_DICTIONARY: Record<string, string> = {
  "\u5e74\u5f0f(\u521d\u5ea6\u767b\u9332\u5e74)": "year",
  "\u8d70\u884c\u8ddd\u96e2": "mileage",
  "\u4fee\u5fa9\u6b74": "repair_history",
  "\u8eca\u691c": "inspection",
  "\u652f\u6255\u7dcf\u984d\uff08\u7a0e\u8fbc\uff09": "total_price",
  "\u203b\u5185\uff1a\u8eca\u4e21\u672c\u4f53\u4fa1\u683c": "vehicle_price",
  "\u8272": "color",
  "\u6392\u6c17\u91cf": "engine_displacement",
  "\u30a8\u30f3\u30b8\u30f3\u7a2e\u5225": "fuel_type",
  "\u30dc\u30c7\u30a3\u30bf\u30a4\u30d7": "body_type",
  "\u99c6\u52d5\u65b9\u5f0f": "drive_type",
  "\u30df\u30c3\u30b7\u30e7\u30f3": "transmission",
  "\u30cf\u30f3\u30c9\u30eb": "steering",
  "\u5730\u57df": "location",
  "\u4fdd\u8a3c": "warranty",
  "\u6cd5\u5b9a\u6574\u5099": "legal_maintenance",
};

const BRAND_DICTIONARY: Record<string, string> = {
  "\u30c8\u30e8\u30bf": "Тойота",
  "\u65e5\u7523": "Ниссан",
  "\u30db\u30f3\u30c0": "Хонда",
  "\u30c0\u30a4\u30cf\u30c4": "Дайхатсу",
  "\u30ec\u30af\u30b5\u30b9": "Лексус",
  "\u30b9\u30ba\u30ad": "Сузуки",
  "\u30de\u30c4\u30c0": "Мазда",
  "\u30b9\u30d0\u30eb": "Субару",
  "\u4e09\u83f1": "Мицубиси",
  "\u3044\u3059\u309e": "Исузу",
  "\uff22\uff2d\uff37": "BMW",
  BMW: "BMW",
  "\u30e1\u30eb\u30bb\u30c7\u30b9\u30fb\u30d9\u30f3\u30c4": "Mercedes-Benz",
  "\u30d5\u30a9\u30eb\u30af\u30b9\u30ef\u30fc\u30b2\u30f3": "Volkswagen",
  "\u30a2\u30a6\u30c7\u30a3": "Audi",
  "\u30dc\u30eb\u30dc": "Volvo",
  "\u30df\u30cb": "MINI",
  "\u30b8\u30fc\u30d7": "Jeep",
  "\u30eb\u30ce\u30fc": "Renault",
  "\u30d7\u30b8\u30e7\u30fc": "Peugeot",
  "\u30a2\u30eb\u30d5\u30a1": "Alfa Romeo",
  "\u30a2\u30eb\u30d5\u30a1\u30ed\u30e1\u30aa": "Alfa Romeo",
  "\u30dd\u30eb\u30b7\u30a7": "Porsche",
  "\u30d5\u30a3\u30a2\u30c3\u30c8": "Fiat",
  "\u30b7\u30c8\u30ed\u30a8\u30f3": "Citroen",
  "\u30b7\u30dc\u30ec\u30fc": "Chevrolet",
  "\u30d5\u30a9\u30fc\u30c9": "Ford",
  "\u30c6\u30b9\u30e9": "Tesla",
};

const VALUE_DICTIONARY: Record<string, string> = {
  "\u306a\u3057": "нет",
  "\u3042\u308a": "есть",
  "\u7121": "нет",
  "\u6709": "есть",
  "\u4ed8\u304d": "есть",
  "\u30cf\u30a4\u30d6\u30ea\u30c3\u30c9": "гибрид",
  "\u30ac\u30bd\u30ea\u30f3": "бензин",
  "\u8efd\u6cb9": "дизель",
  "\u96fb\u6c17": "электро",
  "\u30d6\u30e9\u30c3\u30af": "черный",
  "\u30db\u30ef\u30a4\u30c8": "белый",
  "\u30b7\u30eb\u30d0\u30fc": "серебристый",
  "\u30ec\u30c3\u30c9": "красный",
  "\u30d6\u30eb\u30fc": "синий",
  "\u30b0\u30ec\u30fc": "серый",
  "\u30d6\u30e9\u30a6\u30f3": "коричневый",
  "\u30d1\u30fc\u30eb": "перламутр",
  CVT: "вариатор",
  AT: "автомат",
  MT: "механика",
  "2WD": "передний/задний привод",
  "4WD": "полный привод",
  "\u53f3": "правый",
  "\u5de6": "левый",
  "\u30b7\u30ea\u30fc\u30ba": "серия",
  "\u30ab\u30b9\u30bf\u30e0": "кастом",
  "\u30bf\u30fc\u30dc": "турбо",
  "\u30af\u30eb\u30fc\u30ba": "круиз",
  "\u30ca\u30d3": "навигация",
  "\u30d0\u30c3\u30af\u30ab\u30e1\u30e9": "камера заднего вида",
  "\u30b9\u30de\u30fc\u30c8\u30ad\u30fc": "смарт-ключ",
  "\u4e21\u5074\u96fb\u52d5\u30b9\u30e9\u30a4\u30c9\u30c9\u30a2": "две электросдвижные двери",
  "\u885d\u7a81\u88ab\u5bb3\u8efd\u6e1b": "система предотвращения столкновений",
  "\u7981\u7159\u8eca": "без курения",
  "\u7d14\u6b63": "оригинальный",
  "LED\u30d8\u30c3\u30c9\u30e9\u30a4\u30c8": "LED-фары",
};

const RUSSIAN_FALLBACK_DICTIONARY: Record<string, string> = {
  none: "нет",
  exists: "есть",
  hybrid: "гибрид",
  petrol: "бензин",
  diesel: "дизель",
  electric: "электро",
  black: "черный",
  white: "белый",
  silver: "серебристый",
  red: "красный",
  blue: "синий",
  gray: "серый",
  brown: "коричневый",
  pearl: "перламутр",
  automatic_cvt: "вариатор",
  automatic: "автомат",
  manual: "механика",
  "2wd": "передний/задний привод",
  "4wd": "полный привод",
  right: "правый",
  left: "левый",
};

function replaceFromDictionary(
  source: string,
  dictionary: Record<string, string>
): string {
  const entries = Object.entries(dictionary).sort((a, b) => b[0].length - a[0].length);
  let result = source;

  for (const [from, to] of entries) {
    result = result.replaceAll(from, to);
  }

  return result;
}

export function translateSpecKey(japaneseKey: string): string {
  return SPEC_KEY_DICTIONARY[japaneseKey] ?? japaneseKey;
}

export function translateValue(rawValue: string): string {
  const trimmed = rawValue.trim();
  const jpToRu = replaceFromDictionary(trimmed, VALUE_DICTIONARY);
  return replaceFromDictionary(jpToRu, RUSSIAN_FALLBACK_DICTIONARY);
}

export function translateBrand(rawBrand: string): string {
  const normalized = rawBrand.trim();
  if (!normalized) {
    return normalized;
  }

  return BRAND_DICTIONARY[normalized] ?? normalized;
}

export function translateFreeText(rawText: string): string {
  const step1 = replaceFromDictionary(rawText.trim(), BRAND_DICTIONARY);
  const step2 = replaceFromDictionary(step1, VALUE_DICTIONARY);
  return replaceFromDictionary(step2, RUSSIAN_FALLBACK_DICTIONARY);
}
