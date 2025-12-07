
import { Direction, GameState, Tile, TileType, MoveResult, LootResult, ItemType, InventoryItem, Stage, LeaderboardEntry } from '../types';
import { GRID_SIZE_INITIAL, SHOP_ITEMS, getStage, getStageBackground } from '../constants';

const createId = () => Math.random().toString(36).substr(2, 9);
const LEADERBOARD_KEY = 'dragon_hoard_leaderboard';

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
  // Check for PowerUp Spawn (2% chance)
  if (!forcedValue && Math.random() < 0.02) {
    const powerUps = [TileType.RUNE_MIDAS, TileType.RUNE_CHRONOS, TileType.RUNE_VOID];
    const powerUpType = powerUps[Math.floor(Math.random() * powerUps.length)];
    
    const emptyCells = getEmptyCells(grid, size);
    if (emptyCells.length === 0) return grid;
    const { x, y } = emptyCells[Math.floor(Math.random() * emptyCells.length)];

    const newTile: Tile = {
        id: createId(),
        x,
        y,
        value: 2, // Base value, merges with 2
        type: powerUpType,
        isNew: true
    };
    return [...grid, newTile];
  }

  const emptyCells = getEmptyCells(grid, size);
  if (emptyCells.length === 0) return grid;

  const { x, y } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  
  // Default logic: Level 3 Perk: 5% chance for 4-spawn
  let value = (level >= 3 && Math.random() < 0.1) ? 4 : 2; // Slight bump to 10%
  
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

export const tryAutoMerge = (grid: Tile[]): { success: boolean; grid: Tile[]; value: number; mergedId?: string } => {
  // 5% chance to activate if called
  if (Math.random() > 0.05) return { success: false, grid, value: 0 };

  const pairs: { t1: Tile, t2: Tile }[] = [];
  for (let i = 0; i < grid.length; i++) {
    for (let j = i + 1; j < grid.length; j++) {
      const t1 = grid[i];
      const t2 = grid[j];
      const dist = Math.abs(t1.x - t2.x) + Math.abs(t1.y - t2.y);
      if (dist === 1 && t1.value === t2.value) {
        pairs.push({ t1, t2 });
      }
    }
  }

  if (pairs.length === 0) return { success: false, grid, value: 0 };

  const pair = pairs[Math.floor(Math.random() * pairs.length)];
  const { t1, t2 } = pair;
  const newValue = t1.value * 2;

  const newTile: Tile = {
    id: createId(),
    x: t1.x, // Keep position of first tile
    y: t1.y,
    value: newValue,
    type: TileType.NORMAL,
    mergedFrom: [t1.id, t2.id],
    isNew: false 
  };

  // Remove old tiles, add new one
  const newGrid = grid.filter(t => t.id !== t1.id && t.id !== t2.id);
  newGrid.push(newTile);

  return { success: true, grid: newGrid, value: newValue, mergedId: newTile.id };
};

export const moveGrid = (grid: Tile[], direction: Direction, size: number): MoveResult & { powerUpTriggered?: TileType } => {
  let moved = false;
  let score = 0;
  let xpGained = 0;
  let goldGained = 0;
  let powerUpTriggered: TileType | undefined;
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
          
          // Check for PowerUp Merges
          if (tile.type !== TileType.NORMAL) powerUpTriggered = tile.type;
          if (collision.type !== TileType.NORMAL) powerUpTriggered = collision.type;

          collision.value = mergedValue;
          collision.mergedFrom = [tile.id, collision.id];
          collision.type = TileType.NORMAL; // Reset type after merge

          mergedIndices.add(collision.id);
          
          score += collision.value;
          xpGained += collision.value * 2;
          
          // Gold Formula: 0.5 Gold per value, + bonus for high tier merges
          goldGained += Math.ceil(collision.value * 0.5);

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

  return { grid: newGrid, score, xpGained, goldGained, moved, mergedIds, powerUpTriggered };
};

// Power Up Logic Handlers

export const applyMidasTouch = (grid: Tile[]): { grid: Tile[]; score: number; mergedCount: number } => {
    // Recursively merge all possible tiles until no more merges
    let currentGrid = [...grid];
    let totalScore = 0;
    let totalMerged = 0;
    let changed = true;

    while (changed) {
        changed = false;
        // Simple greedy merge pass
        // Horizontal
        for (let i = 0; i < currentGrid.length; i++) {
            for (let j = i + 1; j < currentGrid.length; j++) {
                const t1 = currentGrid[i];
                const t2 = currentGrid[j];
                // Check if alive (might have been merged in this pass already)
                if (!t1 || !t2) continue;

                // Distance 1
                const dist = Math.abs(t1.x - t2.x) + Math.abs(t1.y - t2.y);
                if (dist === 1 && t1.value === t2.value) {
                    // Merge!
                    const newValue = t1.value * 2;
                    totalScore += newValue;
                    totalMerged++;
                    
                    const newTile: Tile = {
                         id: createId(),
                         x: t1.x,
                         y: t1.y,
                         value: newValue,
                         type: TileType.NORMAL,
                         mergedFrom: [t1.id, t2.id]
                    };
                    
                    // Remove t1 and t2, add newTile
                    const nextGrid = currentGrid.filter(t => t.id !== t1.id && t.id !== t2.id);
                    nextGrid.push(newTile);
                    currentGrid = nextGrid;
                    
                    changed = true;
                    break; // Restart loop to handle array mutation safely
                }
            }
            if (changed) break;
        }
    }
    return { grid: currentGrid, score: totalScore, mergedCount: totalMerged };
};

export const applyChronosShift = (grid: Tile[], size: number): Tile[] => {
    // Sort tiles by value descending
    const sorted = [...grid].sort((a, b) => b.value - a.value);
    const newGrid: Tile[] = [];
    
    // Snake pattern fill (top-left, right, down, left...)
    let x = 0, y = 0;
    let dx = 1; // 1 for right, -1 for left

    sorted.forEach(tile => {
        newGrid.push({ ...tile, x, y, isNew: false, mergedFrom: null });
        
        x += dx;
        if (x >= size || x < 0) {
            x -= dx; // Undo move
            y++;     // Move down
            dx = -dx; // Reverse horizontal direction
        }
    });
    
    return newGrid;
};

export const applyVoidSingularity = (grid: Tile[], size: number): { grid: Tile[]; score: number } => {
    const valueMap: Record<number, number> = {}; // value -> count
    let score = 0;
    
    grid.forEach(t => {
        valueMap[t.value] = (valueMap[t.value] || 0) + 1;
    });
    
    const newTiles: Tile[] = [];
    const finalValues: number[] = [];
    
    const process = (values: number[]) => {
        values.sort((a,b) => a - b);
        const nextValues: number[] = [];
        for (let i=0; i<values.length; i++) {
            if (i < values.length - 1 && values[i] === values[i+1]) {
                const merged = values[i] * 2;
                score += merged;
                nextValues.push(merged);
                i++; // skip next
            } else {
                nextValues.push(values[i]);
            }
        }
        return nextValues;
    };
    
    let currentValues = grid.map(t => t.value);
    let prevLen = currentValues.length + 1;
    
    while (currentValues.length < prevLen) {
        prevLen = currentValues.length;
        currentValues = process(currentValues);
    }
    
    // Layout in spiral from center (simplified to sorted fill)
    const sortedFinal = currentValues.sort((a,b) => b - a);
    
    let idx = 0;
    for(let r=0; r<size; r++) {
        for(let c=0; c<size; c++) {
             if (idx < sortedFinal.length) {
                 newTiles.push({
                     id: createId(),
                     x: c,
                     y: r,
                     value: sortedFinal[idx],
                     type: TileType.NORMAL
                 });
                 idx++;
             }
        }
    }
    
    return { grid: newTiles, score };
};

export const checkLoot = (level: number, mergedIds: string[], hasLuckyCharm: boolean = false): LootResult | null => {
  if (mergedIds.length === 0) return null;
  
  // Loot rolls
  // Chance increases slightly with merged IDs count
  const chance = (0.05 + (mergedIds.length * 0.01)) * (hasLuckyCharm ? 2 : 1);
  
  if (Math.random() < chance) {
    const roll = Math.random();

    if (roll > 0.95 && level >= 5) {
      const item: InventoryItem = {
        id: createId(),
        type: ItemType.GOLDEN_RUNE,
        name: "Golden Rune",
        description: "Next spawn is upgraded.",
        icon: "🌟"
      };
      return { message: "Loot: Golden Rune!", item };
    } else if (roll > 0.85 && level >= 3) {
      const item: InventoryItem = {
        id: createId(),
        type: ItemType.BOMB_SCROLL,
        name: "Purge Scroll",
        description: "Clears weak enemies.",
        icon: "📜"
      };
      return { message: "Loot: Purge Scroll!", item };
    } else if (roll > 0.7 && level >= 15) {
       const item: InventoryItem = {
        id: createId(),
        type: ItemType.REROLL_TOKEN,
        name: "Reroll Token",
        description: "Free Board Reroll",
        icon: "🔄"
      };
      return { message: "Loot: Reroll Token!", item }; 
    } else if (roll > 0.6) {
      const item: InventoryItem = {
        id: createId(),
        type: ItemType.XP_POTION,
        name: "XP Potion",
        description: "+500 XP",
        icon: "🧪"
      };
      return { message: "Loot: XP Potion!", item };
    } else {
      const goldAmount = Math.floor(Math.random() * 50) + 10;
      return { message: `Loot: ${goldAmount} Gold`, gold: goldAmount };
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

  // Standard Items
  if (item.type === ItemType.XP_POTION) {
    newState.xp = state.xp + (500 * state.level);
    return newState;
  }

  if (item.type === ItemType.BOMB_SCROLL) {
    let grid = [...state.grid];
    grid.sort((a, b) => a.value - b.value);
    const toRemove = grid.slice(0, 3).map(t => t.id);
    const newGrid = state.grid.filter(t => !toRemove.includes(t.id));
    newState.grid = newGrid;
    return newState;
  }

  if (item.type === ItemType.GOLDEN_RUNE) {
    newState.activeEffects = [...(state.activeEffects || []), 'GOLDEN_SPAWN'];
    return newState;
  }

  if (item.type === ItemType.REROLL_TOKEN) {
      newState.rerolls = (state.rerolls || 0) + 1;
      return newState;
  }

  if (item.type === ItemType.LUCKY_CHARM) {
      const counters = { ...state.effectCounters };
      counters['LUCKY_LOOT'] = (counters['LUCKY_LOOT'] || 0) + 3;
      newState.effectCounters = counters;
      return newState;
  }

  // Crafted Items
  if (item.type === ItemType.GREATER_XP_POTION) {
    newState.xp = state.xp + (2000 * state.level);
    return newState;
  }

  if (item.type === ItemType.CATACLYSM_SCROLL) {
    // Destroy 50% of the board, but spare tiles > 1024
    let grid = [...state.grid].filter(t => t.value < 1024);
    // Shuffle
    for (let i = grid.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [grid[i], grid[j]] = [grid[j], grid[i]];
    }
    const toRemoveIds = grid.slice(0, Math.floor(grid.length / 2)).map(t => t.id);
    const newGrid = state.grid.filter(t => !toRemoveIds.includes(t.id));
    newState.grid = newGrid;
    return newState;
  }

  if (item.type === ItemType.ASCENDANT_RUNE) {
      // Add a counter to effects
      const counters = { ...state.effectCounters };
      counters['ASCENDANT_SPAWN'] = (counters['ASCENDANT_SPAWN'] || 0) + 5;
      newState.effectCounters = counters;
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
    const saved = localStorage.getItem('2048_rpg_state_v3');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration: Ensure new fields exist
      if (!parsed.effectCounters) parsed.effectCounters = {};
      if (typeof parsed.rerolls === 'undefined') parsed.rerolls = 0;
      
      if (!parsed.currentStage) {
          const stageConfig = getStage(parsed.level);
          parsed.currentStage = {
              name: stageConfig.name,
              minLevel: stageConfig.minLevel,
              backgroundUrl: getStageBackground(stageConfig.name),
              colorTheme: stageConfig.color
          };
      }
      return parsed;
    }
  }

  let startGrid: Tile[] = [];
  startGrid = spawnTile(startGrid, GRID_SIZE_INITIAL, 1);
  startGrid = spawnTile(startGrid, GRID_SIZE_INITIAL, 1);

  const stageConfig = getStage(1);
  const initialStage: Stage = {
      name: stageConfig.name,
      minLevel: stageConfig.minLevel,
      backgroundUrl: getStageBackground(stageConfig.name),
      colorTheme: stageConfig.color
  };

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
    activeEffects: [],
    effectCounters: {},
    currentStage: initialStage,
    rerolls: 0,
    lastSpawnedTileId: undefined
  };
};

export const saveHighscore = (state: GameState) => {
    try {
        const raw = localStorage.getItem(LEADERBOARD_KEY);
        let entries: LeaderboardEntry[] = raw ? JSON.parse(raw) : [];
        
        entries.push({
            date: Date.now(),
            score: state.score,
            level: state.level,
            gold: state.gold
        });
        
        // Sort descending score
        entries.sort((a, b) => b.score - a.score);
        
        // Keep top 20
        entries = entries.slice(0, 20);
        
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
    } catch (e) {
        console.error("Failed to save high score", e);
    }
};

export const getHighscores = (): LeaderboardEntry[] => {
    try {
        const raw = localStorage.getItem(LEADERBOARD_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
};

export const clearSaveData = () => {
    localStorage.removeItem('2048_rpg_state_v3');
    localStorage.removeItem(LEADERBOARD_KEY);
    localStorage.removeItem('2048_rpg_highscore');
}
