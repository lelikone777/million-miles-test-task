import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { SiteLogo } from "@/components/site-logo";
import { getAuthFromCookies } from "@/lib/auth";

export default async function LoginPage() {
  const auth = await getAuthFromCookies();
  if (auth) {
    redirect("/cars");
  }

  return (
    <main className="flex-1 py-10 sm:py-16">
      <div className="page-shell grid gap-6 md:grid-cols-[1.2fr_1fr] items-center">
        <section className="glass-panel p-7 sm:p-10">
          <SiteLogo href="/login" className="mb-6" />
          <p className="text-xs uppercase tracking-[0.16em] muted">Пайплайн CarSensor</p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3 leading-tight">
            Японские авто из парсинга.
            <br />
            Готово к просмотру.
          </h2>
          <p className="muted mt-4 max-w-[52ch]">
            Воркер каждый час собирает объявления с CarSensor, нормализует японские
            поля через словарь и сохраняет очищенные данные в PostgreSQL.
          </p>
        </section>

        <LoginForm />
      </div>
    </main>
  );
}
