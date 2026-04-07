export const config = {
  jwtSecret:
    process.env.JWT_SECRET ?? "dev-jwt-secret-change-me-for-production-use",
  cronSecret: process.env.CRON_SECRET ?? "dev-cron-secret",
  adminUsername: process.env.ADMIN_USERNAME ?? "admin",
  adminPassword: process.env.ADMIN_PASSWORD ?? "admin123",
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiTranslateModel: process.env.OPENAI_TRANSLATE_MODEL ?? "gpt-4.1-mini",
};
