
import { Direction, GameState, Tile, TileType, MoveResult, LootResult, ItemType, InventoryItem, Stage, LeaderboardEntry, GameStats, Achievement, InputSettings, RunStats, HeroClass, GameMode, PlayerProfile } from '../types';
import { GRID_SIZE_INITIAL, SHOP_ITEMS, getStage, getStageBackground, ACHIEVEMENTS, TILE_STYLES, FALLBACK_STYLE, getItemDefinition } from '../constants';

const createId = () => Math.random().toString(36).substr(2, 9);
const LEADERBOARD_KEY = 'dragon_hoard_leaderboard';
const ACHIEVEMENTS_STORAGE_KEY = 'dragon_hoard_unlocked_achievements';
const PROFILE_STORAGE_KEY = 'dragons_hoard_profile';

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

interface SpawnOptions {
  forcedValue?: number;
  type?: TileType;
  bossLevel?: number;
  isClassic?: boolean;
}

export const spawnTile = (grid: Tile[], size: number, level: number, options?: SpawnOptions | number): Tile[] => {
  let activeGrid = [...grid];
  
  // Normalize args
  let forcedValue: number | undefined;
  let type: TileType = TileType.NORMAL;
  let bossLevel = 0;
  let isClassic = false;

  if (typeof options === 'number') {
    forcedValue = options;
  } else if (options) {
    forcedValue = options.forcedValue;
    type = options.type || TileType.NORMAL;
    bossLevel = options.bossLevel || level;
    isClassic = !!options.isClassic;
  }

  // Helper to place one tile
  const placeOne = (currentGrid: Tile[], val?: number, forceType?: TileType): Tile[] => {
      const empty = getEmptyCells(currentGrid, size);
      if (empty.length === 0) return currentGrid;
      
      const { x, y } = empty[Math.floor(Math.random() * empty.length)];
      
      let value = 2;
      let finalType = forceType || TileType.NORMAL;
      
      // In Classic Mode, never spawn bosses or special runes from spawnTile
      if (isClassic) {
          finalType = TileType.NORMAL;
      }

      let health, maxHealth;
      if (finalType === TileType.BOSS) {
          value = 0; // Boss has 0 value for merges
          maxHealth = bossLevel * 100;
          health = maxHealth;
      } else {
          // Default Value Logic
          value = (level >= 3 && Math.random() < 0.1) ? 4 : 2;
          if (val) value = val;
      }

      const newTile: Tile = {
        id: createId(),
        x,
        y,
        value,
        type: finalType,
        isNew: true,
        health,
        maxHealth
      };
      return [...currentGrid, newTile];
  };

  // If spawning a boss, prioritize it
  if (type === TileType.BOSS && !isClassic) {
      return placeOne(activeGrid, 0, TileType.BOSS);
  }

  // Power Up Check (2%) - Only if not forced and not Classic
  if (!forcedValue && !isClassic && type === TileType.NORMAL && Math.random() < 0.02) {
    const powerUps = [TileType.RUNE_MIDAS, TileType.RUNE_CHRONOS, TileType.RUNE_VOID];
    const powerUpType = powerUps[Math.floor(Math.random() * powerUps.length)];
    const empty = getEmptyCells(activeGrid, size);
    if (empty.length > 0) {
        const { x, y } = empty[Math.floor(Math.random() * empty.length)];
        return [...activeGrid, { id: createId(), x, y, value: 2, type: powerUpType, isNew: true }];
    }
  }

  // Determine value to spawn
  activeGrid = placeOne(activeGrid, forcedValue, type);

  // Slime Ability: 20% chance to spawn an extra slime if the spawned tile was a Slime (2)
  // Disable in classic to keep it pure 2048? Or keep as "flavor"? 
  // Standard 2048 doesn't have double spawns.
  const lastTile = activeGrid[activeGrid.length - 1];
  if (!isClassic && lastTile && lastTile.type === TileType.NORMAL && lastTile.value === 2 && lastTile.isNew && Math.random() < 0.2) {
      activeGrid = placeOne(activeGrid, 2);
  }

  return activeGrid;
};

export const tryAutoMerge = (grid: Tile[]): { success: boolean; grid: Tile[]; value: number; mergedId?: string } => {
  // Legacy perk-based auto merge (random)
  // 5% chance to activate if called
  if (Math.random() > 0.05) return { success: false, grid, value: 0 };

  const pairs: { t1: Tile, t2: Tile }[] = [];
  for (let i = 0; i < grid.length; i++) {
    for (let j = i + 1; j < grid.length; j++) {
      const t1 = grid[i];
      const t2 = grid[j];
      // Auto merge only works on normal tiles
      if (t1.type === TileType.BOSS || t2.type === TileType.BOSS) continue;
      
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

// --- CASCADE SYSTEM ---
export const executeAutoCascade = (grid: Tile[], size: number, cascadeStep: number): { grid: Tile[], rewards: { xp: number, gold: number }, occurred: boolean, mergedId?: string } => {
    // Deep copy grid and reset visual flags
    let newGrid: Tile[] = grid.map(t => ({ ...t, isNew: false, mergedFrom: null, isCascade: false })); 

    const getTile = (x: number, y: number) => newGrid.find(t => t.x === x && t.y === y);

    let pair: { t1: Tile, t2: Tile } | null = null;

    // Scan logic: Top-Left to Bottom-Right to find the first available merge
    for(let y = 0; y < size; y++) {
        for(let x = 0; x < size; x++) {
            const t1 = getTile(x, y);
            if (!t1 || t1.type === TileType.BOSS) continue;

            // Check Right
            const right = getTile(x + 1, y);
            if (right && right.type !== TileType.BOSS && right.value === t1.value) {
                pair = { t1, t2: right };
                break;
            }

            // Check Down
            const down = getTile(x, y + 1);
            if (down && down.type !== TileType.BOSS && down.value === t1.value) {
                pair = { t1, t2: down };
                break;
            }
        }
        if (pair) break;
    }

    if (!pair) {
        return { grid, rewards: { xp: 0, gold: 0 }, occurred: false };
    }

    const { t1, t2 } = pair;
    const newValue = t1.value * 2;
    
    // Multiplier logic: 1.1^cascadeStep
    const multiplier = Math.pow(1.1, Math.max(0, cascadeStep));

    const mergedTile: Tile = {
        id: createId(),
        x: t1.x, // Anchor to top-left tile of the pair
        y: t1.y,
        value: newValue,
        type: TileType.NORMAL,
        mergedFrom: [t1.id, t2.id],
        isNew: false,
        isCascade: true
    };

    // Remove old tiles, add new one
    newGrid = newGrid.filter(t => t.id !== t1.id && t.id !== t2.id);
    newGrid.push(mergedTile);

    return {
        grid: newGrid,
        rewards: {
            xp: Math.floor(newValue * multiplier),
            gold: Math.floor((newValue / 2) * multiplier)
        },
        occurred: true,
        mergedId: mergedTile.id
    };
};

export const moveGrid = (grid: Tile[], direction: Direction, size: number, mode: GameMode): MoveResult & { powerUpTriggered?: TileType } => {
  let moved = false;
  let score = 0;
  let xpGained = 0;
  let goldGained = 0;
  let powerUpTriggered: TileType | undefined;
  const mergedIds: string[] = [];
  let bossDefeated = false;
  const logs: string[] = [];
  const isClassic = mode === 'CLASSIC';

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

  // Movement Phase
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
        if (tile.type === TileType.BOSS || collision.type === TileType.BOSS) {
            break; 
        }

        if (!mergedIndices.has(collision.id) && collision.value === tile.value) {
          // MERGE HAPPENS
          moved = true;
          merged = true;
          const mergedValue = tile.value * 2;
          
          if (!isClassic) {
            if (tile.type !== TileType.NORMAL) powerUpTriggered = tile.type;
            if (collision.type !== TileType.NORMAL) powerUpTriggered = collision.type;
          }

          collision.value = mergedValue;
          collision.mergedFrom = [tile.id, collision.id];
          collision.type = TileType.NORMAL; 

          mergedIndices.add(collision.id);
          mergedIds.push(collision.id);
          
          score += collision.value;
          
          if (!isClassic) {
              xpGained += collision.value * 2;
              goldGained += Math.ceil(collision.value * 0.5);
              if (collision.value === 8) {
                  goldGained += 5; 
              }
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

  // RPG Logic Checks (Disabled in Classic)
  if (!isClassic) {
      // Post-Process Abilities: Drake (32)
      const drakeMerges = newGrid.filter(t => t.value === 32 && t.mergedFrom);
      drakeMerges.forEach(drake => {
          const neighbors = newGrid.filter(n => 
              n.id !== drake.id && 
              n.type !== TileType.BOSS &&
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

      // Boss Damage Logic
      const bossTiles = newGrid.filter(t => t.type === TileType.BOSS);
      let deadBossIds: string[] = [];

      bossTiles.forEach(boss => {
          if (!boss.health) return;

          const adjacentMerges = newGrid.filter(t => 
              mergedIds.includes(t.id) &&
              Math.abs(t.x - boss.x) + Math.abs(t.y - boss.y) === 1
          );

          if (adjacentMerges.length > 0) {
              let totalDamage = 0;
              adjacentMerges.forEach(m => totalDamage += m.value);
              
              boss.health -= totalDamage;
              boss.mergedFrom = ['damage'];

              logs.push(`Boss hit for ${totalDamage} damage!`);

              if (boss.health <= 0) {
                  deadBossIds.push(boss.id);
                  bossDefeated = true;
                  
                  const rewardXP = (boss.maxHealth || 100) * 5;
                  const rewardGold = (boss.maxHealth || 100);
                  
                  xpGained += rewardXP;
                  goldGained += rewardGold;
                  logs.push(`Boss Defeated! +${rewardGold}G +${rewardXP}XP`);
              }
          }
      });

      if (deadBossIds.length > 0) {
          newGrid = newGrid.filter(t => !deadBossIds.includes(t.id));
          moved = true; 
      }
  }

  // Combo Calculation
  const mergeCount = mergedIds.length;
  let comboMultiplier = 1;
  if (mergeCount > 1) {
      comboMultiplier = 1 + (mergeCount - 1) * 0.5;
  }

  if (!isClassic) {
      xpGained = Math.floor(xpGained * comboMultiplier);
      goldGained = Math.floor(goldGained * comboMultiplier);
  }

  return { grid: newGrid, score, xpGained, goldGained, moved, mergedIds, powerUpTriggered, combo: mergeCount, comboMultiplier, logs, bossDefeated };
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
                if (t1.type === TileType.BOSS || t2.type === TileType.BOSS) continue;

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
    const bosses = grid.filter(t => t.type === TileType.BOSS);
    const normalTiles = grid.filter(t => t.type !== TileType.BOSS);

    const sorted = [...normalTiles].sort((a, b) => b.value - a.value);
    const newGrid: Tile[] = [];
    
    const occupied = new Set(bosses.map(b => `${b.x},${b.y}`));
    let sortedIdx = 0;

    for(let y=0; y<size; y++) {
        for(let x=0; x<size; x++) {
            if (occupied.has(`${x},${y}`)) {
                const boss = bosses.find(b => b.x === x && b.y === y);
                if (boss) newGrid.push(boss);
            } else {
                if (sortedIdx < sorted.length) {
                    const t = sorted[sortedIdx];
                    newGrid.push({ ...t, x, y, isNew: false, mergedFrom: null });
                    sortedIdx++;
                }
            }
        }
    }
    return newGrid;
};

export const applyVoidSingularity = (grid: Tile[], size: number): { grid: Tile[]; score: number } => {
    let score = 0;
    const bosses = grid.filter(t => t.type === TileType.BOSS);
    
    bosses.forEach(b => {
        if(b.health) b.health = Math.floor(b.health / 2); 
    });
    
    const others = grid.filter(t => t.type !== TileType.BOSS);
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
    
    let currentValues = others.map(t => t.value);
    let prevLen = currentValues.length + 1;
    while (currentValues.length < prevLen) {
        prevLen = currentValues.length;
        currentValues = process(currentValues);
    }
    const sortedFinal = currentValues.sort((a,b) => b - a);
    
    const occupied = new Set(bosses.map(b => `${b.x},${b.y}`));
    const newTiles: Tile[] = [...bosses];
    let idx = 0;
    
    for(let r=0; r<size; r++) {
        for(let c=0; c<size; c++) {
             if (!occupied.has(`${c},${r}`) && idx < sortedFinal.length) {
                 newTiles.push({ id: createId(), x: c, y: r, value: sortedFinal[idx], type: TileType.NORMAL });
                 idx++;
             }
        }
    }
    return { grid: newTiles, score };
};

export const checkLoot = (level: number, mergedIds: string[], hasLuckyCharm: boolean = false, isClassic: boolean = false): LootResult | null => {
  if (isClassic) return null;
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
  if (state.gameMode === 'CLASSIC') return null;

  const newState: Partial<GameState> = {
    inventory: state.inventory.filter(i => i.id !== item.id),
    logs: [...state.logs, `Used ${item.name}!`]
  };
  if (item.type === ItemType.XP_POTION) { newState.xp = state.xp + (500 * state.level); return newState; }
  if (item.type === ItemType.BOMB_SCROLL) {
    let grid = [...state.grid];
    const candidates = grid.filter(t => t.type !== TileType.BOSS);
    candidates.sort((a, b) => a.value - a.value);
    const toRemoveIds = candidates.slice(0, 3).map(t => t.id);
    newState.grid = state.grid.filter(t => !toRemoveIds.includes(t.id));
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
  
  // Crafted items logic
  if (item.type === ItemType.GREATER_XP_POTION) { newState.xp = state.xp + 2500; return newState; }
  if (item.type === ItemType.CATACLYSM_SCROLL) {
      const nonBoss = state.grid.filter(t => t.type !== TileType.BOSS);
      const shuffled = nonBoss.sort(() => 0.5 - Math.random());
      const toRemoveCount = Math.floor(shuffled.length / 2);
      const toRemoveIds = shuffled.slice(0, toRemoveCount).map(t => t.id);
      newState.grid = state.grid.filter(t => !toRemoveIds.includes(t.id));
      return newState;
  }
  if (item.type === ItemType.ASCENDANT_RUNE) {
      const counters = { ...state.effectCounters };
      counters['ASCENDANT_SPAWN'] = 5;
      newState.effectCounters = counters;
      return newState;
  }

  return null;
};

export const initializeGame = (reset = false, selectedClass: HeroClass = HeroClass.ADVENTURER, mode: GameMode = 'RPG'): GameState => {
  const saved = localStorage.getItem('2048_rpg_state_v3');
  
  // Try to load account level for cascade check
  let accountLevel = 1;
  try {
      const profileStr = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (profileStr) {
          const profile: PlayerProfile = JSON.parse(profileStr);
          accountLevel = profile.accountLevel || 1;
      }
  } catch (e) {
      console.warn("Failed to load profile for init", e);
  }

  const defaultSettings: InputSettings = {
    enableKeyboard: true,
    enableSwipe: true,
    enableScroll: true,
    invertSwipe: false,
    invertScroll: false,
    sensitivity: 5
  };

  const startStageConfig = getStage(1);
  const startStage: Stage = {
      name: startStageConfig.name,
      minLevel: startStageConfig.minLevel,
      backgroundUrl: getStageBackground(startStageConfig.name),
      colorTheme: startStageConfig.color,
      barColor: startStageConfig.barColor
  };

  const initialRunStats: RunStats = {
      highestTile: 2,
      highestMonster: 'Slime',
      stageReached: startStage.name,
      turnCount: 0,
      powerUpsUsed: 0,
      goldEarned: 0,
      cascadesTriggered: 0,
      startTime: Date.now(),
      bossesDefeated: 0,
      mergesCount: 0,
      itemsCrafted: 0
  };

  if (saved && !reset) {
    try {
        const parsed = JSON.parse(saved);
        
        const stageConfig = getStage(parsed.level || 1);
        parsed.currentStage = {
            name: stageConfig.name,
            minLevel: stageConfig.minLevel,
            backgroundUrl: getStageBackground(stageConfig.name),
            colorTheme: stageConfig.color,
            barColor: stageConfig.barColor || startStageConfig.barColor
        };
        if (!parsed.settings) parsed.settings = defaultSettings;
        if (!parsed.runStats) parsed.runStats = initialRunStats;
        if (!parsed.selectedClass) parsed.selectedClass = HeroClass.ADVENTURER;
        if (!parsed.gameMode) parsed.gameMode = 'RPG';
        
        // Update account level on load in case it changed
        parsed.accountLevel = accountLevel;

        return parsed;
    } catch (e) {
        console.error("Failed to load save", e);
    }
  }

  const initialSize = GRID_SIZE_INITIAL;
  let grid: Tile[] = [];
  grid = spawnTile(grid, initialSize, 1, { forcedValue: 2, isClassic: mode === 'CLASSIC' });
  grid = spawnTile(grid, initialSize, 1, { forcedValue: 2, isClassic: mode === 'CLASSIC' });

  const savedAchievements = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
  const achievements = savedAchievements ? JSON.parse(savedAchievements) : [];
  const savedHighscore = localStorage.getItem('2048_rpg_highscore');

  // Class Starting Bonuses (Skip in Classic)
  const inventory: InventoryItem[] = [];
  if (mode !== 'CLASSIC') {
      if (selectedClass === HeroClass.WARRIOR) {
          const def = getItemDefinition(ItemType.BOMB_SCROLL);
          inventory.push({ id: createId(), type: ItemType.BOMB_SCROLL, name: def.name, description: def.desc, icon: def.icon });
      } else if (selectedClass === HeroClass.ROGUE) {
           const def = getItemDefinition(ItemType.REROLL_TOKEN);
          inventory.push({ id: createId(), type: ItemType.REROLL_TOKEN, name: def.name, description: def.desc, icon: def.icon });
      } else if (selectedClass === HeroClass.MAGE) {
           const def = getItemDefinition(ItemType.XP_POTION);
          inventory.push({ id: createId(), type: ItemType.XP_POTION, name: def.name, description: def.desc, icon: def.icon });
      } else if (selectedClass === HeroClass.PALADIN) {
           const def = getItemDefinition(ItemType.GOLDEN_RUNE);
          inventory.push({ id: createId(), type: ItemType.GOLDEN_RUNE, name: def.name, description: def.desc, icon: def.icon });
      }
  }

  return {
    grid,
    score: 0,
    bestScore: savedHighscore ? parseInt(savedHighscore) : 0,
    xp: 0,
    level: 1,
    gold: 0,
    inventory,
    gridSize: initialSize,
    gameOver: false,
    victory: false,
    gameWon: false,
    combo: 0,
    isCascading: false,
    cascadeStep: 0,
    logs: mode === 'CLASSIC' ? ["Classic Mode", "Survive."] : [`Class: ${selectedClass}`, "Welcome to the Dungeon."],
    activeEffects: [],
    effectCounters: {},
    currentStage: startStage,
    rerolls: 0,
    stats: {
        totalMerges: 0,
        highestCombo: 0,
        slimesMerged: 0,
        bossesDefeated: 0,
        goldCollected: 0,
        highestTile: 2,
        totalMoves: 0
    },
    runStats: initialRunStats,
    achievements,
    settings: defaultSettings,
    selectedClass,
    gameMode: mode,
    accountLevel
  };
};

export const isGameOver = (grid: Tile[], size: number): boolean => {
  if (grid.length < size * size) return false;
  for (let i = 0; i < grid.length; i++) {
    const t1 = grid[i];
    const neighbors = grid.filter(t => 
      (Math.abs(t.x - t1.x) === 1 && t.y === t1.y) || 
      (Math.abs(t.y - t1.y) === 1 && t.x === t1.x)
    );
    for (const n of neighbors) {
      if (t1.type !== TileType.BOSS && n.type !== TileType.BOSS && t1.value === n.value) return false;
    }
  }
  return true;
};

export const saveHighscore = (state: GameState) => {
    const scores = getHighscores();
    scores.push({
        date: Date.now(),
        score: state.score,
        level: state.level,
        gold: state.gold
    });
    scores.sort((a, b) => b.score - a.score);
    const top10 = scores.slice(0, 10);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(top10));
};

export const getHighscores = (): LeaderboardEntry[] => {
    try {
        const data = localStorage.getItem(LEADERBOARD_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

export const checkAchievements = (state: GameState): Achievement[] => {
    // Achievements disabled in Classic? Maybe keep them for score hunting.
    // Keeping enabled.
    const unlocked: Achievement[] = [];
    ACHIEVEMENTS.forEach(ach => {
        if (!state.achievements.includes(ach.id)) {
            if (ach.condition(state.stats, state)) {
                unlocked.push(ach);
            }
        }
    });
    return unlocked;
};

export const savePersistentAchievements = (ids: string[]) => {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(ids));
};

export const clearSaveData = () => {
    localStorage.removeItem('2048_rpg_state_v3');
    localStorage.removeItem('2048_rpg_highscore');
    localStorage.removeItem(LEADERBOARD_KEY);
    localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
    localStorage.removeItem(PROFILE_STORAGE_KEY);
};
