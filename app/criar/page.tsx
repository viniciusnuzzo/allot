import { redirect } from "next/navigation";
import { requireAccount } from "@/app/lib/supabase-server";

export default async function CreatePage() {
  await requireAccount();
  redirect("/teams");
}
