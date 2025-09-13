// Level System Utilities

export interface LevelInfo {
  level: number;
  rank: string;
  color: string;
  colorName: string;
  requiredTransactions: number;
  totalRequiredTransactions: number;
}

export interface RankInfo {
  rank: string;
  color: string;
  colorName: string;
  minLevel: number;
  maxLevel: number;
}

// Rank definitions
export const RANKS: RankInfo[] = [
  { rank: 'Iron', color: 'bg-gray-500', colorName: 'Iron', minLevel: 1, maxLevel: 10 },
  { rank: 'Bronze', color: 'bg-orange-600', colorName: 'Bronze', minLevel: 11, maxLevel: 30 },
  { rank: 'Gold', color: 'bg-yellow-500', colorName: 'Gold', minLevel: 31, maxLevel: 60 },
  { rank: 'Platinum', color: 'bg-purple-500', colorName: 'Platinum', minLevel: 61, maxLevel: 99 },
  { rank: 'Diamond', color: 'bg-blue-500', colorName: 'Diamond', minLevel: 100, maxLevel: 150 },
  { rank: 'Emerald', color: 'bg-green-500', colorName: 'Emerald', minLevel: 151, maxLevel: 200 },
  { rank: 'Ruby', color: 'bg-red-500', colorName: 'Ruby', minLevel: 201, maxLevel: 250 }
];

// Calculate required transactions for a specific level
export const calculateRequiredTransactions = (level: number): number => {
  if (level <= 1) return 0;
  
  // Base formula: 500 + (previous level * 500)
  // Level 1 -> 2: 500
  // Level 2 -> 3: 1000 (500 + 500)
  // Level 3 -> 4: 1500 (500 + 1000)
  // Level 4 -> 5: 2000 (500 + 1500)
  // etc.
  
  let totalRequired = 0;
  for (let i = 1; i < level; i++) {
    totalRequired += 500 + ((i - 1) * 500);
  }
  
  return totalRequired;
};

// Calculate total transactions required to reach a level
export const calculateTotalRequiredTransactions = (level: number): number => {
  if (level <= 1) return 0;
  
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += calculateRequiredTransactions(i + 1);
  }
  
  return total;
};

// Get level info for a specific level
export const getLevelInfo = (level: number): LevelInfo => {
  const rank = getRankForLevel(level);
  const requiredTransactions = calculateRequiredTransactions(level);
  const totalRequiredTransactions = calculateTotalRequiredTransactions(level);
  
  return {
    level,
    rank: rank.rank,
    color: rank.color,
    colorName: rank.colorName,
    requiredTransactions,
    totalRequiredTransactions
  };
};

// Get rank for a specific level
export const getRankForLevel = (level: number): RankInfo => {
  const rank = RANKS.find(r => level >= r.minLevel && level <= r.maxLevel);
  return rank || RANKS[RANKS.length - 1]; // Return highest rank if level exceeds max
};

// Calculate what level a user should be based on their transaction value
export const calculateLevelFromTransactions = (totalTransactionValue: number): number => {
  let level = 1;
  let cumulativeRequired = 0;
  
  while (level <= 250) {
    const requiredForNextLevel = calculateRequiredTransactions(level + 1);
    cumulativeRequired += requiredForNextLevel;
    
    if (totalTransactionValue < cumulativeRequired) {
      return level;
    }
    
    level++;
  }
  
  return 250; // Max level
};

// Get progress to next level
export const getProgressToNextLevel = (currentLevel: number, totalTransactionValue: number): {
  currentLevelTransactions: number;
  nextLevelRequired: number;
  progress: number;
  remaining: number;
} => {
  const currentLevelRequired = calculateTotalRequiredTransactions(currentLevel);
  const nextLevelRequired = calculateTotalRequiredTransactions(currentLevel + 1);
  const currentLevelTransactions = totalTransactionValue - currentLevelRequired;
  const progress = Math.min(100, (currentLevelTransactions / (nextLevelRequired - currentLevelRequired)) * 100);
  const remaining = Math.max(0, nextLevelRequired - totalTransactionValue);
  
  return {
    currentLevelTransactions,
    nextLevelRequired: nextLevelRequired - currentLevelRequired,
    progress,
    remaining
  };
};

// Format transaction value for display
export const formatTransactionValue = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M EGP`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K EGP`;
  } else {
    return `${value.toFixed(0)} EGP`;
  }
};
