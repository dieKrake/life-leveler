// src/components/SWRProvider.tsx
"use client";

import { SWRConfig } from "swr";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function SWRProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = createClientComponentClient();

  return (
    <SWRConfig
      value={{
        fetcher: async (url: string) => {
          const res = await fetch(url);
          if (!res.ok) {
            const error: any = new Error(
              "Ein Fehler ist beim Laden der Daten aufgetreten."
            );
            error.info = await res.json();
            error.status = res.status;
            throw error;
          }
          return res.json();
        },
        onError: async (error, key) => {
          if (error.status === 401) {
            await supabase.auth.signOut();

            window.location.href = "/login";
          }
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
