"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? "Не удалось выполнить вход");
      }

      startTransition(() => {
        router.push("/cars");
        router.refresh();
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось выполнить вход";
      setError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="glass-panel p-6 sm:p-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.16em] muted">JWT-доступ</p>
        <h1 className="text-2xl font-bold mt-2">Вход в каталог автомобилей</h1>
        <p className="muted text-sm mt-2">
          Демо-доступ: <b>admin</b> / <b>admin123</b>
        </p>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-1 text-sm font-medium">
          Логин
          <input
            className="input"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Пароль
          <div className="relative">
            <input
              className="input pr-11"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-soft)] hover:bg-[var(--panel-soft)]"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              title={showPassword ? "Скрыть пароль" : "Показать пароль"}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path
                    d="M2.8 3.9 20.1 21.2M9.8 9.8a3.1 3.1 0 0 0 4.4 4.4M7.2 6.7A16.5 16.5 0 0 1 12 6c5.5 0 9.4 3.3 10.8 6-1 1.8-2.8 3.8-5.2 5M3.2 12c.7-1.2 1.8-2.7 3.4-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path
                    d="M1.8 12c1.4-2.7 5.3-6 10.2-6s8.8 3.3 10.2 6c-1.4 2.7-5.3 6-10.2 6S3.2 14.7 1.8 12Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="3.2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                </svg>
              )}
            </button>
          </div>
        </label>

        {error ? (
          <p className="text-sm text-red-700 bg-red-100 border border-red-300 rounded-xl px-3 py-2">
            {error}
          </p>
        ) : null}
      </div>

      <button type="submit" className="btn btn-primary w-full mt-6" disabled={pending}>
        {pending ? "Вход..." : "Войти"}
      </button>
    </form>
  );
}
