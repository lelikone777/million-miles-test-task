const DEFAULT_SITE_URL = "https://million-miles-test-task.vercel.app";

export function getSiteUrl(): string {
  const candidate = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;

  if (!candidate) {
    return DEFAULT_SITE_URL;
  }

  try {
    return new URL(candidate).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

