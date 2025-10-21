import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import HeroSection from "@/components/HeroSection";

export default async function Home() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({
    cookies: () => cookieStore,
  });

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
