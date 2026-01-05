
import { TileType, ItemType, GameStats, GameState, Stage, Achievement, HeroClass, CraftingRecipe, DailyModifier, StoryEntry, PlayerProfile, Medal, SkillNodeDefinition, Artifact } from './types';
import { Trophy, Star, Shield, Zap, Swords, LayoutGrid, Map, Flame, Target, Hexagon, Crosshair, Medal as MedalIcon, Crown, Skull, Coins, Hourglass, Eye, Feather, Rocket, Briefcase, Anchor, HeartOff, Sparkles, Sword, Hand, BookOpen, Clock, Scale, Sun, Heart, Ghost, Droplets, Settings, Hammer } from 'lucide-react';
import React from 'react';
import { createId } from './services/gameLogic';

export const GRID_SIZE_INITIAL = 4;

// Helper to generate consistent placeholder image URLs
export const genUrl = (prompt: string, seed: number) => 
  `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&seed=${seed}`;

export const getXpThreshold = (level: number) => Math.floor(1000 * Math.pow(level, 1.5));

// ... (Keep existing STAGES, getStage, getStageBackground)
export const STAGES: Stage[] = [
    { name: 'Dungeon Entrance', minLevel: 1, backgroundUrl: genUrl('dark dungeon entrance torches stone walls rpg', 101), colorTheme: 'text-slate-200', barColor: 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500', themeId: 'DEFAULT' },
    { name: 'Fungal Caverns', minLevel: 5, backgroundUrl: genUrl('glowing mushroom cave bioluminescent purple green rpg', 102), colorTheme: 'text-purple-300', barColor: 'bg-gradient-to-r from-lime-500 via-green-400 to-emerald-500', themeId: 'FUNGAL' },
    { name: 'Molten Depths', minLevel: 10, backgroundUrl: genUrl('lava cave volcano magma fire rpg', 103), colorTheme: 'text-red-300', barColor: 'bg-gradient-to-r from-cyan-500 via-blue-500 to-sky-500', themeId: 'MAGMA' },
    { name: 'Whispering Library', minLevel: 15, backgroundUrl: genUrl('ancient magical library floating books fantasy rpg', 201), colorTheme: 'text-amber-200', barColor: 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500', themeId: 'LIBRARY' },
    { name: 'Crystal Spire', minLevel: 20, backgroundUrl: genUrl('ice crystal cave blue frozen magical rpg', 104), colorTheme: 'text-cyan-300', barColor: 'bg-gradient-to-r from-rose-500 via-red-500 to-orange-500', themeId: 'CRYSTAL' },
    { name: 'Sunken Tomb', minLevel: 25, backgroundUrl: genUrl('underwater ruins glowing runes atlantis rpg', 202), colorTheme: 'text-teal-300', barColor: 'bg-gradient-to-r from-rose-400 via-pink-500 to-red-500', themeId: 'AQUATIC' },
    { name: 'Void Realm', minLevel: 30, backgroundUrl: genUrl('cosmic void space stars nebula purple dark rpg', 105), colorTheme: 'text-fuchsia-300', barColor: 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400', themeId: 'VOID' },
    { name: 'Iron Fortress', minLevel: 35, backgroundUrl: genUrl('steampunk industrial fortress gears lava rpg', 203), colorTheme: 'text-orange-300', barColor: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600', themeId: 'STEAMPUNK' },
    { name: 'Celestial Citadel', minLevel: 40, backgroundUrl: genUrl('heavenly clouds golden gates divine light rpg', 106), colorTheme: 'text-yellow-200', barColor: 'bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600', themeId: 'HEAVEN' },
    { name: 'Astral Nexus', minLevel: 45, backgroundUrl: genUrl('cosmic galaxy stars nebula magic rpg', 204), colorTheme: 'text-indigo-200', barColor: 'bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500', themeId: 'COSMIC' }
];

export const getStage = (level: number) => {
    return [...STAGES].reverse().find(s => level >= s.minLevel) || STAGES[0];
};

export const getStageBackground = (name: string) => STAGES.find(s => s.name === name)?.backgroundUrl || '';

// ... (Keep existing Styles TILE_STYLES, BOSS_STYLE etc.)
export const BOSS_STYLE = { label: 'BOSS', color: 'from-red-950 to-black', ringColor: 'ring-red-600', icon: '💀', glow: 'shadow-red-600/100', imageUrl: genUrl('terrifying skeleton lich king dark magic', 666), particleColor: '#ef4444' };
export const FALLBACK_STYLE = { label: '???', color: 'from-gray-800 to-black', ringColor: 'ring-gray-500', icon: '❓', glow: 'shadow-none', imageUrl: '', particleColor: '#ffffff' };
export const STONE_STYLE = { label: 'STONE', color: 'from-slate-700 to-slate-900', ringColor: 'ring-slate-500', icon: '🪨', glow: 'shadow-none', imageUrl: genUrl('cracked stone block obstacle wall', 555), particleColor: '#94a3b8' };

export const TILE_STYLES: Record<number, any> = {
  2: { label: 'SLIME', color: 'from-green-500 to-green-700', ringColor: 'ring-green-400', icon: '🟢', glow: 'shadow-green-400/50', imageUrl: genUrl('cute green rpg slime monster', 2), particleColor: '#4ade80' },
  4: { label: 'RAT', color: 'from-stone-500 to-stone-700', ringColor: 'ring-stone-400', icon: '🐀', glow: 'shadow-stone-400/50', imageUrl: genUrl('angry sewer rat rpg monster', 4), particleColor: '#a8a29e' },
  8: { label: 'GOBLIN', color: 'from-emerald-600 to-emerald-800', ringColor: 'ring-emerald-500', icon: '👺', glow: 'shadow-emerald-500/50', imageUrl: genUrl('sneaky green goblin dagger rpg', 8), particleColor: '#10b981' },
  16: { label: 'SKELETON', color: 'from-slate-300 to-slate-500', ringColor: 'ring-slate-200', icon: '💀', glow: 'shadow-slate-200/50', imageUrl: genUrl('skeleton warrior sword shield rpg', 16), particleColor: '#e2e8f0' },
  32: { label: 'ORC', color: 'from-teal-700 to-teal-900', ringColor: 'ring-teal-600', icon: '👹', glow: 'shadow-teal-600/50', imageUrl: genUrl('fierce orc warrior axe rpg', 32), particleColor: '#0d9488' },
  64: { label: 'WOLF', color: 'from-gray-600 to-gray-800', ringColor: 'ring-gray-500', icon: '🐺', glow: 'shadow-gray-500/50', imageUrl: genUrl('dire wolf glowing eyes rpg', 64), particleColor: '#9ca3af' },
  128: { label: 'GOLEM', color: 'from-orange-700 to-orange-900', ringColor: 'ring-orange-600', icon: '🗿', glow: 'shadow-orange-600/50', imageUrl: genUrl('stone golem magical runes rpg', 128), particleColor: '#ea580c' },
  256: { label: 'WYVERN', color: 'from-sky-600 to-sky-800', ringColor: 'ring-sky-500', icon: '🐉', glow: 'shadow-sky-500/50', imageUrl: genUrl('blue wyvern dragon flying rpg', 256), particleColor: '#0ea5e9' },
  512: { label: 'LICH', color: 'from-violet-700 to-violet-900', ringColor: 'ring-violet-600', icon: '🧟', glow: 'shadow-violet-600/50', imageUrl: genUrl('undead lich king magic staff rpg', 512), particleColor: '#7c3aed' },
  1024: { label: 'DEMON', color: 'from-rose-800 to-rose-950', ringColor: 'ring-rose-600', icon: '👿', glow: 'shadow-rose-600/50', imageUrl: genUrl('fire demon balrog rpg', 1024), particleColor: '#e11d48' },
  2048: { label: 'DRAGON', color: 'from-amber-500 to-yellow-600', ringColor: 'ring-amber-400', icon: '🐲', glow: 'shadow-amber-400/100', imageUrl: genUrl('legendary golden dragon god rpg', 2048), particleColor: '#f59e0b' },
  4096: { label: 'GOD', color: 'from-white to-cyan-200', ringColor: 'ring-cyan-400', icon: '🌟', glow: 'shadow-white/100', imageUrl: genUrl('celestial god entity light rpg', 4096), particleColor: '#ffffff' }
};

export const FALLBACK_BESTIARY_LORE: Record<string, string> = {
    "SLIME": "A gelatinous nuisance found in damp corridors. Acidic to the touch.",
    "RAT": "Verminous scavenger. Its bite carries disease and desperation.",
    "GOBLIN": "Small, malicious, and greedy. They stab shins and steal gold.",
    "SKELETON": "Animated bones of fallen adventurers. They remember how to fight.",
    "ORC": "Brutish warrior bred for war. Its axe is heavy with rust and blood.",
    "WOLF": "A hunter of the dark woods. Its howl chills the blood.",
    "GOLEM": "Animated stone powered by ancient runes. Impervious to pain.",
    "WYVERN": "A lesser dragon with a venomous tail. Rules the skies.",
    "LICH": "A master of necromancy who cheated death. Feared by all.",
    "DEMON": "Spawn of the abyss. Fire and hatred given form.",
    "DRAGON": "The apex predator. Its scales are harder than steel.",
    "GOD": "A being beyond comprehension. To behold it is to go mad."
};

// ... (Keep existing tileset definitions)
export const UNDEAD_TILE_STYLES: Record<number, any> = { ...TILE_STYLES }; 
export const INFERNAL_TILE_STYLES: Record<number, any> = { ...TILE_STYLES };
export const AQUATIC_TILE_STYLES: Record<number, any> = { ...TILE_STYLES };
export const CYBERPUNK_TILE_STYLES: Record<number, any> = { ...TILE_STYLES };
export const CELESTIAL_TILE_STYLES: Record<number, any> = { ...TILE_STYLES };
export const STEAMPUNK_TILE_STYLES: Record<number, any> = { ...TILE_STYLES };
export const FEUDAL_TILE_STYLES: Record<number, any> = { ...TILE_STYLES };
export const CANDY_TILE_STYLES: Record<number, any> = { ...TILE_STYLES };

export const THEME_STYLES: Record<string, any> = {
    DEFAULT: TILE_STYLES,
    UNDEAD: UNDEAD_TILE_STYLES,
    INFERNAL: INFERNAL_TILE_STYLES,
    AQUATIC: AQUATIC_TILE_STYLES,
    CYBERPUNK: CYBERPUNK_TILE_STYLES,
    CELESTIAL: CELESTIAL_TILE_STYLES,
    STEAMPUNK: STEAMPUNK_TILE_STYLES,
    FEUDAL: FEUDAL_TILE_STYLES,
    CANDY: CANDY_TILE_STYLES
};

export const getTileStyle = (value: number, themeId?: string, tilesetId: string = 'DEFAULT') => {
    const set = THEME_STYLES[tilesetId] || TILE_STYLES;
    return set[value] || TILE_STYLES[value] || FALLBACK_STYLE;
};

export const RUNE_STYLES: Record<string, any> = {
    [TileType.RUNE_MIDAS]: { label: 'MIDAS', color: 'from-yellow-800 to-yellow-900', ringColor: 'ring-yellow-400', icon: '💰', glow: 'shadow-yellow-400/50', imageUrl: genUrl('gold coin rune magical glowing', 777), particleColor: '#fbbf24' },
    [TileType.RUNE_CHRONOS]: { label: 'TIME', color: 'from-blue-800 to-blue-900', ringColor: 'ring-blue-400', icon: '⏳', glow: 'shadow-blue-400/50', imageUrl: genUrl('blue hourglass rune magical glowing', 888), particleColor: '#60a5fa' },
    [TileType.RUNE_VOID]: { label: 'VOID', color: 'from-purple-950 to-black', ringColor: 'ring-purple-600', icon: '⚫', glow: 'shadow-purple-600/50', imageUrl: genUrl('black hole void rune magical glowing', 999), particleColor: '#a855f7' },
    [TileType.STONE]: STONE_STYLE
};

// ... (Keep existing SHOP_ITEMS, RECIPES, SHOP_CONFIG)
export const SHOP_ITEMS = [
    // Essentials (Consumables)
    { id: ItemType.XP_POTION, name: "XP Potion", desc: "Instantly gain 1000 XP.", price: 150, category: 'CONSUMABLE', icon: '🧪' },
    { id: ItemType.MIDAS_POTION, name: "Midas Potion", desc: "Double Gold gain for 50 turns.", price: 750, category: 'CONSUMABLE', icon: '⚱️' },
    { id: ItemType.MERCHANT_BELL, name: "Merchant Bell", desc: "Instantly restocks the shop.", price: 500, category: 'CONSUMABLE', icon: '🔔' },

    // Runes & Magic
    { id: ItemType.GOLDEN_RUNE, name: "Golden Rune", desc: "Next spawn is a Golden Tile (Bonus Gold).", price: 500, category: 'MAGIC', icon: '✨' },
    { id: ItemType.REROLL_TOKEN, name: "Reroll Token", desc: "Shuffle the board completely.", price: 200, category: 'MAGIC', icon: '🎲' },
    { id: ItemType.LUCKY_CHARM, name: "Lucky Charm", desc: "Increases loot drop chance for the run.", price: 800, category: 'MAGIC', icon: '🍀' },
    { id: ItemType.CHAIN_CATALYST, name: "Chain Catalyst", desc: "Activates Cascades for 10 turns.", price: 400, category: 'MAGIC', icon: '⛓️' },
    { id: ItemType.LUCKY_DICE, name: "Lucky Dice", desc: "Increases Rune spawn rate.", price: 600, category: 'MAGIC', icon: '🎲' },
    { id: ItemType.VOID_STONE, name: "Void Stone", desc: "Consumes 1 weak tile per turn (10 turns).", price: 1000, category: 'MAGIC', icon: '🌑' },
    { id: ItemType.RADIANT_AURA, name: "Radiant Aura", desc: "+50% XP for 20 turns.", price: 900, category: 'MAGIC', icon: '☀️' },
    { id: ItemType.TRANSMUTATION_SCROLL, name: "Transmutation Scroll", desc: "Upgrades all lowest-tier tiles.", price: 1200, category: 'MAGIC', icon: '📜' },

    // Weapons (Battle)
    { id: ItemType.BOMB_SCROLL, name: "Bomb Scroll", desc: "Destroys 3 lowest value tiles.", price: 300, category: 'BATTLE', icon: '💣' },
    { id: ItemType.SIEGE_BREAKER, name: "Siege Breaker", desc: "Next boss hit deals 3x damage.", price: 450, category: 'BATTLE', icon: '🔨' },
    { id: ItemType.THUNDER_SCROLL, name: "Thunder Scroll", desc: "Instantly triggers a Cascade chain.", price: 1200, category: 'BATTLE', icon: '⚡' },
    { id: ItemType.OMNI_SLASH, name: "Omnislash", desc: "Deals 20 damage to all Bosses.", price: 1500, category: 'BATTLE', icon: '⚔️' },
];

export const getItemDefinition = (type: string) => SHOP_ITEMS.find(i => i.id === type) || { name: type, desc: 'Unknown Item', icon: '?' };

export const RECIPES: CraftingRecipe[] = [
    {
        id: 'craft_greater_xp',
        resultId: ItemType.GREATER_XP_POTION,
        name: "Greater XP Potion",
        description: "Gain 2500 XP.",
        icon: '⚗️',
        goldCost: 100,
        ingredients: [
            { type: ItemType.XP_POTION, count: 2 }
        ]
    },
    {
        id: 'craft_cataclysm',
        resultId: ItemType.CATACLYSM_SCROLL,
        name: "Cataclysm Scroll",
        description: "Purges 50% of the board.",
        icon: '🌋',
        goldCost: 500,
        ingredients: [
            { type: ItemType.BOMB_SCROLL, count: 2 },
            { type: ItemType.VOID_STONE, count: 1 }
        ]
    },
    {
        id: 'craft_ascendant',
        resultId: ItemType.ASCENDANT_RUNE,
        name: "Ascendant Rune",
        description: "Next 5 spawns are high tier.",
        icon: '🌟',
        goldCost: 1000,
        ingredients: [
            { type: ItemType.GOLDEN_RUNE, count: 2 },
            { type: ItemType.RADIANT_AURA, count: 1 }
        ]
    },
    {
        id: 'craft_grandmaster',
        resultId: ItemType.GRANDMASTER_BREW,
        name: "Grandmaster Brew",
        description: "+5000 XP & Flow State.",
        icon: '🍷',
        goldCost: 2000,
        ingredients: [
            { type: ItemType.XP_POTION, count: 3 },
            { type: ItemType.MIDAS_POTION, count: 1 }
        ]
    }
];

export const SHOP_CONFIG = {
    RESTOCK_INTERVAL: 50, // Turns
    STOCK_LIMITS: {
        CONSUMABLE: 5,
        MAGIC: 3,
        BATTLE: 3
    }
};

// ... (Keep existing ACHIEVEMENTS, MEDALS, STORY_ENTRIES, BOSS_DEFINITIONS, DAILY_MODIFIERS, getLevelRank)
export const ACHIEVEMENTS: Achievement[] = [
    { id: 'first_merge', name: 'First Steps', description: 'Merge two tiles.', icon: '👶', condition: (s) => s.totalMerges >= 1, reward: { xp: 100 } },
    { id: 'big_combo', name: 'Combo Master', description: 'Achieve a x5 Combo.', icon: '⚡', condition: (s) => s.highestCombo >= 5, reward: { gold: 100 } },
    { id: 'slayer', name: 'Boss Slayer', description: 'Defeat your first boss.', icon: '💀', condition: (s) => s.bossesDefeated >= 1, reward: { gold: 500, xp: 1000 } },
    { id: 'hoarder', name: 'Hoarder', description: 'Collect 1000 Gold.', icon: '💰', condition: (s) => s.goldCollected >= 1000, reward: { item: ItemType.LUCKY_CHARM } },
    { id: 'legendary', name: 'Legendary', description: 'Create a 1024 Tile.', icon: '🐲', condition: (s) => s.highestTile >= 1024, reward: { item: ItemType.GOLDEN_RUNE } },
];

export const MEDALS: Record<string, Medal> = {
    // Combat
    FIRST_MERGE: { id: 'FIRST_MERGE', name: 'Awakening', description: 'Perform your first merge.', icon: React.createElement(Swords, {size: 20}), rarity: 'COMMON' },
    DOUBLE_MERGE: { id: 'DOUBLE_MERGE', name: 'Twin Strike', description: 'Merge two sets of tiles at once.', icon: React.createElement(Crosshair, {size: 20}), rarity: 'COMMON' },
    MULTI_MERGE: { id: 'MULTI_MERGE', name: 'Cleave', description: 'Merge 3 sets of tiles at once.', icon: React.createElement(Hexagon, {size: 20}), rarity: 'UNCOMMON' },
    MEGA_MERGE: { id: 'MEGA_MERGE', name: 'Devastation', description: 'Merge 5+ sets of tiles at once.', icon: React.createElement(Skull, {size: 20}), rarity: 'RARE' },
    
    // Combos
    COMBO_3: { id: 'COMBO_3', name: 'Momentum', description: 'Chain 3 merges in a row.', icon: React.createElement(Zap, {size: 20}), rarity: 'COMMON' },
    COMBO_5: { id: 'COMBO_5', name: 'Rampage', description: 'Chain 5 merges in a row.', icon: React.createElement(Flame, {size: 20}), rarity: 'UNCOMMON' },
    COMBO_10: { id: 'COMBO_10', name: 'Unstoppable', description: 'Chain 10 merges. Incredible!', icon: React.createElement(Star, {size: 20}), rarity: 'LEGENDARY' },

    // Boss
    BOSS_KILL: { id: 'BOSS_KILL', name: 'Titan Slayer', description: 'Defeat a Boss.', icon: React.createElement(Trophy, {size: 20}), rarity: 'RARE' },
    SNIPER: { id: 'SNIPER', name: 'Deadshot', description: 'Hit boss from max range.', icon: React.createElement(Target, {size: 20}), rarity: 'UNCOMMON' },

    // High Value
    TILE_64: { id: 'TILE_64', name: 'Skirmisher', description: 'Create a rank 64 monster.', icon: React.createElement(Shield, {size: 20}), rarity: 'COMMON' },
    TILE_256: { id: 'TILE_256', name: 'Knight', description: 'Create a rank 256 monster.', icon: React.createElement(Shield, {size: 20}), rarity: 'UNCOMMON' },
    TILE_1024: { id: 'TILE_1024', name: 'Warlord', description: 'Create a rank 1024 monster.', icon: React.createElement(Shield, {size: 20}), rarity: 'EPIC' },
    TILE_2048: { id: 'TILE_2048', name: 'Dragon Slayer', description: 'Create the rank 2048 avatar.', icon: React.createElement(Crown, {size: 20}), rarity: 'LEGENDARY' },

    // New Medals
    TACTICIAN: { id: 'TACTICIAN', name: 'Tactician', description: 'Win without using items.', icon: React.createElement(Briefcase, {size: 20}), rarity: 'EPIC' },
    SURVIVOR: { id: 'SURVIVOR', name: 'Survivor', description: 'Reach turn 500.', icon: React.createElement(Anchor, {size: 20}), rarity: 'RARE' },
    TYCOON: { id: 'TYCOON', name: 'Tycoon', description: 'Hold 5000 Gold.', icon: React.createElement(Coins, {size: 20}), rarity: 'LEGENDARY' },
    PACIFIST: { id: 'PACIFIST', name: 'Pacifist', description: 'Survive 100 turns without killing a boss.', icon: React.createElement(HeartOff, {size: 20}), rarity: 'UNCOMMON' },
};

export const STORY_ENTRIES: StoryEntry[] = [
    {
        id: 'intro',
        title: 'The Entrance',
        text: "They said the hoard was infinite. They didn't say the dungeon was alive. It inhales greed and exhales monsters. I am not the first to enter, but I intend to be the first to leave.",
        imageUrl: genUrl('dark dungeon entrance gates ominous', 301),
        order: 1,
        unlockCondition: (s, g, p) => p.gamesPlayed >= 1
    },
];

export const BOSS_DEFINITIONS: Record<string, any> = {
    'DEFAULT': { baseHealth: 50, imageUrl: BOSS_STYLE.imageUrl },
    'FUNGAL': { baseHealth: 80, imageUrl: genUrl('giant mushroom monster boss rpg', 900), color: 'from-purple-900 to-green-900', ringColor: 'ring-purple-500', particleColor: '#a855f7' },
    'MAGMA': { baseHealth: 150, imageUrl: genUrl('magma golem boss rpg fire', 901), color: 'from-orange-900 to-red-900', ringColor: 'ring-orange-500', particleColor: '#ea580c' },
    'LIBRARY': { baseHealth: 220, imageUrl: genUrl('arcane book golem magic runes boss rpg', 905), color: 'from-amber-900 to-yellow-800', ringColor: 'ring-amber-500', particleColor: '#f59e0b' },
    'CRYSTAL': { baseHealth: 300, imageUrl: genUrl('crystal ice dragon boss rpg', 902), color: 'from-cyan-900 to-blue-900', ringColor: 'ring-cyan-500', particleColor: '#06b6d4' },
    'AQUATIC': { baseHealth: 450, imageUrl: genUrl('kraken sea monster boss rpg', 906), color: 'from-teal-900 to-cyan-900', ringColor: 'ring-teal-500', particleColor: '#14b8a6' },
    'VOID': { baseHealth: 600, imageUrl: genUrl('void eldritch horror boss rpg', 903), color: 'from-fuchsia-950 to-black', ringColor: 'ring-fuchsia-600', particleColor: '#d946ef' },
    'STEAMPUNK': { baseHealth: 800, imageUrl: genUrl('giant clockwork mechanical dragon boss rpg', 907), color: 'from-orange-950 to-red-950', ringColor: 'ring-orange-600', particleColor: '#ea580c' },
    'HEAVEN': { baseHealth: 1000, imageUrl: genUrl('biblical angel warrior boss rpg', 904), color: 'from-yellow-100 to-amber-500', ringColor: 'ring-yellow-400', particleColor: '#facc15' },
    'COSMIC': { baseHealth: 1500, imageUrl: genUrl('galaxy cosmic entity god boss rpg', 908), color: 'from-indigo-950 to-violet-950', ringColor: 'ring-indigo-500', particleColor: '#6366f1' }
};

export const DAILY_MODIFIERS: DailyModifier[] = [
    { id: 'GOLD_RUSH', name: 'Gold Rush', description: 'Gold gain is doubled, but Bosses have 50% more HP.', icon: '💰', color: 'text-yellow-400' },
    { id: 'MANA_DROUGHT', name: 'Mana Drought', description: 'Shop prices +50%, but XP gain is increased by 50%.', icon: '🌵', color: 'text-orange-400' },
    { id: 'BOSS_RUSH', name: 'Boss Rush', description: 'Bosses spawn twice as often.', icon: '💀', color: 'text-red-500' },
    { id: 'GLASS_CANNON', name: 'Glass Cannon', description: 'You deal 2x damage to Bosses, but can carry only 1 item.', icon: '⚔️', color: 'text-cyan-400' },
    { id: 'VOLATILE_ALCHEMY', name: 'Volatile Alchemy', description: 'Potions are 50% off, but have a 10% chance to fail.', icon: '⚗️', color: 'text-green-400' },
    { id: 'CHAOS_THEORY', name: 'Chaos Theory', description: 'Rune spawn rate is tripled.', icon: '🌀', color: 'text-purple-400' },
];

export const getLevelRank = (level: number) => {
    if (level < 5) return { title: 'Novice', icon: Trophy, bg: 'from-slate-600 to-slate-800', color: 'text-slate-200' };
    if (level < 10) return { title: 'Apprentice', icon: Star, bg: 'from-blue-600 to-blue-800', color: 'text-blue-200' };
    if (level < 20) return { title: 'Warrior', icon: Swords, bg: 'from-red-600 to-red-800', color: 'text-red-200' };
    if (level < 30) return { title: 'Champion', icon: Shield, bg: 'from-amber-600 to-amber-800', color: 'text-amber-200' };
    if (level < 40) return { title: 'Legend', icon: Zap, bg: 'from-purple-600 to-purple-800', color: 'text-purple-200' };
    return { title: 'Demigod', icon: LayoutGrid, bg: 'from-yellow-400 to-yellow-600', color: 'text-yellow-100' };
};

export const CLASS_SKILL_TREES: Record<HeroClass, SkillNodeDefinition[]> = {
    [HeroClass.ADVENTURER]: [
        { id: 'ADV_1', title: 'Survivor', description: 'Gain 10% more Score.', icon: React.createElement(Star, {size: 20}), x: 50, y: 80, reqLevel: 1, cost: 1 },
        { id: 'ADV_2', title: 'Lucky Find', description: 'Slightly increased item drop rate.', icon: React.createElement(Coins, {size: 20}), x: 30, y: 60, reqLevel: 3, parentId: 'ADV_1', cost: 1 },
        { id: 'ADV_3', title: 'Veteran', description: 'Gain 10% more Gold.', icon: React.createElement(Trophy, {size: 20}), x: 70, y: 60, reqLevel: 5, parentId: 'ADV_1', cost: 1 },
        { id: 'ADV_4', title: 'Haggler', description: 'Shop prices are 10% cheaper.', icon: React.createElement(Hand, {size: 20}), x: 50, y: 40, reqLevel: 10, parentId: 'ADV_2', cost: 2 },
        { id: 'ADV_5', title: 'Archaeologist', description: 'Rune spawn rate +20%.', icon: React.createElement(Map, {size: 20}), x: 50, y: 20, reqLevel: 20, parentId: 'ADV_4', cost: 3 }
    ],
    [HeroClass.WARRIOR]: [
        { id: 'WAR_1', title: 'Vanguard', description: 'Start run with a Bomb Scroll.', icon: React.createElement(Swords, {size: 20}), x: 50, y: 80, reqLevel: 4, cost: 1, effect: (s) => ({ inventory: [...s.inventory, { id: createId(), type: ItemType.BOMB_SCROLL, name: 'Bomb Scroll', description: 'Destroy 3 tiles', icon: '💣' }] }) },
        { id: 'WAR_2', title: 'Heavy Handed', description: '10% chance for tiles to spawn as Tier 2 (Rat).', icon: React.createElement(Hammer, {size: 20}), x: 30, y: 60, reqLevel: 6, parentId: 'WAR_1', cost: 1 },
        { id: 'WAR_3', title: 'Combat Veteran', description: 'Battle Items are 20% cheaper.', icon: React.createElement(Shield, {size: 20}), x: 70, y: 60, reqLevel: 8, parentId: 'WAR_1', cost: 1 },
        { id: 'WAR_4', title: 'Battle Hardened', description: 'Deal 20% more damage to Bosses.', icon: React.createElement(Skull, {size: 20}), x: 50, y: 40, reqLevel: 12, parentId: 'WAR_3', cost: 2 },
        { id: 'WAR_5', title: 'Whirlwind Mastery', description: 'Reduce Whirlwind cooldown by 10 turns.', icon: React.createElement(Zap, {size: 20}), x: 50, y: 20, reqLevel: 15, parentId: 'WAR_4', cost: 3 }
    ],
    [HeroClass.ROGUE]: [
        { id: 'ROG_1', title: 'Sticky Fingers', description: 'Start run with a Reroll Token.', icon: React.createElement(Hand, {size: 20}), x: 50, y: 80, reqLevel: 6, cost: 1, effect: (s) => ({ inventory: [...s.inventory, { id: createId(), type: ItemType.REROLL_TOKEN, name: 'Reroll Token', description: 'Shuffle board', icon: '🎲' }] }) },
        { id: 'ROG_2', title: 'Penny Pincher', description: 'Shop prices are 10% cheaper.', icon: React.createElement(Coins, {size: 20}), x: 30, y: 60, reqLevel: 8, parentId: 'ROG_1', cost: 1 },
        { id: 'ROG_3', title: 'Gold Digger', description: 'Gain 20% more Gold from pickups.', icon: React.createElement(Trophy, {size: 20}), x: 70, y: 60, reqLevel: 10, parentId: 'ROG_1', cost: 1 },
        { id: 'ROG_4', title: 'Lucky Charm', description: 'Runes spawn 10% more often.', icon: React.createElement(Star, {size: 20}), x: 50, y: 40, reqLevel: 14, parentId: 'ROG_3', cost: 2 },
        { id: 'ROG_5', title: 'Master Thief', description: 'Start runs with 2 random items.', icon: React.createElement(Briefcase, {size: 20}), x: 50, y: 20, reqLevel: 18, parentId: 'ROG_4', cost: 3 }
    ],
    [HeroClass.MAGE]: [
        { id: 'MAG_1', title: 'Apprentice', description: 'Start run with an XP Potion.', icon: React.createElement(BookOpen, {size: 20}), x: 50, y: 80, reqLevel: 15, cost: 1, effect: (s) => ({ inventory: [...s.inventory, { id: createId(), type: ItemType.XP_POTION, name: 'XP Potion', description: 'Gain 1000 XP', icon: '🧪' }] }) },
        { id: 'MAG_2', title: 'Arcane Focus', description: 'Class Ability Cooldown reduced by 10%.', icon: React.createElement(Zap, {size: 20}), x: 30, y: 60, reqLevel: 17, parentId: 'MAG_1', cost: 1 },
        { id: 'MAG_3', title: 'Scholar', description: 'Gain 15% more XP.', icon: React.createElement(Star, {size: 20}), x: 70, y: 60, reqLevel: 20, parentId: 'MAG_1', cost: 1 },
        { id: 'MAG_4', title: 'Alchemy', description: 'Potions are 20% cheaper.', icon: React.createElement(Droplets, {size: 20}), x: 50, y: 40, reqLevel: 25, parentId: 'MAG_3', cost: 2 },
        { id: 'MAG_5', title: 'Time Warp', description: 'Start run with a Chronos Rune on board.', icon: React.createElement(Hourglass, {size: 20}), x: 50, y: 20, reqLevel: 30, parentId: 'MAG_4', cost: 3 }
    ],
    [HeroClass.PALADIN]: [
        { id: 'PAL_1', title: 'Squire', description: 'Start run with a Golden Rune.', icon: React.createElement(Shield, {size: 20}), x: 50, y: 80, reqLevel: 10, cost: 1, effect: (s) => ({ inventory: [...s.inventory, { id: createId(), type: ItemType.GOLDEN_RUNE, name: 'Golden Rune', description: 'Next spawn golden', icon: '✨' }] }) },
        { id: 'PAL_2', title: 'Smite Evil', description: 'Bosses spawn with 10% less HP.', icon: React.createElement(Sun, {size: 20}), x: 30, y: 60, reqLevel: 15, parentId: 'PAL_1', cost: 1 },
        { id: 'PAL_3', title: 'Justicar', description: 'Debuffs expire 20% faster.', icon: React.createElement(Scale, {size: 20}), x: 70, y: 60, reqLevel: 20, parentId: 'PAL_1', cost: 1 },
        { id: 'PAL_4', title: 'Sanctuary', description: 'Gain 10% more Gold.', icon: React.createElement(Coins, {size: 20}), x: 50, y: 40, reqLevel: 25, parentId: 'PAL_2', cost: 2 },
        { id: 'PAL_5', title: 'Divine Intervention', description: 'Start run with a Midas Potion.', icon: React.createElement(Sparkles, {size: 20}), x: 50, y: 20, reqLevel: 35, parentId: 'PAL_4', cost: 3, effect: (s) => ({ inventory: [...s.inventory, { id: createId(), type: ItemType.MIDAS_POTION, name: 'Midas Potion', description: '2x Gold', icon: '⚱️' }] }) }
    ],
    [HeroClass.DRAGON_SLAYER]: [
        { id: 'DS_1', title: 'Hunter', description: 'Start run with Siege Breaker.', icon: React.createElement(Crosshair, {size: 20}), x: 50, y: 80, reqLevel: 20, cost: 1, effect: (s) => ({ inventory: [...s.inventory, { id: createId(), type: ItemType.SIEGE_BREAKER, name: 'Siege Breaker', description: '3x Boss Dmg', icon: '🔨' }] }) },
        { id: 'DS_2', title: 'Big Game', description: 'Deal 25% more damage to Bosses.', icon: React.createElement(Skull, {size: 20}), x: 30, y: 60, reqLevel: 25, parentId: 'DS_1', cost: 1 },
        { id: 'DS_3', title: 'Loot Hoarder', description: 'Gain 20% more Score.', icon: React.createElement(Trophy, {size: 20}), x: 70, y: 60, reqLevel: 30, parentId: 'DS_1', cost: 1 },
        { id: 'DS_4', title: 'Dragon Scale', description: 'Shop prices are 15% cheaper.', icon: React.createElement(Shield, {size: 20}), x: 50, y: 40, reqLevel: 40, parentId: 'DS_3', cost: 2 },
        { id: 'DS_5', title: 'Apex Predator', description: 'Start run with 1000 Gold.', icon: React.createElement(Crown, {size: 20}), x: 50, y: 20, reqLevel: 50, parentId: 'DS_4', cost: 3, effect: (s) => ({ gold: s.gold + 1000 }) }
    ]
};

// --- NEW CONSTANTS FOR GAUNTLET & CLASSES ---

export const CLASS_ABILITIES: Record<HeroClass, { name: string, desc: string, icon: React.ReactNode, cooldown: number, color: string }> = {
    [HeroClass.WARRIOR]: { name: 'Whirlwind', desc: 'Destroy a random row of tiles.', icon: React.createElement(Swords, {size: 16}), cooldown: 40, color: 'red' },
    [HeroClass.MAGE]: { name: 'Transmute', desc: 'Upgrade 3 random low-tier tiles.', icon: React.createElement(Zap, {size: 16}), cooldown: 50, color: 'blue' },
    [HeroClass.ROGUE]: { name: 'Pilfer', desc: 'Steal Gold and Shuffle the board.', icon: React.createElement(Coins, {size: 16}), cooldown: 35, color: 'green' },
    [HeroClass.PALADIN]: { name: 'Smite', desc: 'Deal massive damage to a Boss (or highest tile).', icon: React.createElement(Sun, {size: 16}), cooldown: 60, color: 'yellow' },
    [HeroClass.DRAGON_SLAYER]: { name: 'Execute', desc: 'Instantly kill any Boss below 30% HP.', icon: React.createElement(Skull, {size: 16}), cooldown: 70, color: 'orange' },
    [HeroClass.ADVENTURER]: { name: 'Second Wind', desc: 'Spawn a Potion or Scroll.', icon: React.createElement(Heart, {size: 16}), cooldown: 45, color: 'slate' },
};

export const ARTIFACTS: Artifact[] = [
    { id: 'VAMP_FANG', name: 'Vampiric Fang', description: 'Heal 1HP (Boss/Gauntlet) on 512+ merges.', icon: '🧛', rarity: 'RARE', effectId: 'HEAL_ON_MERGE' },
    { id: 'MIDAS_COIN', name: 'Midas Coin', description: 'Gold pickups are worth 50% more.', icon: '🪙', rarity: 'COMMON', effectId: 'GOLD_BOOST' },
    { id: 'ANCIENT_MAP', name: 'Ancient Map', description: 'Reveal map nodes 1 tier deeper.', icon: '📜', rarity: 'COMMON', effectId: 'MAP_VISION' },
    { id: 'VOID_PRISM', name: 'Void Prism', description: 'Small chance to duplicate a merged tile.', icon: '💎', rarity: 'LEGENDARY', effectId: 'DUPE_CHANCE' },
    { id: 'WAR_HORN', name: 'War Horn', description: 'Start combat with +20% Class Ability charge.', icon: '📯', rarity: 'RARE', effectId: 'START_CHARGE' },
];
