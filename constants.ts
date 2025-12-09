

import { TileType, ItemType, InventoryItem, Stage, CraftingRecipe, Achievement } from './types';
import { Shield, Scroll, Swords, Star, Crown, Flame, Zap, Eye } from 'lucide-react';
import React from 'react';

export const GRID_SIZE_INITIAL = 4;
export const WINNING_VALUE = 2048;

export const MUSIC_PATHS = {
  // Local files. 
  // Gameplay music is now PROCEDURAL to save space. 
  // Only these two files are needed in the 'music' folder.
  SPLASH: 'music/dragons-horde-splah.mp3', 
  DEATH: 'music/death-music.mp3',
  
  // Empty array implies procedural generation
  GAMEPLAY: [] as string[]
};

export const getXpThreshold = (level: number) => Math.floor(1000 * Math.pow(level, 1.5));

// Helper for Pollinations.ai
const genUrl = (prompt: string, seed: string | number = 42) => 
  `https://image.pollinations.ai/prompt/dark fantasy rpg game asset ${prompt} high quality dramatic lighting?width=256&height=256&nologo=true&seed=${seed}`;

const bgUrl = (prompt: string, seed: string | number) =>
  `https://image.pollinations.ai/prompt/dark fantasy environment background ${prompt} cinematic atmospheric 8k?width=1024&height=1024&nologo=true&seed=${seed}`;

// STAGES CONFIGURATION
export const STAGES: Stage[] = [
    { name: 'TheDungeon', minLevel: 1, backgroundUrl: bgUrl('ancient stone dungeon torchlight', 1), colorTheme: 'text-slate-200', barColor: 'from-slate-600 to-slate-400' },
    { name: 'FungalCaverns', minLevel: 5, backgroundUrl: bgUrl('glowing mushroom cave bioluminescent purple', 5), colorTheme: 'text-purple-300', barColor: 'from-purple-600 to-indigo-500' },
    { name: 'MoltenDepths', minLevel: 10, backgroundUrl: bgUrl('volcanic lava cave magma fire', 10), colorTheme: 'text-orange-300', barColor: 'from-red-600 to-orange-500' },
    { name: 'CrystalSpire', minLevel: 20, backgroundUrl: bgUrl('crystal palace celestial floating islands', 20), colorTheme: 'text-cyan-200', barColor: 'from-cyan-500 to-blue-400' },
    { name: 'VoidRealm', minLevel: 30, backgroundUrl: bgUrl('cosmic void horror eldritch stars', 30), colorTheme: 'text-fuchsia-300', barColor: 'from-fuchsia-800 to-purple-900' }
];

export const getStage = (level: number): Stage => {
    return STAGES.slice().reverse().find(s => level >= s.minLevel) || STAGES[0];
};

export const getStageBackground = (stageName: string) => {
    return STAGES.find(s => s.name === stageName)?.backgroundUrl || STAGES[0].backgroundUrl;
};

// TILE STYLES
export const TILE_STYLES: Record<number, { label: string; color: string; ringColor: string; icon: string; glow: string; imageUrl: string; particleColor: string }> = {
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
};

export const BOSS_STYLE = { label: 'BOSS', color: 'from-red-950 to-black', ringColor: 'ring-red-600', icon: '💀', glow: 'shadow-red-600/100', imageUrl: genUrl('terrifying skeleton lich king dark magic', 666), particleColor: '#ef4444' };
export const FALLBACK_STYLE = { label: '???', color: 'from-gray-800 to-black', ringColor: 'ring-gray-500', icon: '❓', glow: 'shadow-none', imageUrl: '', particleColor: '#ffffff' };

export const RUNE_STYLES: Record<string, any> = {
    [TileType.RUNE_MIDAS]: { label: 'MIDAS', color: 'from-yellow-800 to-yellow-900', ringColor: 'ring-yellow-400', icon: '💰', glow: 'shadow-yellow-400/50', imageUrl: genUrl('gold coin rune magical glowing', 777), particleColor: '#fbbf24' },
    [TileType.RUNE_CHRONOS]: { label: 'TIME', color: 'from-blue-800 to-blue-900', ringColor: 'ring-blue-400', icon: '⏳', glow: 'shadow-blue-400/50', imageUrl: genUrl('blue hourglass rune magical glowing', 888), particleColor: '#60a5fa' },
    [TileType.RUNE_VOID]: { label: 'VOID', color: 'from-purple-950 to-black', ringColor: 'ring-purple-600', icon: '⚫', glow: 'shadow-purple-600/50', imageUrl: genUrl('black hole void rune magical glowing', 999), particleColor: '#a855f7' },
};

export const SHOP_ITEMS = [
  // Consumables
  { id: ItemType.XP_POTION, name: 'XP Potion', price: 100, desc: '+1000 XP instantly.', icon: '🧪', category: 'CONSUMABLE' },
  { id: ItemType.BOMB_SCROLL, name: 'Purge Scroll', price: 250, desc: 'Destroy 3 weakest tiles.', icon: '📜', category: 'BATTLE' },
  { id: ItemType.REROLL_TOKEN, name: 'Fate Token', price: 150, desc: 'Reroll the board once.', icon: '🎲', category: 'CONSUMABLE' },
  
  // Magic
  { id: ItemType.GOLDEN_RUNE, name: 'Golden Rune', price: 400, desc: 'Next spawn is Tier 3 (16).', icon: '🌟', category: 'MAGIC' },
  { id: ItemType.LUCKY_CHARM, name: 'Lucky Charm', price: 300, desc: 'Better loot chance (3 turns).', icon: '🍀', category: 'MAGIC' },
  { id: ItemType.LUCKY_DICE, name: 'Lucky Dice', price: 350, desc: 'Runes spawn 5x more often (20 turns).', icon: '🎲', category: 'MAGIC' },
  
  // Battle
  { id: ItemType.SIEGE_BREAKER, name: 'Siege Breaker', price: 500, desc: 'Next boss hit deals 3x Damage.', icon: '🔨', category: 'BATTLE' },
  { id: ItemType.CHAIN_CATALYST, name: 'Chain Catalyst', price: 600, desc: 'Enable Auto-Cascades (10 turns).', icon: '⚡', category: 'BATTLE' },
  { id: ItemType.MIDAS_POTION, name: 'Midas Brew', price: 450, desc: '2x Gold from merges (50 turns).', icon: '⚱️', category: 'CONSUMABLE' },
  { id: ItemType.VOID_STONE, name: 'Void Stone', price: 800, desc: 'Consumes 1 weak tile every turn (10 turns).', icon: '🌑', category: 'MAGIC' },
  { id: ItemType.RADIANT_AURA, name: 'Radiant Aura', price: 700, desc: '+50% XP Gain (20 turns).', icon: '☀️', category: 'MAGIC' }
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
    }
];

export const getItemDefinition = (type: ItemType) => {
    const shopItem = SHOP_ITEMS.find(i => i.id === type);
    if (shopItem) return shopItem;
    
    // Check recipes for crafted items
    const recipe = RECIPES.find(r => r.resultId === type);
    if (recipe) return { name: recipe.name, desc: recipe.description, icon: recipe.icon, price: 0 }; // Price 0 as it's not bought directly usually

    return { name: 'Unknown', desc: '???', icon: '❓', price: 0 };
};

export const getLevelRank = (level: number) => {
    if (level < 5) return { title: 'Novice', color: 'text-slate-400', border: 'border-slate-500', bg: 'from-slate-800 to-slate-900', icon: Shield };
    if (level < 10) return { title: 'Apprentice', color: 'text-blue-400', border: 'border-blue-500', bg: 'from-blue-900 to-slate-900', icon: Scroll };
    if (level < 20) return { title: 'Adept', color: 'text-green-400', border: 'border-green-500', bg: 'from-green-900 to-slate-900', icon: Star };
    if (level < 30) return { title: 'Expert', color: 'text-yellow-400', border: 'border-yellow-500', bg: 'from-yellow-900 to-slate-900', icon: Crown };
    if (level < 50) return { title: 'Master', color: 'text-orange-500', border: 'border-orange-500', bg: 'from-orange-900 to-red-900', icon: Flame };
    return { title: 'Legend', color: 'text-red-500', border: 'border-red-500', bg: 'from-red-950 to-black', icon: Zap };
};

export const ACHIEVEMENTS: Achievement[] = [
    { id: 'FIRST_MERGE', name: 'First Blood', description: 'Merge two Slimes.', icon: '🩸', condition: (s) => s.totalMerges >= 1, reward: { xp: 100 } },
    { id: 'COMBO_KING', name: 'Combo King', description: 'Reach a x5 Combo.', icon: '⚡', condition: (s) => s.highestCombo >= 5, reward: { gold: 50 } },
    { id: 'BOSS_SLAYER', name: 'Boss Slayer', description: 'Defeat your first Boss.', icon: '💀', condition: (s) => s.bossesDefeated >= 1, reward: { gold: 200, xp: 500 } },
    { id: 'RICH', name: 'Hoarder', description: 'Collect 1000 Gold.', icon: '💰', condition: (s) => s.goldCollected >= 1000, reward: { xp: 500 } },
    { id: 'LEGENDARY', name: 'Legendary', description: 'Create a Dragon (1024).', icon: '🐲', condition: (s) => s.highestTile >= 1024, reward: { gold: 1000 } },
    { id: 'GODLIKE', name: 'Godlike', description: 'Create the Dragon God (2048).', icon: '👑', condition: (s) => s.highestTile >= 2048, reward: { gold: 5000, xp: 10000 } }
];
