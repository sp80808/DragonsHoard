
import { TileType, ItemType, InventoryItem, Stage, CraftingRecipe, Achievement } from './types';

export const GRID_SIZE_INITIAL = 4;
export const WINNING_VALUE = 2048;

export const getXpThreshold = (level: number) => Math.floor(1000 * Math.pow(level, 1.5));

// Helper for Pollinations.ai
const genUrl = (prompt: string, seed: string | number = 42) => 
  `https://image.pollinations.ai/prompt/dark fantasy rpg game asset ${prompt} high quality dramatic lighting?width=256&height=256&nologo=true&seed=${seed}`;

const bgUrl = (prompt: string, seed: string | number) =>
  `https://image.pollinations.ai/prompt/dark fantasy environment background ${prompt} cinematic atmospheric 8k?width=1024&height=1024&nologo=true&seed=${seed}`;

export const TILE_STYLES: Record<number, { label: string; color: string; ringColor: string; icon: string; glow: string; imageUrl: string }> = {
  2: { label: 'Slime', color: 'from-green-900 to-green-700', ringColor: 'ring-green-500', icon: '🟢', glow: 'shadow-green-500/50', imageUrl: genUrl('cute green slime blob monster', 2) },
  4: { label: 'Goblin', color: 'from-emerald-900 to-teal-800', ringColor: 'ring-emerald-500', icon: '👺', glow: 'shadow-emerald-500/50', imageUrl: genUrl('snarling green goblin warrior face', 4) },
  8: { label: 'Orc', color: 'from-red-900 to-red-700', ringColor: 'ring-red-500', icon: '👹', glow: 'shadow-red-500/50', imageUrl: genUrl('fierce red orc barbarian', 8) },
  16: { label: 'Troll', color: 'from-stone-700 to-stone-500', ringColor: 'ring-stone-400', icon: '🪨', glow: 'shadow-stone-500/50', imageUrl: genUrl('grey rock troll giant', 16) },
  32: { label: 'Drake', color: 'from-orange-800 to-orange-600', ringColor: 'ring-orange-500', icon: '🦎', glow: 'shadow-orange-500/50', imageUrl: genUrl('orange fire drake lizard', 32) },
  64: { label: 'Wyvern', color: 'from-cyan-900 to-blue-800', ringColor: 'ring-cyan-500', icon: '🐉', glow: 'shadow-cyan-500/50', imageUrl: genUrl('blue lightning wyvern flying', 64) },
  128: { label: 'Demon', color: 'from-rose-900 to-rose-700', ringColor: 'ring-rose-500', icon: '🔥', glow: 'shadow-rose-500/50', imageUrl: genUrl('horned red demon lord fire', 128) },
  256: { label: 'Elder', color: 'from-purple-900 to-purple-700', ringColor: 'ring-purple-500', icon: '🔮', glow: 'shadow-purple-500/50', imageUrl: genUrl('purple mystic elder dragon', 256) },
  512: { label: 'Legend', color: 'from-indigo-900 to-blue-900', ringColor: 'ring-indigo-500', icon: '⚡', glow: 'shadow-blue-500/50', imageUrl: genUrl('majestic storm dragon lightning aura', 512) },
  1024: { label: 'Ancient', color: 'from-yellow-700 to-amber-600', ringColor: 'ring-amber-500', icon: '📜', glow: 'shadow-amber-500/50', imageUrl: genUrl('golden ancient dragon god scales', 1024) },
  2048: { label: 'God', color: 'from-yellow-500 via-orange-500 to-red-500', ringColor: 'ring-yellow-400', icon: '🐲', glow: 'shadow-yellow-500/80', imageUrl: genUrl('ultimate cosmic dragon god glowing eyes', 2048) },
};

export const BOSS_STYLE = { 
  label: 'BOSS', 
  color: 'from-red-950 via-black to-red-900',
  ringColor: 'ring-red-600', 
  icon: '☠️', 
  glow: 'shadow-red-500/80', 
  imageUrl: genUrl('terrifying giant raid boss monster red eyes smoke', 'BOSS') 
};

export const FALLBACK_STYLE = { label: 'Ascended', color: 'from-slate-900 to-black', ringColor: 'ring-white', icon: '🌟', glow: 'shadow-white/50', imageUrl: genUrl('cosmic star energy', 9999) };

export const RUNE_STYLES: Record<string, { label: string; color: string; ringColor: string; icon: string; glow: string; imageUrl: string }> = {
  RUNE_MIDAS: { label: 'Midas', color: 'from-yellow-400 to-amber-600', ringColor: 'ring-yellow-400', icon: '👑', glow: 'shadow-yellow-400/80', imageUrl: genUrl('golden midas touch hand magic rune', 'midas') },
  RUNE_CHRONOS: { label: 'Chronos', color: 'from-blue-400 to-cyan-600', ringColor: 'ring-cyan-400', icon: '⏳', glow: 'shadow-cyan-400/80', imageUrl: genUrl('blue time manipulation magic rune hourglass', 'chronos') },
  RUNE_VOID: { label: 'Void', color: 'from-purple-950 to-black', ringColor: 'ring-purple-500', icon: '⚫', glow: 'shadow-purple-900/80', imageUrl: genUrl('black hole void swirling magic rune', 'void') },
};

export const STAGES: { name: string; minLevel: number; prompt: string; color: string; barColor: string }[] = [
  { name: "The Crypt", minLevel: 1, prompt: "medieval dungeon stone walls torches cobwebs dark", color: "text-slate-400", barColor: "from-slate-600 to-slate-400" },
  { name: "Fungal Caverns", minLevel: 10, prompt: "bioluminescent glowing mushrooms purple cave underground magical", color: "text-purple-400", barColor: "from-purple-600 via-fuchsia-500 to-purple-400" },
  { name: "Magma Core", minLevel: 20, prompt: "volcanic lava cave flowing magma fire rocks heat", color: "text-orange-500", barColor: "from-red-600 via-orange-500 to-yellow-500" },
  { name: "The Void", minLevel: 30, prompt: "cosmic void deep space nebula stars purple black ethereal", color: "text-indigo-400", barColor: "from-indigo-900 via-violet-600 to-purple-500" },
  { name: "Elysium", minLevel: 40, prompt: "heavenly clouds gold gates divine light bright sky", color: "text-yellow-300", barColor: "from-yellow-400 via-amber-300 to-yellow-100" }
];

export const getStage = (level: number) => {
  return [...STAGES].reverse().find(s => level >= s.minLevel) || STAGES[0];
};

export const getStageBackground = (stageName: string) => {
  const stage = STAGES.find(s => s.name === stageName) || STAGES[0];
  return bgUrl(stage.prompt, stage.name.replace(' ', ''));
};

export const PERKS = [
  { level: 3, desc: "Luck of the Goblin: 5% chance for 4-spawn" },
  { level: 5, desc: "Expansion: Grid size increased to 5x5!" },
  { level: 5, desc: "BOSSES: Dangerous bosses appear every 5 levels!" },
  { level: 7, desc: "Veteran: +50% XP from merges" },
  { level: 10, desc: "Loot Mode: Merges drop Gold & Items" },
  { level: 10, desc: "Expansion: Grid size increased to 6x6!" },
  { level: 15, desc: "Reroll Unlocked: 1 Free Reroll per level" },
  { level: 15, desc: "Expansion: Grid size increased to 7x7!" },
  { level: 20, desc: "Auto-Merge: Rarely auto-combine adjacent tiles" },
  { level: 20, desc: "Expansion: Grid size increased to 8x8!" },
];

export interface ShopItemDef {
    id: ItemType;
    name: string;
    price: number;
    icon: string;
    desc: string;
    category: 'CONSUMABLE' | 'MAGIC' | 'BATTLE';
}

export const SHOP_ITEMS: ShopItemDef[] = [
  // Consumables (Essentials)
  { id: ItemType.XP_POTION, name: "XP Elixir", price: 50, icon: "🧪", desc: "+1000 XP instantly. Level up faster.", category: 'CONSUMABLE' },
  { id: ItemType.BOMB_SCROLL, name: "Purge Scroll", price: 100, icon: "📜", desc: "Destroys 3 lowest value tiles.", category: 'CONSUMABLE' },
  { id: ItemType.REROLL_TOKEN, name: "Reroll Token", price: 75, icon: "🔄", desc: "One free board reset.", category: 'CONSUMABLE' },
  
  // Magic (Runes & Buffs)
  { id: ItemType.GOLDEN_RUNE, name: "Golden Rune", price: 500, icon: "🌟", desc: "Next spawn is a high-tier tile.", category: 'MAGIC' },
  { id: ItemType.LUCKY_CHARM, name: "Lucky Charm", price: 150, icon: "🍀", desc: "Better loot chance (3 turns).", category: 'MAGIC' },
  { id: ItemType.LUCKY_DICE, name: "Lucky Dice", price: 300, icon: "🎲", desc: "More Power-Up tiles spawn for 20 turns.", category: 'MAGIC' },
  { id: ItemType.CHAIN_CATALYST, name: "Chain Catalyst", price: 250, icon: "⛓️", desc: "Guarantees Cascades for 10 turns.", category: 'MAGIC' },
  
  // Battle (Bosses & Economy)
  { id: ItemType.MIDAS_POTION, name: "Midas Brew", price: 400, icon: "🏺", desc: "2x Gold gain for 50 turns.", category: 'BATTLE' },
  { id: ItemType.SIEGE_BREAKER, name: "Siege Breaker", price: 600, icon: "🔨", desc: "Next boss hit deals 3x Damage.", category: 'BATTLE' },
];

export const RECIPES: CraftingRecipe[] = [
  {
    id: 'craft_greater_xp',
    resultId: ItemType.GREATER_XP_POTION,
    name: "Greater Elixir",
    description: "Grants +2500 XP instantly.",
    icon: "⚗️",
    goldCost: 100,
    ingredients: [{ type: ItemType.XP_POTION, count: 2 }]
  },
  {
    id: 'craft_cataclysm',
    resultId: ItemType.CATACLYSM_SCROLL,
    name: "Cataclysm Scroll",
    description: "Destroys 50% of tiles (non-boss).",
    icon: "🌋",
    goldCost: 200,
    ingredients: [{ type: ItemType.BOMB_SCROLL, count: 2 }]
  },
  {
    id: 'craft_ascendant',
    resultId: ItemType.ASCENDANT_RUNE,
    name: "Ascendant Rune",
    description: "Next 5 spawns are high-tier.",
    icon: "🧿",
    goldCost: 500,
    ingredients: [{ type: ItemType.GOLDEN_RUNE, count: 2 }]
  }
];

export const getItemDefinition = (type: ItemType) => {
    const shopItem = SHOP_ITEMS.find(i => i.id === type);
    if (shopItem) return shopItem;
    
    const recipe = RECIPES.find(r => r.resultId === type);
    if (recipe) return { name: recipe.name, desc: recipe.description, icon: recipe.icon };
    
    return { name: "Unknown", desc: "???", icon: "❓" };
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Merge your first tiles.',
    icon: '⚔️',
    condition: (stats) => stats.totalMerges > 0,
    reward: { gold: 50 }
  },
  {
    id: 'slime_hunter',
    name: 'Slime Hunter',
    description: 'Merge 50 Slimes (Value 2).',
    icon: '🟢',
    condition: (stats) => stats.slimesMerged >= 50,
    reward: { xp: 500 }
  },
  {
    id: 'boss_slayer',
    name: 'Boss Slayer',
    description: 'Defeat your first Boss.',
    icon: '☠️',
    condition: (stats) => stats.bossesDefeated >= 1,
    reward: { gold: 500, xp: 1000 }
  },
  {
    id: 'combo_novice',
    name: 'Combo Novice',
    description: 'Achieve a 4x Combo.',
    icon: '🔥',
    condition: (stats) => stats.highestCombo >= 4,
    reward: { gold: 100 }
  },
  {
    id: 'dragon_tamer',
    name: 'Dragon Tamer',
    description: 'Create a Drake (32).',
    icon: '🦎',
    condition: (stats) => stats.highestTile >= 32,
    reward: { gold: 250, xp: 250 }
  },
  {
    id: 'hoarder',
    name: 'Gold Hoarder',
    description: 'Collect 1000 Gold total.',
    icon: '💰',
    condition: (stats) => stats.goldCollected >= 1000,
    reward: { item: ItemType.LUCKY_CHARM }
  },
  {
    id: 'legendary',
    name: 'Legendary',
    description: 'Create a Legend (512).',
    icon: '⚡',
    condition: (stats) => stats.highestTile >= 512,
    reward: { item: ItemType.GOLDEN_RUNE, gold: 1000 }
  }
];
