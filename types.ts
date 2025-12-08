
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

export enum HeroClass {
  ADVENTURER = 'ADVENTURER', // Balanced, Standard Start
  WARRIOR = 'WARRIOR',       // Starts with Bomb Scroll
  ROGUE = 'ROGUE',           // Starts with Reroll Token
  MAGE = 'MAGE',             // Starts with XP Potion
  PALADIN = 'PALADIN'        // Starts with Golden Rune
}

export type GameMode = 'RPG' | 'CLASSIC';

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
  isCascade?: boolean; // Visual cue for cascade merges
  health?: number;
  maxHealth?: number;
}

export interface Stage {
  name: string;
  minLevel: number;
  backgroundUrl: string;
  colorTheme: string;
  barColor: string; // CSS gradient class for XP bar
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

export interface RunStats {
  highestTile: number;
  highestMonster: string;
  stageReached: string;
  turnCount: number;
  powerUpsUsed: number;
  goldEarned: number;
  cascadesTriggered: number;
  startTime: number;
  endTime?: number;
  
  // Extended stats for Bounties
  bossesDefeated: number;
  mergesCount: number;
  itemsCrafted: number;
}

export interface DailyBounty {
  id: string;
  description: string;
  targetStat: keyof RunStats;
  targetValue: number;
  currentValue: number; // For tracking across multiple runs if we wanted (currently per-run for simplicity)
  rewardXp: number;
  isCompleted: boolean;
}

export interface PlayerProfile {
  id: string;
  totalAccountXp: number;
  accountLevel: number;
  gamesPlayed: number;
  highScore: number;
  unlockedFeatures: string[]; // ['NG+', 'HardMode', 'Reroll']
  unlockedClasses: HeroClass[];
  activeBounties: DailyBounty[];
  lastBountyDate: string; // YYYY-MM-DD
  lastPlayed: string;
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

export interface InputSettings {
  enableKeyboard: boolean;
  enableSwipe: boolean;
  enableScroll: boolean;
  invertSwipe: boolean;
  invertScroll: boolean;
  sensitivity: number; // 1-10 (For scroll/swipe threshold)
}

export interface GameState {
  grid: Tile[];
  score: number;
  bestScore: number;
  xp: number;
  level: number;
  gold: number;
  inventory: InventoryItem[];
  gridSize: number;
  gameOver: boolean;
  victory: boolean;
  gameWon: boolean;
  combo: number;
  isCascading?: boolean; // Blocks input during cascade sequence
  cascadeStep?: number; // Tracks current cascade iteration for multiplier
  logs: string[];
  activeEffects: string[];
  effectCounters: Record<string, number>; 
  currentStage: Stage;
  powerUpEffect?: string;
  rerolls: number;
  lastSpawnedTileId?: string;
  stats: GameStats;
  runStats: RunStats;
  achievements: string[]; // IDs of unlocked achievements
  settings: InputSettings;
  selectedClass: HeroClass; // Track current run class
  gameMode: GameMode; // RPG or CLASSIC
  accountLevel: number; // Used for gating cascades
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

export type View = 'SPLASH' | 'GAME' | 'LEADERBOARD' | 'SETTINGS';
