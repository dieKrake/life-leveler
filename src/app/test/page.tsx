// app/test/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useState, useEffect } from "react";

export default function TestPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  // NEU: State, um zu prüfen, ob wir im Browser sind
  const [isClient, setIsClient] = useState(false);

  // NEU: Dieser Effekt läuft nur einmal im Browser, nachdem die Seite geladen ist
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8">
      <h1 className="text-3xl font-bold">Isolations-Test</h1>

      <div>
        <h2 className="text-xl mb-2">Test 1: Button-Komponente</h2>
        <p>Wird dieser Button korrekt und ohne Fehler angezeigt?</p>
        <Button>Test Button</Button>
      </div>

      <div className="border-t pt-8">
        <h2 className="text-xl mb-2">Test 2: Kalender-Komponente</h2>
        <p>Verursacht dieser Kalender die `forwardRef`-Warnung?</p>

        {/* NEU: Der Kalender wird nur gerendert, wenn isClient true ist */}
        {isClient ? (
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
        ) : (
          <div className="rounded-md border h-[354px] w-[320px] flex items-center justify-center">
            <p>Kalender lädt...</p>
          </div>
        )}
      </div>
    </div>
  );
}
