import { Sparkles } from "lucide-react";

export default function Logo({ logoName }: { logoName: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
      </div>
      <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        {logoName}
      </span>
    </div>
  );
}
