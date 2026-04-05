import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HeroSection from "@/components/HeroSection";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If user is authenticated, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  // If not authenticated, show landing page
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)]">
      <HeroSection />
    </main>
  );
}
