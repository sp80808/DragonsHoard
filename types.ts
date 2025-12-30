
import React from 'react';

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
  STONE = 'STONE', // Garbage tile for Versus
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
  PALADIN = 'PALADIN',       // Starts with Golden Rune
  DRAGON_SLAYER = 'DRAGON_SLAYER' // Starts with Siege Breaker (Unlocked by winning)
}

export type AbilityType = 'SCORCH' | 'DRAGON_BREATH' | 'GOLDEN_EGG';

export interface AbilityState {
    id: AbilityType;
    isUnlocked: boolean;
    charges: number; // For passives, this tracks unused charges if needed
    maxCharges: number;
    cooldown: number; // Turns until auto-trigger
    currentCooldown: number;
}

export type GameMode = 'RPG' | 'CLASSIC' | 'VERSUS' | 'DAILY' | 'BOSS_RUSH';
export type Difficulty = 'NORMAL' | 'HARD';

export type View = 'SPLASH' | 'GAME' | 'LEADERBOARD' | 'SETTINGS' | 'HELP' | 'VERSUS' | 'GRIMOIRE' | 'SKILLS';

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
  isDying?: boolean; // For exit animations (Dragon Breath)
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

export interface LootEvent {
  id: string;
  x: number;
  y: number;
  type: 'GOLD' | 'ITEM' | 'XP';
  value?: number | string;
  icon?: string;
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
  medalsEarned: string[]; // List of Medal IDs earned this run
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
  unlockedFeatures: string[]; // ['NG+', 'HARD_MODE', 'TILESET_UNDEAD', 'MODE_BOSS_RUSH', 'TILESET_INFERNAL']
  unlockedClasses: HeroClass[];
  activeBounties: DailyBounty[];
  lastBountyDate: string; // YYYY-MM-DD
  lastPlayed: string;
  tutorialCompleted: boolean;
  bossTutorialCompleted: boolean;
  seenHints: string[]; // IDs of hints player has already seen
  activeTilesetId: string;
  unlockedLore: string[]; // IDs of unlocked story fragments
  earnedMedals: Record<string, number>; // Medal ID -> Count
  unlockedPowerups: AbilityType[]; // Persistent unlocks
  skillPoints: number;
  unlockedSkills: string[]; // IDs of unlocked skill nodes
  
  // Login Streak
  loginStreak: number;
  lastLoginRewardDate: string; // YYYY-MM-DD
}

export interface SkillNodeDefinition {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    x: number; // 0-100 percentage
    y: number; // 0-100 percentage
    parentId?: string;
    cost: number;
    effect?: (state: GameState) => Partial<GameState>; // Runtime effect hook
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

export interface StoryEntry {
    id: string;
    title: string;
    text: string;
    imageUrl?: string; // New: Visuals for lore
    unlockCondition: (stats: GameStats, state: GameState, profile: PlayerProfile) => boolean;
    order: number;
}

export type GraphicsQuality = 'HIGH' | 'MEDIUM' | 'LOW';
export type OrientationSetting = 'AUTO' | 'PORTRAIT' | 'LANDSCAPE';

export interface InputSettings {
  enableKeyboard: boolean;
  enableSwipe: boolean;
  enableScroll: boolean;
  enableHaptics: boolean; 
  invertSwipe: boolean;
  invertScroll: boolean;
  sensitivity: number; // 1-10 (For scroll/swipe threshold)
  enableTooltips: boolean;
  slideSpeed: number; // ms duration for tile movement
  graphicsQuality: GraphicsQuality;
  
  // Enhanced Depth Settings
  enableScreenShake: boolean;
  enableParticles: boolean;
  reduceMotion: boolean;
  
  // Orientation
  orientation: OrientationSetting;
}

export interface ShopItemState {
    stock: number;
    priceMultiplier: number;
}

export interface ShopState {
    items: Record<string, ShopItemState>;
    turnsUntilRestock: number;
}

export interface DailyModifier {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
}

// --- MEDALS SYSTEM ---
export type MedalRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface Medal {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    rarity: MedalRarity;
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
  gameMode: GameMode; // RPG or CLASSIC or DAILY or BOSS_RUSH
  difficulty: Difficulty; // NORMAL or HARD
  tilesetId: string; // DEFAULT or UNDEAD
  accountLevel: number; // Used for gating cascades
  baselineAccountXp: number; // New: Tracks starting XP of the session for level up calculation
  justLeveledUp: boolean;
  unlockedPerk?: string;
  shop: ShopState;
  activeModifiers: DailyModifier[]; // New: List of active modifiers for Daily/Challenge runs
  lootEvents: LootEvent[];
  lastTurnMedals: Medal[]; // Medals earned in the most recent move (cleared by UI)
  isInvalidMove?: boolean; // Visual feedback for invalid swipes
  
  // Powerup System
  abilities: Record<AbilityType, AbilityState>;
  targetingMode: AbilityType | null; // Keep for legacy compatibility but generally unused for passives
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
  lootEvents: LootEvent[];
  medalsEarned: Medal[];
  abilitiesTriggered: string[]; 
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
    heroClass?: HeroClass;
    turns?: number;
    mode?: GameMode;
}

export type FeedbackType = 'LEVEL_UP' | 'BOSS_KILLED' | 'GRID_EXPAND' | 'UNLOCK' | 'ACHIEVEMENT' | 'LORE_UNLOCK' | 'POWERUP_UNLOCK' | 'PASSIVE_TRIGGER';

export interface FeedbackEvent {
    id: string;
    type: FeedbackType;
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    reward?: string;
}
