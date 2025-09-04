import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Trophy, Flame, Gem, TrendingUp } from "lucide-react";

export default function AchievementsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Erfolge
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Placeholder achievements */}
          <div className="text-center p-4 border rounded-lg">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-sm font-medium">Erste Aufgabe</p>
            <p className="text-xs text-muted-foreground">Erledigt</p>
          </div>
          <div className="text-center p-4 border rounded-lg opacity-50">
            <Flame className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium">7-Tage Streak</p>
            <p className="text-xs text-muted-foreground">Gesperrt</p>
          </div>
          <div className="text-center p-4 border rounded-lg opacity-50">
            <Gem className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium">100 Edelsteine</p>
            <p className="text-xs text-muted-foreground">Gesperrt</p>
          </div>
          <div className="text-center p-4 border rounded-lg opacity-50">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium">Level 10</p>
            <p className="text-xs text-muted-foreground">Gesperrt</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
