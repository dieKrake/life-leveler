// src/lib/leveling.ts

// Dies ist die Formel, um zu berechnen, wie viele XP für das nächste Level benötigt werden.
// Formel: 100 * (1.5 ^ (aktuelles_level - 1))
export const getXpForNextLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};
