

import { TileType, ItemType, GameStats, GameState, Stage, Achievement, HeroClass, CraftingRecipe, DailyModifier } from './types';
import { Trophy, Star, Shield, Zap, Swords, LayoutGrid, Map } from 'lucide-react';

export const GRID_SIZE_INITIAL = 4;

// Helper to generate consistent placeholder image URLs
export const genUrl = (prompt: string, seed: number) => 
  `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&seed=${seed}`;

export const getXpThreshold = (level: number) => Math.floor(1000 * Math.pow(level, 1.5));

export const STAGES: Stage[] = [
    { name: 'Dungeon Entrance', minLevel: 1, backgroundUrl: genUrl('dark dungeon entrance torches stone walls rpg', 101), colorTheme: 'text-slate-200', barColor: 'from-slate-600 to-slate-500', themeId: 'DEFAULT' },
    { name: 'Fungal Caverns', minLevel: 5, backgroundUrl: genUrl('glowing mushroom cave bioluminescent purple green rpg', 102), colorTheme: 'text-purple-300', barColor: 'from-purple-600 to-green-500', themeId: 'FUNGAL' },
    { name: 'Molten Depths', minLevel: 10, backgroundUrl: genUrl('lava cave volcano magma fire rpg', 103), colorTheme: 'text-red-300', barColor: 'from-red-600 to-orange-500', themeId: 'MAGMA' },
    { name: 'Crystal Spire', minLevel: 20, backgroundUrl: genUrl('ice crystal cave blue frozen magical rpg', 104), colorTheme: 'text-cyan-300', barColor: 'from-cyan-600 to-blue-500', themeId: 'CRYSTAL' },
    { name: 'Void Realm', minLevel: 30, backgroundUrl: genUrl('cosmic void space stars nebula purple dark rpg', 105), colorTheme: 'text-fuchsia-300', barColor: 'from-fuchsia-900 to-purple-800', themeId: 'VOID' },
    { name: 'Celestial Citadel', minLevel: 40, backgroundUrl: genUrl('heavenly clouds golden gates divine light rpg', 106), colorTheme: 'text-yellow-200', barColor: 'from-yellow-400 to-amber-200', themeId: 'HEAVEN' }
];

export const getStage = (level: number) => {
    return [...STAGES].reverse().find(s => level >= s.minLevel) || STAGES[0];
};

export const getStageBackground = (name: string) => STAGES.find(s => s.name === name)?.backgroundUrl || '';

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

// Alternative Tileset: Undead
export const UNDEAD_TILE_STYLES: Record<number, any> = {
  ...TILE_STYLES,
  2: { label: 'BONE', color: 'from-stone-700 to-stone-900', ringColor: 'ring-stone-500', icon: '🦴', glow: 'shadow-stone-500/50', imageUrl: genUrl('pile of bones skeleton rpg', 1002), particleColor: '#a8a29e' },
  4: { label: 'SKULL', color: 'from-gray-500 to-gray-700', ringColor: 'ring-gray-400', icon: '💀', glow: 'shadow-gray-400/50', imageUrl: genUrl('human skull sinister rpg', 1004), particleColor: '#9ca3af' },
  8: { label: 'ZOMBIE', color: 'from-green-800 to-green-950', ringColor: 'ring-green-600', icon: '🧟', glow: 'shadow-green-600/50', imageUrl: genUrl('rotting zombie monster rpg', 1008), particleColor: '#16a34a' },
  16: { label: 'GHOUL', color: 'from-teal-800 to-teal-950', ringColor: 'ring-teal-600', icon: '😱', glow: 'shadow-teal-600/50', imageUrl: genUrl('ghoul monster graveyard rpg', 1016), particleColor: '#0d9488' },
  32: { label: 'WRAITH', color: 'from-indigo-800 to-black', ringColor: 'ring-indigo-600', icon: '👻', glow: 'shadow-indigo-600/50', imageUrl: genUrl('shadow wraith phantom rpg', 1032), particleColor: '#4f46e5' },
  64: { label: 'MUMMY', color: 'from-yellow-800 to-yellow-950', ringColor: 'ring-yellow-600', icon: '🤕', glow: 'shadow-yellow-600/50', imageUrl: genUrl('ancient mummy bandages rpg', 1064), particleColor: '#ca8a04' },
  128: { label: 'VAMPIRE', color: 'from-red-800 to-red-950', ringColor: 'ring-red-600', icon: '🧛', glow: 'shadow-red-600/50', imageUrl: genUrl('vampire lord dracula rpg', 1128), particleColor: '#dc2626' },
};

// Alternative Tileset: Infernal
export const INFERNAL_TILE_STYLES: Record<number, any> = {
  ...TILE_STYLES,
  2: { label: 'EMBER', color: 'from-orange-600 to-red-600', ringColor: 'ring-orange-500', icon: '🔥', glow: 'shadow-orange-500/50', imageUrl: genUrl('glowing ember coal fire rpg', 2002), particleColor: '#f97316' },
  4: { label: 'IMP', color: 'from-red-600 to-red-800', ringColor: 'ring-red-500', icon: '😈', glow: 'shadow-red-500/50', imageUrl: genUrl('mischievous red imp demon rpg', 2004), particleColor: '#ef4444' },
  8: { label: 'HELLHOUND', color: 'from-orange-800 to-red-900', ringColor: 'ring-orange-600', icon: '🐕', glow: 'shadow-orange-600/50', imageUrl: genUrl('hellhound fire dog rpg', 2008), particleColor: '#ea580c' },
  16: { label: 'MAGMA', color: 'from-red-800 to-stone-900', ringColor: 'ring-red-600', icon: '🌋', glow: 'shadow-red-600/50', imageUrl: genUrl('magma golem lava rpg', 2016), particleColor: '#dc2626' },
  32: { label: 'IFRIT', color: 'from-yellow-600 to-orange-700', ringColor: 'ring-yellow-500', icon: '🧞', glow: 'shadow-yellow-500/50', imageUrl: genUrl('fire djinn ifrit rpg', 2032), particleColor: '#ca8a04' },
  64: { label: 'DRAKE', color: 'from-red-700 to-red-950', ringColor: 'ring-red-500', icon: '🐲', glow: 'shadow-red-500/50', imageUrl: genUrl('fire drake dragon rpg', 2064), particleColor: '#b91c1c' },
  128: { label: 'BALROG', color: 'from-orange-900 to-black', ringColor: 'ring-orange-600', icon: '👹', glow: 'shadow-orange-600/50', imageUrl: genUrl('shadow flame demon balrog rpg', 2128), particleColor: '#7c2d12' },
};

export const THEME_STYLES: Record<string, any> = {
    DEFAULT: TILE_STYLES,
    UNDEAD: UNDEAD_TILE_STYLES,
    INFERNAL: INFERNAL_TILE_STYLES
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

export const SHOP_ITEMS = [
    { id: ItemType.XP_POTION, name: "XP Potion", desc: "Instantly gain 1000 XP.", price: 150, category: 'CONSUMABLE', icon: '🧪' },
    { id: ItemType.BOMB_SCROLL, name: "Bomb Scroll", desc: "Destroys 3 lowest value tiles.", price: 300, category: 'BATTLE', icon: '📜' },
    { id: ItemType.GOLDEN_RUNE, name: "Golden Rune", desc: "Next spawn is a Golden Tile (Bonus Gold).", price: 500, category: 'MAGIC', icon: '✨' },
    { id: ItemType.REROLL_TOKEN, name: "Reroll Token", desc: "Shuffle the board completely.", price: 200, category: 'MAGIC', icon: '🎲' },
    { id: ItemType.LUCKY_CHARM, name: "Lucky Charm", desc: "Increases loot drop chance for the run.", price: 800, category: 'MAGIC', icon: '🍀' },
    { id: ItemType.CHAIN_CATALYST, name: "Chain Catalyst", desc: "Activates Cascades for 10 turns.", price: 400, category: 'MAGIC', icon: '⛓️' },
    { id: ItemType.LUCKY_DICE, name: "Lucky Dice", desc: "Increases Rune spawn rate.", price: 600, category: 'MAGIC', icon: '🎲' },
    { id: ItemType.MIDAS_POTION, name: "Midas Potion", desc: "Double Gold gain for 50 turns.", price: 750, category: 'CONSUMABLE', icon: '⚱️' },
    { id: ItemType.SIEGE_BREAKER, name: "Siege Breaker", desc: "Next boss hit deals 3x damage.", price: 450, category: 'BATTLE', icon: '🔨' },
    { id: ItemType.VOID_STONE, name: "Void Stone", desc: "Consumes 1 weak tile per turn (10 turns).", price: 1000, category: 'MAGIC', icon: '🌑' },
    { id: ItemType.RADIANT_AURA, name: "Radiant Aura", desc: "+50% XP for 20 turns.", price: 900, category: 'MAGIC', icon: '☀️' },
    { id: ItemType.THUNDER_SCROLL, name: "Thunder Scroll", desc: "Instantly triggers a Cascade chain.", price: 1200, category: 'BATTLE', icon: '⚡' },
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

export const ACHIEVEMENTS: Achievement[] = [
    { id: 'first_merge', name: 'First Steps', description: 'Merge two tiles.', icon: '👶', condition: (s) => s.totalMerges >= 1, reward: { xp: 100 } },
    { id: 'big_combo', name: 'Combo Master', description: 'Achieve a x5 Combo.', icon: '⚡', condition: (s) => s.highestCombo >= 5, reward: { gold: 100 } },
    { id: 'slayer', name: 'Boss Slayer', description: 'Defeat your first boss.', icon: '💀', condition: (s) => s.bossesDefeated >= 1, reward: { gold: 500, xp: 1000 } },
    { id: 'hoarder', name: 'Hoarder', description: 'Collect 1000 Gold.', icon: '💰', condition: (s) => s.goldCollected >= 1000, reward: { item: ItemType.LUCKY_CHARM } },
    { id: 'legendary', name: 'Legendary', description: 'Create a 1024 Tile.', icon: '🐲', condition: (s) => s.highestTile >= 1024, reward: { item: ItemType.GOLDEN_RUNE } },
];

export const BOSS_DEFINITIONS: Record<string, any> = {
    'DEFAULT': { baseHealth: 50, imageUrl: BOSS_STYLE.imageUrl },
    'FUNGAL': { baseHealth: 80, imageUrl: genUrl('giant mushroom monster boss rpg', 900), color: 'from-purple-900 to-green-900', ringColor: 'ring-purple-500', particleColor: '#a855f7' },
    'MAGMA': { baseHealth: 150, imageUrl: genUrl('magma golem boss rpg fire', 901), color: 'from-orange-900 to-red-900', ringColor: 'ring-orange-500', particleColor: '#ea580c' },
    'CRYSTAL': { baseHealth: 300, imageUrl: genUrl('crystal ice dragon boss rpg', 902), color: 'from-cyan-900 to-blue-900', ringColor: 'ring-cyan-500', particleColor: '#06b6d4' },
    'VOID': { baseHealth: 600, imageUrl: genUrl('void eldritch horror boss rpg', 903), color: 'from-fuchsia-950 to-black', ringColor: 'ring-fuchsia-600', particleColor: '#d946ef' },
    'HEAVEN': { baseHealth: 1000, imageUrl: genUrl('biblical angel warrior boss rpg', 904), color: 'from-yellow-100 to-amber-500', ringColor: 'ring-yellow-400', particleColor: '#facc15' }
};

export const DAILY_MODIFIERS: DailyModifier[] = [
    { id: 'GOLD_RUSH', name: 'Gold Rush', description: 'Gold gain is doubled, but Bosses have 50% more HP.', icon: '💰', color: 'text-yellow-400' },
    { id: 'MANA_DROUGHT', name: 'Mana Drought', description: 'Shop prices +50%, but XP gain is increased by 50%.', icon: '🌵', color: 'text-orange-400' },
    { id: 'BOSS_RUSH', name: 'Boss Rush', description: 'Bosses spawn twice as often.', icon: '💀', color: 'text-red-500' },
    { id: 'GLASS_CANNON', name: 'Glass Cannon', description: 'You deal 2x damage to Bosses, but can carry only 1 item.', icon: '⚔️', color: 'text-cyan-400' },
    { id: 'VOLATILE_ALCHEMY', name: 'Volatile Alchemy', description: 'Potions are 50% off, but have a 10% chance to fail.', icon: '⚗️', color: 'text-green-400' },
    { id: 'CHAOS_THEORY', name: 'Chaos Theory', description: 'Rune spawn rate is tripled.', icon: '🌀', color: 'text-purple-400' },
];

export const MUSIC_PATHS = {
    SPLASH: 'https://cdn.pixabay.com/audio/2022/03/24/audio_33a7e4e116.mp3', // Epic intro placeholder
    DEATH: 'https://cdn.pixabay.com/audio/2021/08/30/audio_c3c3325257.mp3', // Sad placeholder
    GAMEPLAY: [
        'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3', // Ambient 1
        'https://cdn.pixabay.com/audio/2021/09/06/audio_9c08796850.mp3'  // Ambient 2
    ]
};

export const getLevelRank = (level: number) => {
    if (level < 5) return { title: 'Novice', icon: Trophy, bg: 'from-slate-600 to-slate-800', color: 'text-slate-200' };
    if (level < 10) return { title: 'Apprentice', icon: Star, bg: 'from-blue-600 to-blue-800', color: 'text-blue-200' };
    if (level < 20) return { title: 'Warrior', icon: Swords, bg: 'from-red-600 to-red-800', color: 'text-red-200' };
    if (level < 30) return { title: 'Champion', icon: Shield, bg: 'from-amber-600 to-amber-800', color: 'text-amber-200' };
    if (level < 40) return { title: 'Legend', icon: Zap, bg: 'from-purple-600 to-purple-800', color: 'text-purple-200' };
    return { title: 'Demigod', icon: LayoutGrid, bg: 'from-yellow-400 to-yellow-600', color: 'text-yellow-100' };
};
