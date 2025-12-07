
import { TileType, ItemType, InventoryItem } from './types';

export const GRID_SIZE_INITIAL = 4;
export const WINNING_VALUE = 2048;

export const getXpThreshold = (level: number) => Math.floor(1000 * Math.pow(level, 1.5));

// Using Pollinations.ai for generative placeholder art
const genUrl = (prompt: string) => `https://image.pollinations.ai/prompt/fantasy rpg icon ${prompt} game asset style digital art dark background?width=200&height=200&nologo=true&seed=42`;

export const TILE_STYLES: Record<number, { label: string; color: string; icon: string; glow: string; imageUrl: string }> = {
  2: { label: 'Slime', color: 'from-green-900 to-green-700', icon: '🟢', glow: 'shadow-green-500/50', imageUrl: genUrl('green slime blob cute') },
  4: { label: 'Goblin', color: 'from-emerald-900 to-teal-800', icon: '👺', glow: 'shadow-emerald-500/50', imageUrl: genUrl('ugly green goblin face') },
  8: { label: 'Orc', color: 'from-red-900 to-red-700', icon: '👹', glow: 'shadow-red-500/50', imageUrl: genUrl('angry red orc warrior face') },
  16: { label: 'Troll', color: 'from-stone-700 to-stone-500', icon: '🪨', glow: 'shadow-stone-500/50', imageUrl: genUrl('grey stone troll giant') },
  32: { label: 'Drake', color: 'from-orange-800 to-orange-600', icon: '🦎', glow: 'shadow-orange-500/50', imageUrl: genUrl('orange fire lizard drake') },
  64: { label: 'Wyvern', color: 'from-cyan-900 to-blue-800', icon: '🐉', glow: 'shadow-cyan-500/50', imageUrl: genUrl('flying blue wyvern dragon') },
  128: { label: 'Demon', color: 'from-rose-900 to-rose-700', icon: '🔥', glow: 'shadow-rose-500/50', imageUrl: genUrl('horned red demon fire eyes') },
  256: { label: 'Elder', color: 'from-purple-900 to-purple-700', icon: '🔮', glow: 'shadow-purple-500/50', imageUrl: genUrl('purple mystic dragon elder') },
  512: { label: 'Legend', color: 'from-indigo-900 to-blue-900', icon: '⚡', glow: 'shadow-blue-500/50', imageUrl: genUrl('lightning dragon storm majestic') },
  1024: { label: 'Ancient', color: 'from-yellow-700 to-amber-600', icon: '📜', glow: 'shadow-amber-500/50', imageUrl: genUrl('golden ancient dragon god scales') },
  2048: { label: 'God', color: 'from-yellow-500 via-orange-500 to-red-500', icon: '🐲', glow: 'shadow-yellow-500/80', imageUrl: genUrl('ultimate cosmic dragon god glowing aura') },
};

export const FALLBACK_STYLE = { label: 'Ascended', color: 'from-slate-900 to-black', icon: '🌟', glow: 'shadow-white/50', imageUrl: genUrl('cosmic star energy') };

export const PERKS = [
  { level: 3, desc: "Luck of the Goblin: 5% chance for 4-spawn" },
  { level: 5, desc: "Expansion: Grid size increased to 5x5!" },
  { level: 7, desc: "Veteran: +50% XP from merges" },
  { level: 10, desc: "Loot Mode: Merges drop Gold & Items" },
  { level: 15, desc: "Expansion: Grid size increased to 6x6!" },
];

export const SHOP_ITEMS: { id: ItemType, name: string, price: number, icon: string, desc: string }[] = [
  { id: ItemType.XP_POTION, name: "XP Elixir", price: 250, icon: "🧪", desc: "+1000 XP instantly" },
  { id: ItemType.BOMB_SCROLL, name: "Purge Scroll", price: 500, icon: "📜", desc: "Destroys 3 lowest value tiles" },
  { id: ItemType.GOLDEN_RUNE, name: "Golden Rune", price: 750, icon: "🌟", desc: "Next spawn is a high-tier tile" },
];
