import { GRADIENTS } from "@/lib/constants";

interface LoadingViewProps {
  message?: string;
}

export default function LoadingView({ message = "Lade Daten..." }: LoadingViewProps) {
  return (
    <div className={`min-h-screen ${GRADIENTS.pageBg} p-6`}>
      <div className="container mx-auto max-w-6xl">
        <div className="text-center text-white">{message}</div>
      </div>
    </div>
  );
}
