import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default async function HeroSection() {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <div className="border-4 border-amber-200">
      <h1 className="text-4xl font-bold">Startseite</h1>
      {!user && (
        <h2 className="text-3xl font-bold">
          Logge dich ein um auf alle Funktionen zugreifen zu können
        </h2>
      )}
    </div>
  );
}
