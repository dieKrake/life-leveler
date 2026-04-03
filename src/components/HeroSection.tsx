"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";

export default function HeroSection() {
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoaded(true);
    });
  }, [supabase]);

  if (!loaded) return null;

  return (
    <div className="border-4 border-amber-200">
      <h1 className="text-4xl font-bold">{t("hero.homepage")}</h1>
      {!user && <h2 className="text-3xl font-bold">{t("hero.loginPrompt")}</h2>}
    </div>
  );
}
