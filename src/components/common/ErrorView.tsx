import { GRADIENTS } from "@/lib/constants";

interface ErrorViewProps {
  error: Error | { message: string };
}

export default function ErrorView({ error }: ErrorViewProps) {
  return (
    <div className={`min-h-screen ${GRADIENTS.pageBg} p-6`}>
      <div className="container mx-auto max-w-6xl">
        <div className="text-center text-red-400">
          Fehler: {error.message}
        </div>
      </div>
    </div>
  );
}
