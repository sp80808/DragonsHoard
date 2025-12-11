
import { TileType, ItemType, InventoryItem, Stage, CraftingRecipe, Achievement, GameStats, GameState } from './types';
import { Shield, Scroll, Swords, Star, Crown, Flame, Zap, Eye, Gem, Skull, Trophy } from 'lucide-react';
import React from 'react';

export const GRID_SIZE_INITIAL = 4;
export const WINNING_VALUE = 2048;

export const SHOP_CONFIG = {
    RESTOCK_INTERVAL: 50,
    INFLATION_RATE: 0.15, // 15% increase per buy
    STOCK_LIMITS: {
        'CONSUMABLE': 5,
        'MAGIC': 2,
        'BATTLE': 3
    }
};

export const MUSIC_PATHS = {
  SPLASH: 'music/dragons-horde-splah.mp3', 
  DEATH: 'music/death-music.mp3',
  GAMEPLAY: [
    'music/gameplay1.mp3',
    'music/gameplay2.mp3',
    'music/gameplay3.mp3'
  ]
};

export const getXpThreshold = (level: number) => Math.floor(800 * Math.pow(level, 1.3));

const genUrl = (prompt: string, seed: string | number = 42) => 
  `https://image.pollinations.ai/prompt/dark fantasy rpg game asset ${prompt} high quality dramatic lighting?width=256&height=256&nologo=true&seed=${seed}`;

const bgUrl = (prompt: string, seed: string | number) =>
  `https://image.pollinations.ai/prompt/dark fantasy environment background ${prompt} cinematic atmospheric 8k?width=1024&height=1024&nologo=true&seed=${seed}`;

export const STAGES: Stage[] = [
    { name: 'TheDungeon', minLevel: 1, backgroundUrl: bgUrl('ancient stone dungeon torchlight', 1), colorTheme: 'text-slate-200', barColor: 'from-slate-600 to-slate-400', themeId: 'DEFAULT' },
    { name: 'FungalCaverns', minLevel: 5, backgroundUrl: bgUrl('glowing mushroom cave bioluminescent purple', 5), colorTheme: 'text-purple-300', barColor: 'from-purple-600 to-indigo-500', themeId: 'FUNGAL' },
    { name: 'MoltenDepths', minLevel: 10, backgroundUrl: bgUrl('volcanic lava cave magma fire', 10), colorTheme: 'text-orange-300', barColor: 'from-red-600 to-orange-500', themeId: 'MAGMA' },
    { name: 'CrystalSpire', minLevel: 20, backgroundUrl: bgUrl('crystal palace celestial floating islands', 20), colorTheme: 'text-cyan-200', barColor: 'from-cyan-500 to-blue-400', themeId: 'CRYSTAL' },
    { name: 'VoidRealm', minLevel: 30, backgroundUrl: bgUrl('cosmic void horror eldritch stars', 30), colorTheme: 'text-fuchsia-300', barColor: 'from-fuchsia-800 to-purple-900', themeId: 'VOID' },
    { name: 'CelestialCitadel', minLevel: 40, backgroundUrl: bgUrl('heavenly golden throne clouds divine light', 40), colorTheme: 'text-yellow-200', barColor: 'from-yellow-600 to-amber-500', themeId: 'CELESTIAL' },
    { name: 'AetherSanctum', minLevel: 50, backgroundUrl: bgUrl('pure white arcane energy dimension rune circles', 50), colorTheme: 'text-emerald-200', barColor: 'from-emerald-600 to-teal-400', themeId: 'AETHER' },
    { name: 'NebulaNexus', minLevel: 60, backgroundUrl: bgUrl('colorful nebula space galaxy swirling stars', 60), colorTheme: 'text-pink-300', barColor: 'from-pink-600 to-rose-500', themeId: 'NEBULA' },
    { name: 'EldritchHorizon', minLevel: 75, backgroundUrl: bgUrl('event horizon black hole accretion disk terrifying', 75), colorTheme: 'text-slate-100', barColor: 'from-slate-100 to-slate-400', themeId: 'ELDRITCH' }
];

export const getStage = (level: number): Stage => {
    return STAGES.slice().reverse().find(s => level >= s.minLevel) || STAGES[0];
};

export const getStageBackground = (stageName: string) => {
    return STAGES.find(s => s.name === stageName)?.backgroundUrl || STAGES[0].backgroundUrl;
};

// Base Styles (Default Dungeon)
const BASE_STYLES: Record<number, any> = {
  2: { label: 'Slime', color: 'from-green-900 to-green-700', ringColor: 'ring-green-500', icon: '🟢', glow: 'shadow-green-500/50', imageUrl: genUrl('cute green slime blob monster', 2), particleColor: '#22c55e' },
  4: { label: 'Goblin', color: 'from-emerald-900 to-teal-800', ringColor: 'ring-emerald-500', icon: '👺', glow: 'shadow-emerald-500/50', imageUrl: genUrl('snarling green goblin warrior face', 4), particleColor: '#10b981' },
  8: { label: 'Orc', color: 'from-red-900 to-red-700', ringColor: 'ring-red-500', icon: '👹', glow: 'shadow-red-500/50', imageUrl: genUrl('fierce red orc barbarian', 8), particleColor: '#ef4444' },
  16: { label: 'Troll', color: 'from-stone-700 to-stone-500', ringColor: 'ring-stone-400', icon: '🪨', glow: 'shadow-stone-500/50', imageUrl: genUrl('grey rock troll giant', 16), particleColor: '#78716c' },
  32: { label: 'Drake', color: 'from-orange-900 to-orange-700', ringColor: 'ring-orange-500', icon: '🦎', glow: 'shadow-orange-500/50', imageUrl: genUrl('orange scaled fire drake', 32), particleColor: '#f97316' },
  64: { label: 'Wyvern', color: 'from-blue-900 to-blue-700', ringColor: 'ring-blue-500', icon: '🐉', glow: 'shadow-blue-500/50', imageUrl: genUrl('blue lightning wyvern flying', 64), particleColor: '#3b82f6' },
  128: { label: 'Demon', color: 'from-purple-900 to-purple-700', ringColor: 'ring-purple-500', icon: '👿', glow: 'shadow-purple-500/50', imageUrl: genUrl('dark purple horned demon lord', 128), particleColor: '#a855f7' },
  256: { label: 'Hydra', color: 'from-teal-900 to-teal-700', ringColor: 'ring-teal-500', icon: '🐍', glow: 'shadow-teal-500/50', imageUrl: genUrl('multi headed green hydra serpent', 256), particleColor: '#14b8a6' },
  512: { label: 'Giant', color: 'from-yellow-900 to-yellow-700', ringColor: 'ring-yellow-500', icon: '🗿', glow: 'shadow-yellow-500/50', imageUrl: genUrl('colossal mountain giant titan', 512), particleColor: '#eab308' },
  1024: { label: 'Dragon', color: 'from-rose-900 to-rose-700', ringColor: 'ring-rose-500', icon: '🐲', glow: 'shadow-rose-500/50', imageUrl: genUrl('massive red ancient dragon breathing fire', 1024), particleColor: '#f43f5e' },
  2048: { label: 'God', color: 'from-amber-600 via-yellow-500 to-amber-200', ringColor: 'ring-amber-400', icon: '👑', glow: 'shadow-amber-500/80', imageUrl: genUrl('golden dragon god divine glowing aura', 2048), particleColor: '#fbbf24' },
  4096: { label: 'Titan', color: 'from-indigo-950 via-purple-900 to-indigo-800', ringColor: 'ring-indigo-400', icon: '🪐', glow: 'shadow-indigo-500/100', imageUrl: genUrl('cosmic titan giant holding planet galaxy', 4096), particleColor: '#818cf8' },
  8192: { label: 'Eternal', color: 'from-slate-950 via-black to-slate-900', ringColor: 'ring-white', icon: '♾️', glow: 'shadow-white/80', imageUrl: genUrl('abstract entity of pure light and darkness eternity', 8192), particleColor: '#ffffff' },
};

// Theme Overrides (Applied on top of Base Styles)
export const THEME_STYLES: Record<string, Record<number, Partial<typeof BASE_STYLES[2]>>> = {
    'FUNGAL': {
        2: { label: 'Spore', imageUrl: genUrl('glowing purple mushroom spore cute', 102), particleColor: '#d8b4fe' },
        4: { label: 'Myconid', imageUrl: genUrl('mushroom warrior myconid', 104), particleColor: '#c084fc' },
        8: { label: 'Shroom', imageUrl: genUrl('angry red mushroom monster', 108), particleColor: '#f472b6' },
        16: { label: 'Fungus', imageUrl: genUrl('giant walking fungus golem', 116), particleColor: '#a855f7' },
        32: { label: 'Mold Drake', imageUrl: genUrl('rotten zombie drake fungus', 132), color: 'from-lime-900 to-green-900', particleColor: '#65a30d' },
        64: { label: 'Sporebat', imageUrl: genUrl('giant bat dripping glowing purple spores', 164), color: 'from-purple-900 to-slate-900', particleColor: '#9333ea' },
        128: { label: 'Rot Demon', imageUrl: genUrl('decaying fungal demon lord', 1128), color: 'from-fuchsia-900 to-purple-950', particleColor: '#c026d3' },
        256: { label: 'Hydra', imageUrl: genUrl('purple fungal hydra heads', 1256), color: 'from-violet-900 to-purple-900', particleColor: '#7c3aed' },
        512: { label: 'Colossus', imageUrl: genUrl('gigantic mushroom colossus titan', 1512), color: 'from-indigo-900 to-purple-900', particleColor: '#4f46e5' }
    },
    'MAGMA': {
        2: { label: 'Ember', imageUrl: genUrl('cute living fireball ember floating spark', 202), color: 'from-orange-600 to-red-600', ringColor: 'ring-orange-400', particleColor: '#f97316' },
        4: { label: 'Imp', imageUrl: genUrl('mischievous red fire imp devil holding pitchfork', 204), color: 'from-red-700 to-orange-800', ringColor: 'ring-red-500', particleColor: '#ef4444' },
        8: { label: 'Magma Golem', imageUrl: genUrl('hulking golem made of molten rock and lava glowing cracks', 208), color: 'from-stone-900 to-red-900', ringColor: 'ring-orange-600', particleColor: '#b91c1c' },
        16: { label: 'Efreet', imageUrl: genUrl('fire genie efreet warrior muscular flames', 216), color: 'from-orange-700 to-amber-700', ringColor: 'ring-amber-500', particleColor: '#f59e0b' },
        32: { label: 'Salamander', imageUrl: genUrl('giant lava salamander lizard scales', 232), color: 'from-orange-900 to-red-900', particleColor: '#ea580c' },
        64: { label: 'Phoenix', imageUrl: genUrl('majestic reborn phoenix fire bird wingspread', 264), color: 'from-yellow-700 to-orange-800', particleColor: '#fbbf24' },
        128: { label: 'Hellion', imageUrl: genUrl('horned magma demon knight burning armor', 2128), color: 'from-red-950 to-orange-950', particleColor: '#7f1d1d' },
        256: { label: 'Lava Wyrm', imageUrl: genUrl('giant lava worm serpent erupting from ground', 2256), color: 'from-red-900 to-black', particleColor: '#450a0a' },
        512: { label: 'Surtr', imageUrl: genUrl('giant fire giant wielding flaming sword apocalypse', 2512), color: 'from-orange-950 to-red-950', particleColor: '#c2410c' }
    },
    'CRYSTAL': {
        2: { label: 'Shard', imageUrl: genUrl('floating blue crystal shard', 302), particleColor: '#a5f3fc' },
        4: { label: 'Geode', imageUrl: genUrl('living geode rock monster', 304), particleColor: '#67e8f9' },
        8: { label: 'Gargoyle', imageUrl: genUrl('crystalline gargoyle statue', 308), particleColor: '#22d3ee' },
        16: { label: 'Golem', imageUrl: genUrl('ice crystal golem', 316), particleColor: '#06b6d4' },
        32: { label: 'Drake', imageUrl: genUrl('crystal dragon drake', 332), color: 'from-cyan-800 to-blue-900', particleColor: '#0891b2' },
        64: { label: 'Construct', imageUrl: genUrl('floating arcane crystal construct', 364), color: 'from-blue-900 to-indigo-900', particleColor: '#2563eb' },
        128: { label: 'Wraith', imageUrl: genUrl('ghostly crystal wraith', 3128), color: 'from-cyan-900 to-slate-900', particleColor: '#0e7490' }
    },
    'VOID': {
        2: { label: 'Wisp', imageUrl: genUrl('dark purple void wisp ghost', 402), particleColor: '#d8b4fe' },
        4: { label: 'Shadow', imageUrl: genUrl('shadow creature silhouette eyes', 404), particleColor: '#c084fc' },
        8: { label: 'Specter', imageUrl: genUrl('terrifying void specter wraith', 408), particleColor: '#a855f7' },
        16: { label: 'Horror', imageUrl: genUrl('eldritch tentacle horror monster', 416), particleColor: '#9333ea' },
        32: { label: 'Beholder', imageUrl: genUrl('floating eye monster void', 432), color: 'from-purple-950 to-black', particleColor: '#7e22ce' },
        64: { label: 'Nightmare', imageUrl: genUrl('horse made of shadow and purple fire', 464), color: 'from-indigo-950 to-black', particleColor: '#4c1d95' },
        128: { label: 'Fiend', imageUrl: genUrl('dark void demon fiend', 4128), color: 'from-slate-950 to-black', particleColor: '#581c87' }
    },
    'CELESTIAL': {
        2: { label: 'Cherub', imageUrl: genUrl('tiny winged angel cherub', 502), particleColor: '#fef08a' },
        4: { label: 'Spirit', imageUrl: genUrl('glowing light spirit entity', 504), particleColor: '#fde047' },
        8: { label: 'Valkyrie', imageUrl: genUrl('golden armored valkyrie warrior', 508), particleColor: '#facc15' },
        16: { label: 'Angel', imageUrl: genUrl('biblically accurate angel wheels eyes', 516), particleColor: '#eab308' },
        32: { label: 'Pegasus', imageUrl: genUrl('winged white horse pegasus', 532), color: 'from-yellow-100 to-blue-100', particleColor: '#ca8a04' },
        64: { label: 'Virtue', imageUrl: genUrl('glowing warrior of light virtue', 564), color: 'from-yellow-200 to-amber-100', particleColor: '#a16207' },
        128: { label: 'Dominion', imageUrl: genUrl('four winged angel warrior', 5128), color: 'from-amber-200 to-yellow-400', particleColor: '#854d0e' }
    }
};

export const getTileStyle = (value: number, themeId: string = 'DEFAULT') => {
    const base = BASE_STYLES[value] || FALLBACK_STYLE;
    if (themeId === 'DEFAULT' || !THEME_STYLES[themeId]) return base;
    
    const override = THEME_STYLES[themeId][value];
    if (override) {
        return { ...base, ...override };
    }
    return base;
};

// Boss Visual Definitions by Theme
export const BOSS_DEFINITIONS: Record<string, { label: string, imageUrl: string, baseHealth: number, color: string }> = {
    'DEFAULT': { label: 'Lich', imageUrl: genUrl('undead lich king skeleton mage glowing eyes', 666), baseHealth: 20, color: 'from-slate-900 to-black' },
    'FUNGAL': { label: 'Rot King', imageUrl: genUrl('monstrous giant fungal king mushroom boss', 199), baseHealth: 40, color: 'from-purple-950 to-black' },
    'MAGMA': { label: 'Balrog', imageUrl: genUrl('giant fire demon balrog monster lava', 299), baseHealth: 60, color: 'from-orange-950 to-red-950' },
    'CRYSTAL': { label: 'Titan', imageUrl: genUrl('diamond crystal golem titan boss', 399), baseHealth: 80, color: 'from-cyan-950 to-blue-950' },
    'VOID': { label: 'The Eye', imageUrl: genUrl('terrifying giant eye eldritch horror void', 499), baseHealth: 100, color: 'from-fuchsia-950 to-black' },
    'CELESTIAL': { label: 'Seraph', imageUrl: genUrl('biblically accurate angel boss burning wheels', 599), baseHealth: 150, color: 'from-yellow-900 to-amber-950' },
    'AETHER': { label: 'Construct', imageUrl: genUrl('ancient arcane construct robot magic', 699), baseHealth: 200, color: 'from-emerald-950 to-teal-950' },
    'NEBULA': { label: 'Devourer', imageUrl: genUrl('galaxy eater space monster cosmic horror', 799), baseHealth: 250, color: 'from-indigo-950 to-black' },
    'ELDRITCH': { label: 'Entropy', imageUrl: genUrl('pure darkness entropy void monster', 899), baseHealth: 300, color: 'from-gray-950 to-black' },
};

// Export base for compatibility
export const TILE_STYLES = BASE_STYLES;

export const BOSS_STYLE = { label: 'BOSS', color: 'from-red-950 to-black', ringColor: 'ring-red-600', icon: '💀', glow: 'shadow-red-600/100', imageUrl: genUrl('terrifying skeleton lich king dark magic', 666), particleColor: '#ef4444' };
export const FALLBACK_STYLE = { label: '???', color: 'from-gray-800 to-black', ringColor: 'ring-gray-500', icon: '❓', glow: 'shadow-none', imageUrl: '', particleColor: '#ffffff' };

export const RUNE_STYLES: Record<string, any> = {
    [TileType.RUNE_MIDAS]: { label: 'MIDAS', color: 'from-yellow-800 to-yellow-900', ringColor: 'ring-yellow-400', icon: '💰', glow: 'shadow-yellow-400/50', imageUrl: genUrl('gold coin rune magical glowing', 777), particleColor: '#fbbf24' },
    [TileType.RUNE_CHRONOS]: { label: 'TIME', color: 'from-blue-800 to-blue-900', ringColor: 'ring-blue-400', icon: '⏳', glow: 'shadow-blue-400/50', imageUrl: genUrl('blue hourglass rune magical glowing', 888), particleColor: '#60a5fa' },
    [TileType.RUNE_VOID]: { label: 'VOID', color: 'from-purple-950 to-black', ringColor: 'ring-purple-600', icon: '⚫', glow: 'shadow-purple-600/50', imageUrl: genUrl('black hole void rune magical glowing', 999), particleColor: '#a855f7' },
};

export const SHOP_ITEMS = [
  { id: ItemType.XP_POTION, name: 'XP Potion', price: 100, desc: '+1000 XP instantly.', icon: '🧪', category: 'CONSUMABLE' },
  { id: ItemType.BOMB_SCROLL, name: 'Purge Scroll', price: 250, desc: 'Destroy 3 weakest tiles.', icon: '📜', category: 'BATTLE' },
  { id: ItemType.THUNDER_SCROLL, name: 'Storm Scroll', price: 500, desc: 'Trigger a massive cascade.', icon: '⚡', category: 'BATTLE' },
  { id: ItemType.REROLL_TOKEN, name: 'Fate Token', price: 150, desc: 'Reroll the board once.', icon: '🎲', category: 'CONSUMABLE' },
  { id: ItemType.GOLDEN_RUNE, name: 'Golden Rune', price: 400, desc: 'Next spawn is Tier 3 (16).', icon: '🌟', category: 'MAGIC' },
  { id: ItemType.LUCKY_CHARM, name: 'Lucky Charm', price: 300, desc: 'Better loot chance (3 turns).', icon: '🍀', category: 'MAGIC' },
  { id: ItemType.LUCKY_DICE, name: 'Lucky Dice', price: 350, desc: 'Runes spawn 5x more often (20 turns).', icon: '🎲', category: 'MAGIC' },
  { id: ItemType.SIEGE_BREAKER, name: 'Siege Breaker', price: 500, desc: 'Next boss hit deals 3x Damage.', icon: '🔨', category: 'BATTLE' },
  { id: ItemType.CHAIN_CATALYST, name: 'Chain Catalyst', price: 600, desc: 'Enable Auto-Cascades (10 turns).', icon: '⚡', category: 'BATTLE' },
  { id: ItemType.MIDAS_POTION, name: 'Midas Brew', price: 450, desc: '2x Gold from merges (50 turns).', icon: '⚱️', category: 'CONSUMABLE' },
  { id: ItemType.VOID_STONE, name: 'Void Stone', price: 800, desc: 'Consumes 1 weak tile every turn (10 turns).', icon: '🌑', category: 'MAGIC' },
  { id: ItemType.RADIANT_AURA, name: 'Radiant Aura', price: 700, desc: '+50% XP Gain (20 turns).', icon: '☀️', category: 'MAGIC' },
  
  // New Synergy Items
  { id: ItemType.FLOW_ELIXIR, name: 'Flow Elixir', price: 500, desc: 'Cascade rewards x2 (30 turns).', icon: '🌊', category: 'MAGIC' },
  { id: ItemType.HARMONIC_CRYSTAL, name: 'Harmonic Crystal', price: 750, desc: 'Cascades spawn new tiles (10 turns).', icon: '💎', category: 'MAGIC' },

  { id: 'OMEGA_ELIXIR', name: 'Omega Elixir', price: 2500, desc: 'Gain 10,000 XP instantly.', icon: '⚗️', category: 'CONSUMABLE' } as any,
  { id: 'DIVINE_SHIELD', name: 'Divine Shield', price: 1500, desc: 'Block next Boss damage.', icon: '🛡️', category: 'BATTLE' } as any
];

export const RECIPES: CraftingRecipe[] = [
    { 
        id: 'RECIPE_GREATER_XP', resultId: ItemType.GREATER_XP_POTION, name: 'Greater XP Potion', description: 'Grants 2500 XP.', icon: '⚗️', goldCost: 100,
        ingredients: [ { type: ItemType.XP_POTION, count: 2 } ]
    },
    { 
        id: 'RECIPE_CATACLYSM', resultId: ItemType.CATACLYSM_SCROLL, name: 'Cataclysm Scroll', description: 'Removes 50% of tiles.', icon: '🌋', goldCost: 300,
        ingredients: [ { type: ItemType.BOMB_SCROLL, count: 2 } ]
    },
    { 
        id: 'RECIPE_ASCENDANT', resultId: ItemType.ASCENDANT_RUNE, name: 'Ascendant Rune', description: 'Next 5 spawns are High Tier.', icon: '👑', goldCost: 500,
        ingredients: [ { type: ItemType.GOLDEN_RUNE, count: 2 } ]
    },
    { 
        id: 'RECIPE_GRANDMASTER', resultId: ItemType.GRANDMASTER_BREW, name: 'Grandmaster Brew', description: 'Massive XP + Flow State.', icon: '🧪', goldCost: 1000,
        ingredients: [ { type: ItemType.XP_POTION, count: 2 }, { type: ItemType.FLOW_ELIXIR, count: 1 } ]
    }
];

export const getItemDefinition = (type: ItemType) => {
    const shopItem = SHOP_ITEMS.find(i => i.id === type);
    if (shopItem) return shopItem;
    
    const recipe = RECIPES.find(r => r.resultId === type);
    if (recipe) {
        return {
            id: recipe.resultId,
            name: recipe.name,
            desc: recipe.description,
            price: 0,
            icon: recipe.icon,
            category: 'MAGIC' as const
        };
    }
    
    return { id: type, name: 'Unknown', price: 0, desc: '???', icon: '❓', category: 'CONSUMABLE' as const };
};

export const getLevelRank = (level: number) => {
    if (level >= 50) return { title: 'Godslayer', icon: Crown, color: 'text-amber-500', bg: 'from-amber-950 to-black' };
    if (level >= 40) return { title: 'Champion', icon: Star, color: 'text-red-500', bg: 'from-red-950 to-black' };
    if (level >= 30) return { title: 'Warlord', icon: Swords, color: 'text-purple-500', bg: 'from-purple-950 to-black' };
    if (level >= 20) return { title: 'Knight', icon: Shield, color: 'text-blue-500', bg: 'from-blue-950 to-black' };
    if (level >= 10) return { title: 'Adventurer', icon: Zap, color: 'text-emerald-500', bg: 'from-emerald-950 to-black' };
    return { title: 'Novice', icon: Scroll, color: 'text-slate-400', bg: 'from-slate-800 to-black' };
};

export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'FIRST_BLOOD',
        name: 'First Blood',
        description: 'Defeat your first Boss.',
        icon: '💀',
        condition: (stats: GameStats) => stats.bossesDefeated >= 1,
        reward: { xp: 500, gold: 100 }
    },
    {
        id: 'SLIME_SQUASHER',
        name: 'Slime Squasher',
        description: 'Merge 100 Slimes.',
        icon: '🟢',
        condition: (stats: GameStats) => stats.slimesMerged >= 100,
        reward: { xp: 200 }
    },
    {
        id: 'BIG_SPENDER',
        name: 'Big Spender',
        description: 'Collect 1000 Gold.',
        icon: '💰',
        condition: (stats: GameStats) => stats.goldCollected >= 1000,
        reward: { xp: 300 }
    },
    {
        id: 'COMBO_MASTER',
        name: 'Combo Master',
        description: 'Reach a Combo of x5.',
        icon: '⚡',
        condition: (stats: GameStats) => stats.highestCombo >= 5,
        reward: { gold: 200 }
    },
    {
        id: 'DRAGON_SLAYER',
        name: 'Dragon Slayer',
        description: 'Create a Dragon Tile (1024).',
        icon: '🐲',
        condition: (stats: GameStats) => stats.highestTile >= 1024,
        reward: { xp: 2000, gold: 1000 }
    },
    {
        id: 'GOD_TIER',
        name: 'Ascension',
        description: 'Create a God Tile (2048).',
        icon: '👑',
        condition: (stats: GameStats) => stats.highestTile >= 2048,
        reward: { xp: 5000, gold: 2500, item: ItemType.GOLDEN_RUNE }
    }
];
