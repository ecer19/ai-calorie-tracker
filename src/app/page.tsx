import AuthPanel from "@/components/AuthPanel";
import Dashboard from "@/components/Dashboard";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import type { Meal } from "@/lib/types";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen">
        <Header />
        <AuthPanel />
      </div>
    );
  }

  const { data: meals } = await supabase
    .from("meals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <Dashboard
      userId={user.id}
      userEmail={user.email ?? null}
      initialMeals={(meals as Meal[]) ?? []}
    />
  );
}
