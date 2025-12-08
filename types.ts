
export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export enum TileType {
  NORMAL = 'NORMAL',
  BOSS = 'BOSS',
  BOMB = 'BOMB', // Clears 3x3
  GOLDEN = 'GOLDEN', // Worth 2x
  RUNE_MIDAS = 'RUNE_MIDAS',
  RUNE_CHRONOS = 'RUNE_CHRONOS',
  RUNE_VOID = 'RUNE_VOID',
}

export enum ItemType {
  XP_POTION = 'XP_POTION',
  BOMB_SCROLL = 'BOMB_SCROLL', // Clears lowest 3 tiles
  GOLDEN_RUNE = 'GOLDEN_RUNE', // Next spawn is upgraded
  REROLL_TOKEN = 'REROLL_TOKEN',
  LUCKY_CHARM = 'LUCKY_CHARM',
  
  // Crafted Items
  GREATER_XP_POTION = 'GREATER_XP_POTION',
  CATACLYSM_SCROLL = 'CATACLYSM_SCROLL',
  ASCENDANT_RUNE = 'ASCENDANT_RUNE' 
}

export interface InventoryItem {
  id: string;
  type: ItemType;
  name: string;
  description: string;
  icon: string;
}

export interface CraftingRecipe {
  id: string;
  resultId: ItemType;
  name: string;
  description: string;
  icon: string;
  goldCost: number;
  ingredients: { type: ItemType; count: number }[];
}

export interface Tile {
  id: string;
  x: number;
  y: number;
  value: number;
  type: TileType;
  mergedFrom?: string[] | null;
  isNew?: boolean;
  health?: number;
  maxHealth?: number;
}

export interface Stage {
  name: string;
  minLevel: number;
  backgroundUrl: string;
  colorTheme: string;
}

export interface FloatingText {
  id: string;
  x: number; // Percentage or pixel
  y: number;
  text: string;
  color: string;
  createdAt: number;
}

export interface GameStats {
  totalMerges: number;
  highestCombo: number;
  slimesMerged: number; // Value 2
  bossesDefeated: number;
  goldCollected: number;
  highestTile: number;
  totalMoves: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: GameStats, state: GameState) => boolean;
  reward?: { gold?: number; xp?: number; item?: ItemType };
  isSecret?: boolean;
}

export interface GameState {
  grid: Tile[];
  score: number;
  bestScore: number;
  xp: number;
  level: number;
  gold: number;
  gems: number; // Premium currency
  inventory: InventoryItem[];
  cosmetics: Cosmetic[]; // Player's cosmetic collection
  gridSize: number;
  gameOver: boolean;
  victory: boolean;
  gameWon: boolean;
  combo: number;
  logs: string[];
  activeEffects: string[];
  effectCounters: Record<string, number>;
  currentStage: Stage;
  powerUpEffect?: string;
  rerolls: number;
  lastSpawnedTileId?: string;
  stats: GameStats;
  achievements: string[]; // IDs of unlocked achievements
  dailyChallenges: DailyChallenge[];
  sessionStats: SessionStats;
}

export interface MoveResult {
  grid: Tile[];
  score: number;
  xpGained: number;
  goldGained: number;
  moved: boolean;
  mergedIds: string[];
  lastSpawnedTileId?: string;
  powerUpTriggered?: TileType;
  combo: number;
  comboMultiplier: number;
  logs: string[];
  bossDefeated?: boolean;
}

export interface LootResult {
  message: string;
  item?: InventoryItem;
  gold?: number;
  xp?: number;
}

export interface LeaderboardEntry {
  date: number;
  score: number;
  level: number;
  gold: number;
}

export interface DailyChallenge {
  id: string;
  name: string;
  description: string;
  type: 'progression' | 'combat' | 'economy' | 'gameplay' | 'speed' | 'endurance';
  target: number;
  current: number;
  completed: boolean;
  reward: { gold?: number; xp?: number };
  resetTime: number;
}

export interface SessionStats {
  totalMerges: number;
  highestCombo: number;
  goldEarned: number;
  xpGained: number;
  bossesDefeated: number;
  itemsUsed: number;
  sessionDuration: number;
  highestLevel: number;
  startTime: number;
  endTime?: number;
}

export enum CosmeticCategory {
  CREATURE_SKIN = 'CREATURE_SKIN',
  BOARD_THEME = 'BOARD_THEME',
  UI_THEME = 'UI_THEME',
  EFFECT = 'EFFECT',
}

export interface Cosmetic {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: CosmeticCategory;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  cost?: { gold?: number; gems?: number };
  unlockCondition?: { achievement?: string; level?: number };
  owned: boolean;
  equipped: boolean;
}

export type View = 'SPLASH' | 'GAME' | 'LEADERBOARD' | 'SETTINGS' | 'STATS' | 'COSMETICS';
