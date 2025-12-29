
import { TileType, ItemType, GameStats, GameState, Stage, Achievement, HeroClass, CraftingRecipe, DailyModifier, StoryEntry, PlayerProfile, Medal } from './types';
import { Trophy, Star, Shield, Zap, Swords, LayoutGrid, Map, Flame, Target, Hexagon, Crosshair, Medal as MedalIcon, Crown, Skull } from 'lucide-react';
import React from 'react';

export const GRID_SIZE_INITIAL = 4;

// Helper to generate consistent placeholder image URLs
export const genUrl = (prompt: string, seed: number) => 
  `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&seed=${seed}`;

export const getXpThreshold = (level: number) => Math.floor(1000 * Math.pow(level, 1.5));

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
    {
        id: 'first_blood',
        title: 'Alchemy of Flesh',
        text: "The slimes quiver when they touch, binding together to form something... viler. Is this biology, or heresy? The dungeon seems to reward this consolidation of power.",
        imageUrl: genUrl('slime monster mutating evolving fantasy art', 302),
        order: 2,
        unlockCondition: (s, g, p) => s.totalMerges >= 50
    },
    {
        id: 'guardian',
        title: 'The Gatekeeper',
        text: "A guardian blocks the path. It does not speak; it only kills. It stands as a test: do I have the strength to claim what lies deeper?",
        imageUrl: genUrl('giant stone guardian golem blocking path', 303),
        order: 3,
        unlockCondition: (s, g, p) => s.bossesDefeated >= 1
    },
    {
        id: 'gold_curse',
        title: 'Golden Weight',
        text: "The gold here glitters in the torchlight, but it feels cold to the touch. It wants to be held. It whispers promises of power, but I feel lighter only when I spend it.",
        imageUrl: genUrl('cursed pile of gold coins skulls fantasy', 304),
        order: 4,
        unlockCondition: (s, g, p) => s.goldCollected >= 1000
    },
    {
        id: 'cycle',
        title: 'Eternal Return',
        text: "Death is not the end here. The dungeon simply resets the board. I awake at the entrance, memories intact, but my pockets empty. The cycle continues.",
        imageUrl: genUrl('time loop hourglass magic swirling', 305),
        order: 5,
        unlockCondition: (s, g, p) => p.gamesPlayed >= 3
    },
    {
        id: 'dragon_sight',
        title: 'The God',
        text: "I saw it. A god of scales and fire. It does not hoard gold; it hoards souls. We are not intruders; we are livestock, fattening ourselves on its treasures until we are ripe for the harvest.",
        imageUrl: genUrl('giant dragon eye opening darkness', 306),
        order: 6,
        unlockCondition: (s, g, p) => s.highestTile >= 1024
    },
    {
        id: 'ascension',
        title: 'Part of the Walls',
        text: "I have spent so long in the dark that the light burns my eyes. I am no longer just an adventurer. I am a function of this dungeon. A variable in its equation.",
        imageUrl: genUrl('transcendent being glowing light fantasy', 307),
        order: 7,
        unlockCondition: (s, g, p) => p.accountLevel >= 10
    }
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