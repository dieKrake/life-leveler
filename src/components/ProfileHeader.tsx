"use client";

import { useTranslation } from "@/hooks/useTranslation";

export default function ProfileHeader() {
  const { t } = useTranslation();

  return (
    <div className="text-center space-y-2">
      <h1 className="text-3xl font-bold">{t("profile.myProfile")}</h1>
      <p className="text-muted-foreground">{t("profile.trackProgress")}</p>
    </div>
  );
}
