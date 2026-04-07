"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onLogout() {
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      startTransition(() => {
        router.push("/login");
        router.refresh();
      });
      setPending(false);
    }
  }

  return (
    <button className="btn btn-secondary" onClick={onLogout} disabled={pending}>
      {pending ? "Выход..." : "Выйти"}
    </button>
  );
}
