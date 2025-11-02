import { Badge } from "@/components/ui/badge";
import { getDifficultyConfig } from "@/lib/difficultyUtils";

interface DifficultyBadgeProps {
  xpValue: number;
  className?: string;
}

export default function DifficultyBadge({ xpValue, className = "" }: DifficultyBadgeProps) {
  const config = getDifficultyConfig(xpValue);

  return (
    <Badge
      variant="outline"
      className={`text-xs ${config.bgClass} ${config.colorClass} ${className}`}
    >
      {config.label}
    </Badge>
  );
}
