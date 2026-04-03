"use client";

import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage, Locale } from "@/lib/LanguageProvider";

const languages: { value: Locale; label: string; flag: string }[] = [
  { value: "de", label: "Deutsch", flag: "🇩🇪" },
  { value: "en", label: "English", flag: "🇬🇧" },
];

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  const currentLang = languages.find((l) => l.value === locale) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5 text-slate-300 hover:text-white hover:bg-white/10 px-2"
        >
          <Globe className="w-4 h-4" />
          <span className="text-xs font-medium">{currentLang.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-36 bg-slate-800 border-slate-700"
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.value}
            onClick={() => setLocale(lang.value)}
            className={`flex items-center gap-2 cursor-pointer ${
              locale === lang.value
                ? "bg-purple-500/20 text-purple-300"
                : "text-slate-300 hover:bg-slate-700 focus:bg-slate-700"
            }`}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
