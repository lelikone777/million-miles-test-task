import { redirect } from "next/navigation";
import { getAuthFromCookies } from "@/lib/auth";

export default async function Home() {
  const auth = await getAuthFromCookies();
  redirect(auth ? "/cars" : "/login");
}
