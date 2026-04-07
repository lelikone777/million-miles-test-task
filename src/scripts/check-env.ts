import dotenv from "dotenv";

dotenv.config({ override: true });

type CheckResult = {
  key: string;
  ok: boolean;
  note: string;
};

function hasValue(input: string | undefined): boolean {
  return Boolean(input && input.trim().length > 0);
}

function isPlaceholder(input: string | undefined): boolean {
  if (!input) return true;
  const value = input.trim().toLowerCase();
  return (
    value.includes("replace-with") ||
    value.includes("change-me") ||
    value === "your_value_here" ||
    value === "example"
  );
}

function validateProdSecret(key: string, value: string | undefined, minLength = 20): CheckResult {
  if (!hasValue(value)) {
    return { key, ok: false, note: "missing" };
  }
  if (isPlaceholder(value)) {
    return { key, ok: false, note: "placeholder value" };
  }
  if ((value ?? "").trim().length < minLength) {
    return { key, ok: false, note: `too short (<${minLength})` };
  }
  return { key, ok: true, note: "ok" };
}

function validateDatabaseUrl(value: string | undefined): CheckResult {
  const key = "DATABASE_URL";
  if (!hasValue(value)) {
    return { key, ok: false, note: "missing" };
  }
  const normalized = (value ?? "").toLowerCase();
  if (!(normalized.startsWith("postgres://") || normalized.startsWith("postgresql://"))) {
    return { key, ok: false, note: "must start with postgres:// or postgresql://" };
  }
  if (isPlaceholder(value)) {
    return { key, ok: false, note: "placeholder value" };
  }
  return { key, ok: true, note: "ok" };
}

async function main() {
  const strict = process.argv.includes("--production");
  const mode = strict ? "production" : "development";

  const results: CheckResult[] = [
    validateDatabaseUrl(process.env.DATABASE_URL),
    validateProdSecret("JWT_SECRET", process.env.JWT_SECRET, 24),
    validateProdSecret("CRON_SECRET", process.env.CRON_SECRET, 16),
    { key: "ADMIN_USERNAME", ok: hasValue(process.env.ADMIN_USERNAME), note: hasValue(process.env.ADMIN_USERNAME) ? "ok" : "missing" },
    { key: "ADMIN_PASSWORD", ok: hasValue(process.env.ADMIN_PASSWORD), note: hasValue(process.env.ADMIN_PASSWORD) ? "ok" : "missing" },
  ];

  if (strict && hasValue(process.env.OPENAI_API_KEY) && isPlaceholder(process.env.OPENAI_API_KEY)) {
    results.push({ key: "OPENAI_API_KEY", ok: false, note: "placeholder value" });
  }

  console.log(`[ENV CHECK] mode=${mode}`);
  for (const item of results) {
    console.log(`${item.ok ? "OK " : "ERR"} ${item.key}: ${item.note}`);
  }

  const hasErrors = results.some((item) => !item.ok);
  if (hasErrors && strict) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
