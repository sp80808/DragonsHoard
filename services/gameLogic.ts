
import { Direction, GameState, Tile, TileType, MoveResult, LootResult, ItemType, InventoryItem, Stage, LeaderboardEntry, GameStats, Achievement } from '../types';
import { GRID_SIZE_INITIAL, SHOP_ITEMS, getStage, getStageBackground, ACHIEVEMENTS } from '../constants';

const createId = () => Math.random().toString(36).substr(2, 9);
const LEADERBOARD_KEY = 'dragon_hoard_leaderboard';
const ACHIEVEMENTS_STORAGE_KEY = 'dragon_hoard_unlocked_achievements';

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
  let activeGrid = [...grid];
  
  // Helper to place one tile
  const placeOne = (currentGrid: Tile[], val?: number): Tile[] => {
      const empty = getEmptyCells(currentGrid, size);
      if (empty.length === 0) return currentGrid;
      
      const { x, y } = empty[Math.floor(Math.random() * empty.length)];
      
      // Default Value Logic
      let value = (level >= 3 && Math.random() < 0.1) ? 4 : 2;
      if (val) value = val;

      const newTile: Tile = {
        id: createId(),
        x,
        y,
        value,
        type: TileType.NORMAL,
        isNew: true,
      };
      return [...currentGrid, newTile];
  };

  // Power Up Check (2%)
  if (!forcedValue && Math.random() < 0.02) {
    const powerUps = [TileType.RUNE_MIDAS, TileType.RUNE_CHRONOS, TileType.RUNE_VOID];
    const powerUpType = powerUps[Math.floor(Math.random() * powerUps.length)];
    const empty = getEmptyCells(activeGrid, size);
    if (empty.length > 0) {
        const { x, y } = empty[Math.floor(Math.random() * empty.length)];
        return [...activeGrid, { id: createId(), x, y, value: 2, type: powerUpType, isNew: true }];
    }
  }

  // Determine value to spawn
  activeGrid = placeOne(activeGrid, forcedValue);

  // Slime Ability: 20% chance to spawn an extra slime if the spawned tile was a Slime (2)
  const lastTile = activeGrid[activeGrid.length - 1];
  if (lastTile && lastTile.value === 2 && lastTile.isNew && Math.random() < 0.2) {
      activeGrid = placeOne(activeGrid, 2);
  }

  return activeGrid;
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

  let newGrid: Tile[] = [];
  const mergedIndices = new Set<string>();

  sortedTiles.forEach((tile) => {
    let { x, y } = tile;
    let nextX = x + vector.x;
    let nextY = y + vector.y;
    let merged = false;
    
    // Simulate slide
    while (
      nextX >= 0 && nextX < size &&
      nextY >= 0 && nextY < size
    ) {
      const collision = newGrid.find(t => t.x === nextX && t.y === nextY);
      
      if (collision) {
        if (!mergedIndices.has(collision.id) && collision.value === tile.value) {
          // MERGE HAPPENS
          moved = true;
          merged = true;
          const mergedValue = tile.value * 2;
          
          // Check for PowerUp Merges
          if (tile.type !== TileType.NORMAL) powerUpTriggered = tile.type;
          if (collision.type !== TileType.NORMAL) powerUpTriggered = collision.type;

          collision.value = mergedValue;
          collision.mergedFrom = [tile.id, collision.id]; // Animation source
          collision.type = TileType.NORMAL; 

          mergedIndices.add(collision.id);
          mergedIds.push(collision.id);
          
          score += collision.value;
          xpGained += collision.value * 2;
          
          // Base Gold
          goldGained += Math.ceil(collision.value * 0.5);

          // Goblin Ability: Bonus Gold (Value 4 merging into 8)
          if (collision.value === 8) {
              goldGained += 5; 
          }
          
          return;
        } else {
          break; // Hit a block
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

    if (!merged) {
        newGrid.push({
            ...tile,
            x,
            y,
            mergedFrom: null,
            isNew: false
        });
    }
  });

  // Post-Process Abilities: Drake (32)
  const drakeMerges = newGrid.filter(t => t.value === 32 && t.mergedFrom);
  drakeMerges.forEach(drake => {
      const neighbors = newGrid.filter(n => 
          n.id !== drake.id && 
          n.value < 32 &&
          Math.abs(n.x - drake.x) + Math.abs(n.y - drake.y) === 1
      );
      
      if (neighbors.length > 0) {
          const victim = neighbors[Math.floor(Math.random() * neighbors.length)];
          victim.value *= 2; // Upgrade!
          victim.mergedFrom = [victim.id];
          xpGained += victim.value;
      }
  });

  // Combo Calculation
  const mergeCount = mergedIds.length;
  let comboMultiplier = 1;
  if (mergeCount > 1) {
      comboMultiplier = 1 + (mergeCount - 1) * 0.5;
  }

  xpGained = Math.floor(xpGained * comboMultiplier);
  goldGained = Math.floor(goldGained * comboMultiplier);

  return { grid: newGrid, score, xpGained, goldGained, moved, mergedIds, powerUpTriggered, combo: mergeCount, comboMultiplier };
};

export const applyMidasTouch = (grid: Tile[]): { grid: Tile[]; score: number; mergedCount: number } => {
    let currentGrid = [...grid];
    let totalScore = 0;
    let totalMerged = 0;
    let changed = true;
    while (changed) {
        changed = false;
        for (let i = 0; i < currentGrid.length; i++) {
            for (let j = i + 1; j < currentGrid.length; j++) {
                const t1 = currentGrid[i];
                const t2 = currentGrid[j];
                if (!t1 || !t2) continue;
                const dist = Math.abs(t1.x - t2.x) + Math.abs(t1.y - t2.y);
                if (dist === 1 && t1.value === t2.value) {
                    const newValue = t1.value * 2;
                    totalScore += newValue;
                    totalMerged++;
                    const newTile: Tile = { id: createId(), x: t1.x, y: t1.y, value: newValue, type: TileType.NORMAL, mergedFrom: [t1.id, t2.id] };
                    const nextGrid = currentGrid.filter(t => t.id !== t1.id && t.id !== t2.id);
                    nextGrid.push(newTile);
                    currentGrid = nextGrid;
                    changed = true;
                    break;
                }
            }
            if (changed) break;
        }
    }
    return { grid: currentGrid, score: totalScore, mergedCount: totalMerged };
};

export const applyChronosShift = (grid: Tile[], size: number): Tile[] => {
    const sorted = [...grid].sort((a, b) => b.value - a.value);
    const newGrid: Tile[] = [];
    let x = 0, y = 0, dx = 1;
    sorted.forEach(tile => {
        newGrid.push({ ...tile, x, y, isNew: false, mergedFrom: null });
        x += dx;
        if (x >= size || x < 0) { x -= dx; y++; dx = -dx; }
    });
    return newGrid;
};

export const applyVoidSingularity = (grid: Tile[], size: number): { grid: Tile[]; score: number } => {
    let score = 0;
    
    // Collapse logic
    const process = (values: number[]) => {
        values.sort((a,b) => a - b);
        const nextValues: number[] = [];
        for (let i=0; i<values.length; i++) {
            if (i < values.length - 1 && values[i] === values[i+1]) {
                const merged = values[i] * 2;
                score += merged;
                nextValues.push(merged);
                i++; 
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
    const sortedFinal = currentValues.sort((a,b) => b - a);
    let idx = 0;
    const newTiles: Tile[] = [];
    for(let r=0; r<size; r++) {
        for(let c=0; c<size; c++) {
             if (idx < sortedFinal.length) {
                 newTiles.push({ id: createId(), x: c, y: r, value: sortedFinal[idx], type: TileType.NORMAL });
                 idx++;
             }
        }
    }
    return { grid: newTiles, score };
};

export const checkLoot = (level: number, mergedIds: string[], hasLuckyCharm: boolean = false): LootResult | null => {
  if (mergedIds.length === 0) return null;
  const chance = (0.05 + (mergedIds.length * 0.01)) * (hasLuckyCharm ? 2 : 1);
  if (Math.random() < chance) {
    const roll = Math.random();
    if (roll > 0.95 && level >= 5) {
      return { message: "Loot: Golden Rune!", item: { id: createId(), type: ItemType.GOLDEN_RUNE, name: "Golden Rune", description: "Next spawn is upgraded.", icon: "🌟" } };
    } else if (roll > 0.85 && level >= 3) {
      return { message: "Loot: Purge Scroll!", item: { id: createId(), type: ItemType.BOMB_SCROLL, name: "Purge Scroll", description: "Clears weak enemies.", icon: "📜" } };
    } else if (roll > 0.7 && level >= 15) {
       return { message: "Loot: Reroll Token!", item: { id: createId(), type: ItemType.REROLL_TOKEN, name: "Reroll Token", description: "Free Board Reroll", icon: "🔄" } }; 
    } else if (roll > 0.6) {
      return { message: "Loot: XP Potion!", item: { id: createId(), type: ItemType.XP_POTION, name: "XP Potion", description: "+500 XP", icon: "🧪" } };
    } else {
      const goldAmount = Math.floor(Math.random() * 50) + 10;
      return { message: `Loot: ${goldAmount} Gold`, gold: goldAmount };
    }
  }
  return null;
};

export const useInventoryItem = (state: GameState, item: InventoryItem): Partial<GameState> | null => {
  const newState: Partial<GameState> = {
    inventory: state.inventory.filter(i => i.id !== item.id),
    logs: [...state.logs, `Used ${item.name}!`]
  };
  if (item.type === ItemType.XP_POTION) { newState.xp = state.xp + (500 * state.level); return newState; }
  if (item.type === ItemType.BOMB_SCROLL) {
    let grid = [...state.grid];
    grid.sort((a, b) => a.value - b.value);
    const toRemove = grid.slice(0, 3).map(t => t.id);
    newState.grid = state.grid.filter(t => !toRemove.includes(t.id));
    return newState;
  }
  if (item.type === ItemType.GOLDEN_RUNE) { newState.activeEffects = [...(state.activeEffects || []), 'GOLDEN_SPAWN']; return newState; }
  if (item.type === ItemType.REROLL_TOKEN) { newState.rerolls = (state.rerolls || 0) + 1; return newState; }
  if (item.type === ItemType.LUCKY_CHARM) { 
      const counters = { ...state.effectCounters };
      counters['LUCKY_LOOT'] = (counters['LUCKY_LOOT'] || 0) + 3;
      newState.effectCounters = counters;
      return newState;
  }
  if (item.type === ItemType.GREATER_XP_POTION) { newState.xp = state.xp + (2000 * state.level); return newState; }
  if (item.type === ItemType.CATACLYSM_SCROLL) {
    let grid = [...state.grid].filter(t => t.value < 1024);
    for (let i = grid.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [grid[i], grid[j]] = [grid[j], grid[i]]; }
    const toRemoveIds = grid.slice(0, Math.floor(grid.length / 2)).map(t => t.id);
    newState.grid = state.grid.filter(t => !toRemoveIds.includes(t.id));
    return newState;
  }
  if (item.type === ItemType.ASCENDANT_RUNE) {
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

// --- Achievement Persistence Logic ---

export const getPersistentAchievements = (): string[] => {
    try {
        const raw = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
};

export const savePersistentAchievements = (ids: string[]) => {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(ids));
};

export const checkAchievements = (state: GameState): Achievement[] => {
    const newUnlocks: Achievement[] = [];
    
    ACHIEVEMENTS.forEach(ach => {
        if (!state.achievements.includes(ach.id)) {
            if (ach.condition(state.stats, state)) {
                newUnlocks.push(ach);
            }
        }
    });
    
    return newUnlocks;
};

export const initializeGame = (loadFromStorage = false): GameState => {
  const initialStats: GameStats = { totalMerges: 0, highestCombo: 0, slimesMerged: 0, goldCollected: 0, highestTile: 0, totalMoves: 0 };
  const persistentAchievements = getPersistentAchievements();
  
  if (loadFromStorage) {
    const saved = localStorage.getItem('2048_rpg_state_v3');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrations
      if (!parsed.stats) parsed.stats = initialStats;
      if (!parsed.effectCounters) parsed.effectCounters = {};
      if (typeof parsed.rerolls === 'undefined') parsed.rerolls = 0;
      
      // Merge saved achievements with persistent ones to ensure they are up to date
      const mergedAchievements = Array.from(new Set([...(parsed.achievements || []), ...persistentAchievements]));
      parsed.achievements = mergedAchievements;

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
    lastSpawnedTileId: undefined,
    stats: initialStats,
    achievements: persistentAchievements // Start with persistent achievements
  };
};

export const saveHighscore = (state: GameState) => {
    try {
        const raw = localStorage.getItem(LEADERBOARD_KEY);
        let entries: LeaderboardEntry[] = raw ? JSON.parse(raw) : [];
        entries.push({ date: Date.now(), score: state.score, level: state.level, gold: state.gold });
        entries.sort((a, b) => b.score - a.score);
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
    } catch (e) { return []; }
};

export const clearSaveData = () => {
    localStorage.removeItem('2048_rpg_state_v3');
    localStorage.removeItem(LEADERBOARD_KEY);
    localStorage.removeItem('2048_rpg_highscore');
    localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
}
