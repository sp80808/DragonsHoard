
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
  
  // New Store Items
  CHAIN_CATALYST = 'CHAIN_CATALYST', // 10 turns of guaranteed/boosted cascades
  LUCKY_DICE = 'LUCKY_DICE', // Increases power-up spawn rate
  MIDAS_POTION = 'MIDAS_POTION', // 2x Gold for 50 turns
  SIEGE_BREAKER = 'SIEGE_BREAKER', // Next boss hit deals 3x damage
  
  // New Additions
  VOID_STONE = 'VOID_STONE', // Consumes 1 weak tile/turn
  RADIANT_AURA = 'RADIANT_AURA', // +50% XP
  THUNDER_SCROLL = 'THUNDER_SCROLL', // Trigger Cascade
  
  // Cascade Synergy Items
  FLOW_ELIXIR = 'FLOW_ELIXIR', // Double cascade multipliers
  HARMONIC_CRYSTAL = 'HARMONIC_CRYSTAL', // Spawns tiles during cascades to extend them
  
  // Crafted Items
  GREATER_XP_POTION = 'GREATER_XP_POTION',
  CATACLYSM_SCROLL = 'CATACLYSM_SCROLL',
  ASCENDANT_RUNE = 'ASCENDANT_RUNE',
  GRANDMASTER_BREW = 'GRANDMASTER_BREW' // Massive XP + Flow State
}

export enum HeroClass {
  ADVENTURER = 'ADVENTURER', // Balanced, Standard Start
  WARRIOR = 'WARRIOR',       // Starts with Bomb Scroll
  ROGUE = 'ROGUE',           // Starts with Reroll Token
  MAGE = 'MAGE',             // Starts with XP Potion
  PALADIN = 'PALADIN'        // Starts with Golden Rune
}

export type GameMode = 'RPG' | 'CLASSIC';

export type View = 'SPLASH' | 'GAME' | 'LEADERBOARD' | 'SETTINGS' | 'HELP';

export interface InventoryItem {
  id: string;
  type: ItemType;
  name: string;
  description: string;
  icon: string;
  category?: 'CONSUMABLE' | 'MAGIC' | 'BATTLE';
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
  bossThemeId?: string; // To render unique boss images
}

export interface Stage {
  name: string;
  minLevel: number;
  backgroundUrl: string;
  colorTheme: string;
  barColor: string; // CSS gradient class for XP bar
  prompt?: string;
  themeId?: string; // For tile sets
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
  tutorialCompleted: boolean;
  bossTutorialCompleted: boolean;
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
  enableTooltips: boolean;
  slideSpeed: number; // ms duration for tile movement
  lowPerformanceMode: boolean; // Disables expensive CSS and particles
}

export interface ShopItemState {
    stock: number;
    priceMultiplier: number;
}

export interface ShopState {
    items: Record<string, ShopItemState>;
    turnsUntilRestock: number;
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
  justLeveledUp: boolean;
  unlockedPerk?: string;
  shop: ShopState;
}

export interface MoveResult {
  grid: Tile[];
  score: number;
  xpGained: number;
  goldGained: number;
  itemsFound: InventoryItem[];
  moved: boolean;
  mergedIds: string[];
  combo: number;
  comboMultiplier: number;
  logs: string[];
  powerUpTriggered?: TileType;
  bossDefeated: boolean;
}

export interface LootResult {
    message: string;
    gold?: number;
    item?: InventoryItem;
}

export interface LeaderboardEntry {
    score: number;
    level: number;
    gold: number;
    date: number;
}
