
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
  
  // Expansion Items
  TRANSMUTATION_SCROLL = 'TRANSMUTATION_SCROLL', // Upgrades lowest tier
  MERCHANT_BELL = 'MERCHANT_BELL', // Restocks shop
  OMNI_SLASH = 'OMNI_SLASH', // Damages all bosses
  
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
  ADVENTURER = 'ADVENTURER', // Balanced
  WARRIOR = 'WARRIOR',       // Combat
  ROGUE = 'ROGUE',           // Greed
  MAGE = 'MAGE',             // Magic
  PALADIN = 'PALADIN',       // Tank/Holy
  DRAGON_SLAYER = 'DRAGON_SLAYER' // Ultimate
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

export interface MergeEvent {
  id: string;
  x: number;
  y: number;
  value: number;
  type: TileType | string;
  isCascade: boolean;
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
  
  // XP Breakdown
  xpGainedClass: number;
  xpGainedAccount: number;
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

export interface ClassProgress {
    xp: number;
    level: number;
    skillPoints: number;
    unlockedNodes: string[];
}

export interface PlayerProfile {
  id: string;
  totalAccountXp: number;
  accountLevel: number;
  gamesPlayed: number;
  highScore: number;
  unlockedFeatures: string[]; 
  unlockedClasses: HeroClass[];
  activeBounties: DailyBounty[];
  lastBountyDate: string; // YYYY-MM-DD
  lastPlayed: string;
  tutorialCompleted: boolean;
  cascadeTutorialSeen: boolean; 
  bossTutorialCompleted: boolean;
  seenHints: string[]; 
  activeTilesetId: string;
  unlockedLore: string[]; 
  earnedMedals: Record<string, number>; 
  unlockedPowerups: AbilityType[]; // Persistent unlocks
  
  // New Class System
  classProgress: Record<string, ClassProgress>; // HeroClass -> Progress
  skillPoints: number; // Legacy global points (convert to Adventurer points on migration)
  unlockedSkills: string[]; // Legacy global skills
  
  // Login Streak
  loginStreak: number;
  lastLoginRewardDate: string; // YYYY-MM-DD
}

export interface SkillNodeDefinition {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    x: number; // 0-100 percentage (Left to Right layout in this new design)
    y: number; // 0-100 percentage
    parentId?: string;
    cost: number;
    effect?: (state: GameState) => Partial<GameState>; // Runtime effect hook
    reqLevel: number; // Class Level required
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
    imageUrl?: string; 
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
  sensitivity: number; // 1-10
  enableTooltips: boolean;
  slideSpeed: number; // ms duration
  graphicsQuality: GraphicsQuality;
  
  enableScreenShake: boolean;
  enableParticles: boolean;
  reduceMotion: boolean;
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
  isCascading?: boolean;
  cascadeStep?: number;
  cascadeDelay?: number;
  logs: string[];
  activeEffects: string[];
  effectCounters: Record<string, number>; 
  currentStage: Stage;
  powerUpEffect?: string;
  rerolls: number;
  lastSpawnedTileId?: string;
  stats: GameStats;
  runStats: RunStats;
  achievements: string[]; 
  settings: InputSettings;
  selectedClass: HeroClass; 
  gameMode: GameMode; 
  difficulty: Difficulty; 
  tilesetId: string; 
  accountLevel: number; 
  baselineAccountXp: number; 
  justLeveledUp: boolean;
  unlockedPerk?: string;
  shop: ShopState;
  activeModifiers: DailyModifier[]; 
  lootEvents: LootEvent[];
  mergeEvents: MergeEvent[]; 
  lastTurnMedals: Medal[]; 
  isInvalidMove?: boolean; 
  
  // Powerup System
  abilities: Record<AbilityType, AbilityState>;
  targetingMode: AbilityType | null; 
  
  // Active Class Skills (New)
  activeClassSkills: string[];
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
  hitstopDuration: number;
}

export interface FeedbackEvent {
    id: string;
    type: string;
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    reward?: string;
}

export interface LeaderboardEntry {
    score: number;
    name: string;
    date: number;
    heroClass: HeroClass;
    gold?: number;
    level?: number;
}

export interface UnlockReward {
    type: 'CLASS' | 'FEATURE' | 'TILESET' | 'POWERUP' | 'SKILL_POINT';
    id: string;
    label: string;
    desc: string;
    level: number;
}
