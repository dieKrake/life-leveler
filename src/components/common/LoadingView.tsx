"use client";

import { GRADIENTS } from "@/lib/constants";
import { useTranslation } from "@/hooks/useTranslation";

interface LoadingViewProps {
  message?: string;
}

export default function LoadingView({ message }: LoadingViewProps) {
  const { t } = useTranslation();
  const displayMessage = message || t("common.loading");
  return (
    <div className={`min-h-screen ${GRADIENTS.pageBg} p-6`}>
      <div className="container mx-auto max-w-6xl">
        <div className="text-center text-white">{displayMessage}</div>
      </div>
    </div>
  );
}
