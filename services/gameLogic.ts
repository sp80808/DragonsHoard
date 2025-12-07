
import { Direction, GameState, Tile, TileType, MoveResult, LootResult, ItemType, InventoryItem } from '../types';
import { GRID_SIZE_INITIAL, SHOP_ITEMS } from '../constants';

const createId = () => Math.random().toString(36).substr(2, 9);

export const getEmptyCells = (grid: Tile[], size: number) => {
  const cells: { x: number; y: number }[] = [];
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      if (!grid.find((tile) => tile.x === x && tile.y === y)) {
        cells.push({ x, y });
      }
    }
  }
  return cells;
};

export const spawnTile = (grid: Tile[], size: number, level: number, forcedValue?: number): Tile[] => {
  const emptyCells = getEmptyCells(grid, size);
  if (emptyCells.length === 0) return grid;

  const { x, y } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  
  // Default logic: Level 3 Perk: 5% chance for 4-spawn
  let value = (level >= 3 && Math.random() < 0.05) ? 4 : 2;
  
  // Override if forced (e.g. from Golden Rune item)
  if (forcedValue) value = forcedValue;

  const newTile: Tile = {
    id: createId(),
    x,
    y,
    value,
    type: TileType.NORMAL,
    isNew: true,
  };

  return [...grid, newTile];
};

export const moveGrid = (grid: Tile[], direction: Direction, size: number): MoveResult => {
  let moved = false;
  let score = 0;
  let xpGained = 0;
  let goldGained = 0;
  const mergedIds: string[] = [];

  const sortedTiles = [...grid];
  const vector = { x: 0, y: 0 };
  if (direction === Direction.UP) vector.y = -1;
  if (direction === Direction.DOWN) vector.y = 1;
  if (direction === Direction.LEFT) vector.x = -1;
  if (direction === Direction.RIGHT) vector.x = 1;

  if (direction === Direction.RIGHT) sortedTiles.sort((a, b) => b.x - a.x);
  if (direction === Direction.LEFT) sortedTiles.sort((a, b) => a.x - b.x);
  if (direction === Direction.DOWN) sortedTiles.sort((a, b) => b.y - a.y);
  if (direction === Direction.UP) sortedTiles.sort((a, b) => a.y - b.y);

  const newGrid: Tile[] = [];
  const mergedIndices = new Set<string>();

  sortedTiles.forEach((tile) => {
    let { x, y } = tile;
    let nextX = x + vector.x;
    let nextY = y + vector.y;
    
    while (
      nextX >= 0 && nextX < size &&
      nextY >= 0 && nextY < size
    ) {
      const collision = newGrid.find(t => t.x === nextX && t.y === nextY);
      
      if (collision) {
        if (!mergedIndices.has(collision.id) && collision.value === tile.value) {
          moved = true;
          const mergedValue = tile.value * 2;
          
          collision.value = mergedValue;
          collision.mergedFrom = [tile.id, collision.id];
          
          mergedIndices.add(collision.id);
          
          score += collision.value;
          xpGained += collision.value * 2;
          
          // Gold Formula: 1 Gold per merge, + bonus for high tier merges
          goldGained += 1 + Math.floor(collision.value / 16);

          mergedIds.push(collision.id);
          return;
        } else {
          break; 
        }
      }
      x = nextX;
      y = nextY;
      nextX += vector.x;
      nextY += vector.y;
    }

    if (x !== tile.x || y !== tile.y) {
      moved = true;
    }

    newGrid.push({
      ...tile,
      x,
      y,
      mergedFrom: null,
      isNew: false
    });
  });

  return { grid: newGrid, score, xpGained, goldGained, moved, mergedIds };
};

export const checkLoot = (level: number, mergedIds: string[]): LootResult | null => {
  if (mergedIds.length === 0) return null;
  
  // Loot rolls
  // Chance increases slightly with merged IDs count
  const chance = 0.05 + (mergedIds.length * 0.01);
  
  if (Math.random() < chance) {
    const roll = Math.random();

    if (roll > 0.95 && level >= 5) {
      // Rare Item
      const item: InventoryItem = {
        id: createId(),
        type: ItemType.GOLDEN_RUNE,
        name: "Golden Rune",
        description: "Next spawn is upgraded.",
        icon: "🌟"
      };
      return { message: "Loot: Golden Rune found!", item };
    } else if (roll > 0.85 && level >= 3) {
      // Uncommon Item
      const item: InventoryItem = {
        id: createId(),
        type: ItemType.BOMB_SCROLL,
        name: "Purge Scroll",
        description: "Clears weak enemies.",
        icon: "📜"
      };
      return { message: "Loot: Purge Scroll found!", item };
    } else if (roll > 0.6) {
      // Common Item
      const item: InventoryItem = {
        id: createId(),
        type: ItemType.XP_POTION,
        name: "XP Potion",
        description: "+500 XP",
        icon: "🧪"
      };
      return { message: "Loot: XP Potion found!", item };
    } else {
      // Gold Pouch
      const goldAmount = Math.floor(Math.random() * 50) + 10;
      return { message: `Loot: Found ${goldAmount} Gold!`, gold: goldAmount };
    }
  }
  return null;
};

// Item Logic
export const useInventoryItem = (state: GameState, item: InventoryItem): Partial<GameState> | null => {
  const newState: Partial<GameState> = {
    inventory: state.inventory.filter(i => i.id !== item.id),
    logs: [...state.logs, `Used ${item.name}!`]
  };

  if (item.type === ItemType.XP_POTION) {
    newState.xp = state.xp + 1000;
    return newState;
  }

  if (item.type === ItemType.BOMB_SCROLL) {
    // Remove 3 lowest value tiles
    let grid = [...state.grid];
    // Sort by value ascending
    grid.sort((a, b) => a.value - b.value);
    
    // Remove first 3
    const toRemove = grid.slice(0, 3).map(t => t.id);
    const newGrid = state.grid.filter(t => !toRemove.includes(t.id));
    
    newState.grid = newGrid;
    return newState;
  }

  if (item.type === ItemType.GOLDEN_RUNE) {
    // Add effect flag to state to be used in next spawn
    newState.activeEffects = [...(state.activeEffects || []), 'GOLDEN_SPAWN'];
    return newState;
  }

  return null;
};

export const isGameOver = (grid: Tile[], size: number): boolean => {
  if (getEmptyCells(grid, size).length > 0) return false;
  for (let i = 0; i < grid.length; i++) {
    const t = grid[i];
    const neighbors = [
      grid.find(n => n.x === t.x + 1 && n.y === t.y),
      grid.find(n => n.x === t.x && n.y === t.y + 1)
    ];
    for (const n of neighbors) {
      if (n && n.value === t.value) return false;
    }
  }
  return true;
};

export const initializeGame = (loadFromStorage = false): GameState => {
  if (loadFromStorage) {
    const saved = localStorage.getItem('2048_rpg_state_v2');
    if (saved) {
      return JSON.parse(saved);
    }
  }

  let startGrid: Tile[] = [];
  startGrid = spawnTile(startGrid, GRID_SIZE_INITIAL, 1);
  startGrid = spawnTile(startGrid, GRID_SIZE_INITIAL, 1);

  return {
    grid: startGrid,
    score: 0,
    bestScore: parseInt(localStorage.getItem('2048_rpg_highscore') || '0'),
    xp: 0,
    gold: 0,
    level: 1,
    inventory: [],
    gridSize: GRID_SIZE_INITIAL,
    gameOver: false,
    victory: false,
    gameWon: false,
    combo: 0,
    logs: ['Welcome to the dungeon...'],
    activeEffects: []
  };
};
