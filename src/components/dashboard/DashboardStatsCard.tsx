import { LucideIcon } from "lucide-react";
import { GRADIENTS } from "@/lib/constants";

interface DashboardStatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  Icon: LucideIcon;
  iconColor: string;
  gradient: string;
  progress?: {
    current: number;
    total: number;
  };
}

export default function DashboardStatsCard({
  title,
  value,
  subtitle,
  Icon,
  iconColor,
  gradient,
  progress,
}: DashboardStatsCardProps) {
  return (
    <div className={`bg-gradient-to-br ${gradient} backdrop-blur-sm border rounded-xl p-4`}>
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-6 h-6 ${iconColor}`} />
        <span className="text-purple-100 font-medium">{title}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subtitle && <div className="text-xs text-blue-200">{subtitle}</div>}
      {progress && (
        <div className="w-full bg-blue-900/30 rounded-full h-2 mt-2">
          <div
            className={`bg-gradient-to-r ${GRADIENTS.xpProgress} h-2 rounded-full transition-all duration-500`}
            style={{
              width: `${Math.min((progress.current / progress.total) * 100, 100)}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}
