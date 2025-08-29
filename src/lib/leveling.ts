export const getXpForNextLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};
