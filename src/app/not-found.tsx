import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1 grid place-items-center py-16">
      <div className="glass-panel p-8 text-center">
        <h1 className="text-2xl font-bold">Не найдено</h1>
        <p className="muted mt-3">
          Запрошенный автомобиль отсутствует в текущей базе данных.
        </p>
        <Link href="/cars" className="btn btn-primary mt-5">
          Вернуться в каталог
        </Link>
      </div>
    </main>
  );
}
