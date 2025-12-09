
import { Direction, GameState, Tile, TileType, MoveResult, LootResult, ItemType, InventoryItem, Stage, LeaderboardEntry, GameStats, Achievement, InputSettings, RunStats, HeroClass, GameMode, PlayerProfile } from '../types';
import { GRID_SIZE_INITIAL, SHOP_ITEMS, getXpThreshold, getStage, getStageBackground, ACHIEVEMENTS, TILE_STYLES, FALLBACK_STYLE, getItemDefinition } from '../constants';
import { v4 as uuidv4 } from 'uuid';

const createId = () => uuidv4();
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
  powerUpChanceBonus?: number; // Added for Lucky Dice
}

export const spawnTile = (grid: Tile[], size: number, level: number, options?: SpawnOptions | number): Tile[] => {
  const emptyCells = getEmptyCells(grid, size);
  if (emptyCells.length === 0) return grid;

  const { x, y } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  
  let value = Math.random() < 0.9 ? 2 : 4;
  let type = TileType.NORMAL;
  let health = undefined;
  let maxHealth = undefined;

  // Options handling
  let opts: SpawnOptions = {};
  if (typeof options === 'number') {
      opts = { forcedValue: options };
  } else if (options) {
      opts = options;
  }

  if (opts.forcedValue) value = opts.forcedValue;
  if (opts.type) type = opts.type;

  // Rune Spawning Logic
  // Base chance 1%, + bonus from Lucky Dice
  const runeChance = 0.01 + (opts.powerUpChanceBonus || 0);
  if (!opts.forcedValue && !opts.type && !opts.isClassic && Math.random() < runeChance) {
      const roll = Math.random();
      if (roll < 0.4) type = TileType.RUNE_MIDAS;
      else if (roll < 0.7) type = TileType.RUNE_CHRONOS;
      else type = TileType.RUNE_VOID;
      value = 0; // Runes have no numeric value
  }

  // Boss Logic
  if (type === TileType.BOSS) {
      value = 0; 
      const bossScale = opts.bossLevel || 1;
      maxHealth = 20 * Math.pow(1.5, bossScale); 
      health = maxHealth;
  }

  const newTile: Tile = {
    id: createId(),
    x,
    y,
    value,
    type,
    isNew: true,
    health,
    maxHealth
  };

  return [...grid, newTile];
};

export const initializeGame = (restart = false, heroClass: HeroClass = HeroClass.ADVENTURER, mode: GameMode = 'RPG'): GameState => {
  if (!restart) {
    const saved = localStorage.getItem('2048_rpg_state_v3');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Migration for older saves if needed
            if (!parsed.effectCounters) parsed.effectCounters = {};
            if (!parsed.gameMode) parsed.gameMode = 'RPG';
            return parsed;
        } catch (e) { console.error("Save corrupted", e); }
    }
  }

  const stage = getStage(1);
  const initialStage: Stage = {
      name: stage.name,
      minLevel: stage.minLevel,
      backgroundUrl: getStageBackground(stage.name),
      colorTheme: stage.colorTheme,
      barColor: stage.barColor
  };

  // Class Starting Bonuses
  const inventory: InventoryItem[] = [];
  if (heroClass === HeroClass.WARRIOR) {
      const def = getItemDefinition(ItemType.BOMB_SCROLL);
      inventory.push({ id: createId(), type: ItemType.BOMB_SCROLL, name: def.name, description: def.desc, icon: def.icon });
  } else if (heroClass === HeroClass.ROGUE) {
      const def = getItemDefinition(ItemType.REROLL_TOKEN);
      inventory.push({ id: createId(), type: ItemType.REROLL_TOKEN, name: def.name, description: def.desc, icon: def.icon });
  } else if (heroClass === HeroClass.MAGE) {
      const def = getItemDefinition(ItemType.XP_POTION);
      inventory.push({ id: createId(), type: ItemType.XP_POTION, name: def.name, description: def.desc, icon: def.icon });
  } else if (heroClass === HeroClass.PALADIN) {
      const def = getItemDefinition(ItemType.GOLDEN_RUNE);
      inventory.push({ id: createId(), type: ItemType.GOLDEN_RUNE, name: def.name, description: def.desc, icon: def.icon });
  }

  const stats: GameStats = {
      totalMerges: 0, highestCombo: 0, slimesMerged: 0, bossesDefeated: 0, goldCollected: 0, highestTile: 0, totalMoves: 0
  };

  const runStats: RunStats = {
      highestTile: 0, highestMonster: 'Slime', stageReached: stage.name, turnCount: 0, powerUpsUsed: 0, goldEarned: 0, cascadesTriggered: 0, startTime: Date.now(), bossesDefeated: 0, mergesCount: 0, itemsCrafted: 0
  };

  const storedAchievements = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
  const achievements = storedAchievements ? JSON.parse(storedAchievements) : [];

  // Get account level for cascades
  const profileStr = localStorage.getItem(PROFILE_STORAGE_KEY);
  const profile = profileStr ? JSON.parse(profileStr) : { accountLevel: 1 };

  let initialGrid = spawnTile([], GRID_SIZE_INITIAL, 1, { isClassic: mode === 'CLASSIC' });
  initialGrid = spawnTile(initialGrid, GRID_SIZE_INITIAL, 1, { isClassic: mode === 'CLASSIC' });

  return {
    grid: initialGrid,
    score: 0,
    bestScore: 0,
    xp: 0,
    level: 1,
    gold: mode === 'CLASSIC' ? 0 : 0, // Start with 0 gold usually
    inventory,
    gridSize: GRID_SIZE_INITIAL,
    gameOver: false,
    victory: false,
    gameWon: false,
    combo: 0,
    logs: ['Welcome, hero.', mode === 'CLASSIC' ? 'Classic Mode Active.' : `Class: ${heroClass}`],
    activeEffects: [],
    effectCounters: {},
    currentStage: initialStage,
    rerolls: 0,
    stats,
    runStats,
    achievements,
    settings: { enableKeyboard: true, enableSwipe: true, enableScroll: true, invertSwipe: false, invertScroll: false, sensitivity: 5, enableTooltips: true },
    selectedClass: heroClass,
    gameMode: mode,
    accountLevel: profile.accountLevel
  };
};

// --- CORE GAMEPLAY LOGIC ---

export const moveGrid = (
    grid: Tile[], 
    direction: Direction, 
    size: number, 
    mode: GameMode, 
    effectCounters: Record<string, number>
): MoveResult => {
  // Optimization: Shallow copy grid elements instead of deep JSON clone
  let newGrid = grid.map(t => ({...t}));
  let score = 0;
  let xpGained = 0;
  let goldGained = 0;
  let itemsFound: InventoryItem[] = [];
  let moved = false;
  let mergedIds: string[] = [];
  let powerUpTriggered: TileType | undefined;
  let bossDefeated = false;
  const logs: string[] = [];

  // Remove "new" and "cascade" flags
  newGrid.forEach(t => { delete t.isNew; delete t.isCascade; delete t.mergedFrom; });

  const vector = {
    [Direction.UP]: { x: 0, y: -1 },
    [Direction.DOWN]: { x: 0, y: 1 },
    [Direction.LEFT]: { x: -1, y: 0 },
    [Direction.RIGHT]: { x: 1, y: 0 },
  }[direction];

  const traversalX = Array.from({ length: size }, (_, i) => i);
  const traversalY = Array.from({ length: size }, (_, i) => i);

  if (vector.x === 1) traversalX.reverse();
  if (vector.y === 1) traversalY.reverse();

  let combo = 0;

  traversalX.forEach(x => {
    traversalY.forEach(y => {
      const tile = newGrid.find(t => t.x === x && t.y === y);
      if (!tile) return;

      const cell = { x: tile.x, y: tile.y };
      let next = { x: cell.x + vector.x, y: cell.y + vector.y };
      
      // Boss Anchor Logic: Bosses don't move
      if (tile.type === TileType.BOSS) return;

      while (next.x >= 0 && next.x < size && next.y >= 0 && next.y < size) {
        const nextTile = newGrid.find(t => t.x === next.x && t.y === next.y);
        
        if (!nextTile) {
          // Move to empty cell
          cell.x = next.x;
          cell.y = next.y;
          next = { x: cell.x + vector.x, y: cell.y + vector.y };
          moved = true;
          continue;
        } 
        
        // INTERACTION LOGIC
        
        // 1. Boss Collision (Damage)
        if (nextTile.type === TileType.BOSS) {
            // Hit the boss!
            const baseDmg = 1;
            const siegeMultiplier = (effectCounters['SIEGE_BREAKER'] || 0) > 0 ? 3 : 1;
            const damage = baseDmg * siegeMultiplier;
            
            nextTile.health = Math.max(0, (nextTile.health || 0) - damage);
            nextTile.mergedFrom = ['damage']; // Visual shake

            // Boss defeated?
            if (nextTile.health <= 0) {
                // Boss dies
                newGrid = newGrid.filter(t => t.id !== nextTile.id);
                score += 500;
                xpGained += 2000;
                goldGained += 100;
                bossDefeated = true;
            }
            
            // The projectile tile is destroyed on impact
            newGrid = newGrid.filter(t => t.id !== tile.id);
            moved = true;
            return; // Done with this tile
        }

        // 2. Rune Collision (Activation)
        const isTileRune = tile.type.startsWith('RUNE_');
        const isNextRune = nextTile.type.startsWith('RUNE_');

        if (isTileRune || isNextRune) {
            const runeType = isTileRune ? tile.type : nextTile.type;
            powerUpTriggered = runeType;
            
            if (isTileRune) {
                newGrid = newGrid.filter(t => t.id !== tile.id);
                moved = true;
            } else {
                newGrid = newGrid.filter(t => t.id !== nextTile.id);
                tile.x = next.x;
                tile.y = next.y;
                moved = true;
            }
            return;
        }

        // 3. Standard Merge
        if (nextTile.value === tile.value && !nextTile.mergedFrom) {
          const mergedValue = tile.value * 2;
          const mergedTile: Tile = {
            id: createId(),
            x: next.x,
            y: next.y,
            value: mergedValue,
            type: TileType.NORMAL,
            mergedFrom: [tile.id, nextTile.id],
            health: undefined, maxHealth: undefined
          };

          if (tile.type === TileType.GOLDEN || nextTile.type === TileType.GOLDEN) {
              mergedTile.type = TileType.GOLDEN;
              goldGained += mergedValue; 
          }

          newGrid = newGrid.filter(t => t.id !== tile.id && t.id !== nextTile.id);
          newGrid.push(mergedTile);

          // Scoring
          score += mergedValue;
          xpGained += mergedValue;
          
          // Midas Potion Effect
          const goldMult = (effectCounters['MIDAS_POTION'] || 0) > 0 ? 2 : 1;
          goldGained += Math.floor((mergedValue / 10) * goldMult);

          // === LOOT LOGIC ===
          if (mode === 'RPG') {
              // Modifiers
              const luckBuff = (effectCounters['LUCKY_LOOT'] || 0) > 0 ? 0.05 : 0;
              const diceBuff = (effectCounters['LUCKY_DICE'] || 0) > 0 ? 0.05 : 0;
              
              // Base Chance scales with Tile Value (Higher value = higher loot chance)
              // 4 -> ~1%
              // 32 -> ~2%
              // 512 -> ~10%
              const baseChance = Math.min(0.1, (Math.log2(mergedValue) * 0.005) + 0.005);
              const totalChance = baseChance + luckBuff + diceBuff;

              if (Math.random() < totalChance) {
                  const roll = Math.random();
                  
                  // 80% chance for Gold Pouch (if loot triggers)
                  if (roll < 0.8) {
                      const goldAmount = Math.floor(mergedValue * 0.5) + 10;
                      goldGained += goldAmount;
                      logs.push(`Found Pouch: ${goldAmount} G`);
                  } 
                  // 20% chance for Item
                  else {
                      const availableItems = SHOP_ITEMS.filter(i => i.category !== 'BATTLE'); // Don't drop heavy battle items randomly
                      const itemDef = availableItems[Math.floor(Math.random() * availableItems.length)];
                      
                      const item: InventoryItem = {
                          id: createId(),
                          type: itemDef.id,
                          name: itemDef.name,
                          description: itemDef.desc,
                          icon: itemDef.icon
                      };
                      itemsFound.push(item);
                  }
              }
          }
          // ==================

          mergedIds.push(mergedTile.id);
          combo++;
          moved = true;
        } else {
          // Blocked
          cell.x = next.x - vector.x;
          cell.y = next.y - vector.y;
        }
        break; // Stop checking directions
      }
      
      // Update position if moved without merge
      if (!newGrid.find(t => t.id === tile.id)) return; // Tile removed
      tile.x = cell.x;
      tile.y = cell.y;
    });
  });

  if (bossDefeated) logs.push("BOSS DEFEATED! +500 Score");
  if (combo > 1) logs.push(`Combo x${combo}!`);

  // Radiant Aura Effect (+50% XP)
  if ((effectCounters['RADIANT_AURA'] || 0) > 0) {
      xpGained = Math.floor(xpGained * 1.5);
  }

  // Calculate Combo Multiplier for XP
  const comboMultiplier = 1 + (combo * 0.1);
  xpGained = Math.floor(xpGained * comboMultiplier);

  // Void Stone Logic: Consume 1 weak tile at end of turn (Active Effect)
  if ((effectCounters['VOID_STONE'] || 0) > 0 && moved) {
     const lowTiles = newGrid.filter(t => t.value <= 4 && t.type !== TileType.BOSS);
     if (lowTiles.length > 0) {
         const target = lowTiles[Math.floor(Math.random() * lowTiles.length)];
         newGrid = newGrid.filter(t => t.id !== target.id);
         // Silent effect, no log to avoid spam
     }
  }

  return { grid: newGrid, score, xpGained, goldGained, itemsFound, moved, mergedIds, combo, comboMultiplier, logs, powerUpTriggered, bossDefeated };
};

export const isGameOver = (grid: Tile[], size: number) => {
  if (getEmptyCells(grid, size).length > 0) return false;

  // Check possible merges
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const tile = grid.find(t => t.x === x && t.y === y);
      if (!tile) continue;
      
      // Check neighbors
      const neighbors = [
        { x: x + 1, y }, { x: x - 1, y },
        { x, y: y + 1 }, { x, y: y - 1 }
      ];

      for (const n of neighbors) {
        if (n.x >= 0 && n.x < size && n.y >= 0 && n.y < size) {
          const neighbor = grid.find(t => t.x === n.x && t.y === n.y);
          if (neighbor && neighbor.value === tile.value && neighbor.type !== TileType.BOSS && tile.type !== TileType.BOSS) {
            return false;
          }
          // Runes are essentially mergeable with anything in our logic, so if there's a rune, not game over
          if (tile.type.startsWith('RUNE_') || (neighbor && neighbor.type.startsWith('RUNE_'))) {
              return false;
          }
        }
      }
    }
  }
  return true;
};

// --- LOOT SYSTEM (Legacy/Fallback) ---
export const checkLoot = (level: number, mergedIds: string[], hasLuckyCharm: boolean, isClassic: boolean): LootResult | null => {
    if (isClassic || mergedIds.length === 0) return null;
    
    // Base Chance: 1% per move independent of specific tile values (fallback event)
    const chance = 0.01 + (hasLuckyCharm ? 0.05 : 0);
    
    if (Math.random() < chance) {
        const roll = Math.random();
        
        // Gold Drop
        if (roll < 0.6) {
            const amount = Math.floor(Math.random() * 50) + 10 * level;
            return { message: `Found Pouch: ${amount} Gold`, gold: amount };
        } 
        
        // Item Drop
        const items = Object.values(ItemType).filter(t => !t.startsWith('CRAFT')); // Exclude craft only items if we had them
        const itemType = items[Math.floor(Math.random() * items.length)];
        const def = getItemDefinition(itemType);
        
        const item: InventoryItem = {
            id: createId(),
            type: itemType,
            name: def.name,
            description: def.desc,
            icon: def.icon
        };
        return { message: `Looted ${item.name}!`, item };
    }
    return null;
};

// --- POWER UP EFFECTS ---

export const applyMidasTouch = (grid: Tile[]) => {
    // Convert 20% of non-boss tiles to Gold Score immediately
    const validTiles = grid.filter(t => t.type !== TileType.BOSS && t.value < 2048);
    const count = Math.max(3, Math.floor(validTiles.length * 0.2));
    
    // Shuffle
    const targets = validTiles.sort(() => 0.5 - Math.random()).slice(0, count);
    
    let bonusScore = 0;
    const newGrid = grid.filter(t => {
        if (targets.includes(t)) {
            bonusScore += t.value * 5; // Midas gives 5x value as score
            return false;
        }
        return true;
    });
    
    return { grid: newGrid, score: bonusScore };
};

export const applyChronosShift = (grid: Tile[], size: number) => {
    // Sort grid: Highest values to top-left
    const sortedTiles = [...grid].filter(t => t.type !== TileType.BOSS).sort((a, b) => b.value - a.value);
    const bosses = grid.filter(t => t.type === TileType.BOSS);
    
    const newGrid: Tile[] = [...bosses]; // Keep bosses where they are? 
    // Actually, bosses complicate sorting. Let's re-place sorted tiles in empty spots around bosses.
    
    const cells = [];
    for(let y=0; y<size; y++) {
        for(let x=0; x<size; x++) {
            if (!bosses.find(b => b.x === x && b.y === y)) {
                cells.push({x, y});
            }
        }
    }
    
    sortedTiles.forEach((t, i) => {
        if (cells[i]) {
            t.x = cells[i].x;
            t.y = cells[i].y;
            newGrid.push(t);
        }
    });
    
    return newGrid;
};

export const applyVoidSingularity = (grid: Tile[], size: number) => {
    // Remove 50% of lowest value tiles
    const nonBoss = grid.filter(t => t.type !== TileType.BOSS).sort((a, b) => a.value - b.value);
    const toRemoveCount = Math.floor(nonBoss.length * 0.5);
    const toRemove = nonBoss.slice(0, toRemoveCount).map(t => t.id);
    
    let freedScore = 0;
    const newGrid = grid.filter(t => {
        if (toRemove.includes(t.id)) {
            freedScore += t.value;
            return false;
        }
        return true;
    });
    
    return { grid: newGrid, score: freedScore };
};

// --- ITEM USAGE ---

export const useInventoryItem = (state: GameState, item: InventoryItem): Partial<GameState> | null => {
    let newGrid = [...state.grid];
    let newGold = state.gold;
    let newXp = state.xp;
    let newEffectCounters = { ...state.effectCounters };
    let activeEffects = [...state.activeEffects];
    let logs = [...state.logs];

    switch (item.type) {
        case ItemType.XP_POTION:
            newXp += 1000;
            logs.push("XP Potion: +1000 XP");
            break;
            
        case ItemType.GREATER_XP_POTION:
            newXp += 2500;
            logs.push("Greater Potion: +2500 XP");
            break;

        case ItemType.BOMB_SCROLL:
            // Remove 3 lowest tiles
            const lowest = [...newGrid].filter(t => t.type !== TileType.BOSS).sort((a,b) => a.value - b.value).slice(0, 3);
            newGrid = newGrid.filter(t => !lowest.includes(t));
            logs.push("Bomb Scroll: Cleared 3 tiles");
            break;
            
        case ItemType.CATACLYSM_SCROLL:
            // Remove 50% tiles
            const res = applyVoidSingularity(newGrid, state.gridSize);
            newGrid = res.grid;
            logs.push("Cataclysm: Board purged.");
            break;

        case ItemType.REROLL_TOKEN:
            return { rerolls: state.rerolls + 1, logs: [...logs, "+1 Free Reroll"] };

        case ItemType.GOLDEN_RUNE:
            activeEffects.push('GOLDEN_SPAWN');
            logs.push("Golden Rune active.");
            break;
            
        case ItemType.ASCENDANT_RUNE:
            newEffectCounters['ASCENDANT_SPAWN'] = 5;
            logs.push("Ascendant Rune: Next 5 spawns high tier.");
            break;

        case ItemType.LUCKY_CHARM:
            newEffectCounters['LUCKY_LOOT'] = (newEffectCounters['LUCKY_LOOT'] || 0) + 3;
            logs.push("Lucky Charm: Loot chance up!");
            break;
            
        // NEW ITEMS
        case ItemType.LUCKY_DICE:
            newEffectCounters['LUCKY_DICE'] = (newEffectCounters['LUCKY_DICE'] || 0) + 20;
            logs.push("Lucky Dice: Runes spawn more often!");
            break;
            
        case ItemType.CHAIN_CATALYST:
            newEffectCounters['CHAIN_CATALYST'] = (newEffectCounters['CHAIN_CATALYST'] || 0) + 10;
            logs.push("Catalyst: Cascades active (10 turns).");
            break;
            
        case ItemType.MIDAS_POTION:
            newEffectCounters['MIDAS_POTION'] = (newEffectCounters['MIDAS_POTION'] || 0) + 50;
            logs.push("Midas Brew: 2x Gold (50 turns).");
            break;
            
        case ItemType.SIEGE_BREAKER:
            newEffectCounters['SIEGE_BREAKER'] = (newEffectCounters['SIEGE_BREAKER'] || 0) + 1;
            logs.push("Siege Breaker: Next boss hit 3x DMG.");
            break;

        case ItemType.VOID_STONE:
            newEffectCounters['VOID_STONE'] = (newEffectCounters['VOID_STONE'] || 0) + 10;
            logs.push("Void Stone activated (10 turns).");
            break;

        case ItemType.RADIANT_AURA:
            newEffectCounters['RADIANT_AURA'] = (newEffectCounters['RADIANT_AURA'] || 0) + 20;
            logs.push("Radiant Aura: +50% XP (20 turns).");
            break;

        default:
            return null;
    }

    // Remove used item
    const invIndex = state.inventory.findIndex(i => i.id === item.id);
    const newInventory = [...state.inventory];
    if (invIndex > -1) newInventory.splice(invIndex, 1);

    return {
        grid: newGrid,
        gold: newGold,
        xp: newXp,
        effectCounters: newEffectCounters,
        activeEffects,
        logs,
        inventory: newInventory
    };
};

// --- PERKS & AUTOMATION ---

export const tryAutoMerge = (grid: Tile[]) => {
    // Find one mergeable pair and merge it automatically
    // This is a "Perk" effect
    if (Math.random() > 0.15) return { success: false, grid, value: 0 }; // 15% chance only

    // Simple horizontal scan
    for(let i=0; i<grid.length; i++) {
        const t1 = grid[i];
        const t2 = grid.find(t => t.x === t1.x + 1 && t.y === t1.y && t.value === t1.value && t.type !== TileType.BOSS);
        if (t2) {
             const newVal = t1.value * 2;
             const mergedTile: Tile = { ...t2, id: createId(), value: newVal, mergedFrom: [t1.id, t2.id] };
             const newGrid = grid.filter(t => t.id !== t1.id && t.id !== t2.id);
             newGrid.push(mergedTile);
             return { success: true, grid: newGrid, value: newVal };
        }
    }
    return { success: false, grid, value: 0 };
};

export const executeAutoCascade = (grid: Tile[], size: number, cascadeStep: number) => {
    // Simulate gravity/falling if we want, OR just trigger merges that exist but weren't moved
    // In 2048, tiles don't "fall". Cascade here implies: "After move, if new merges are possible without moving, do them."
    // OR: Random matches pop? 
    // Let's implement "Chain Reaction": Adjacent matching tiles automatically merge if they exist.
    
    let newGrid = grid.map(t => ({...t}));
    let xp = 0;
    let gold = 0;
    let occurred = false;
    
    // We scan for stationary merges (neighbours with same value)
    // To prevent infinite loops or total board clear in one tick, we limit to one pass per "Step"
    const idsProcessed = new Set<string>();

    for(let i=0; i<newGrid.length; i++) {
        const t1 = newGrid[i];
        if (idsProcessed.has(t1.id) || t1.type === TileType.BOSS) continue;
        
        // Check Right
        const t2 = newGrid.find(t => t.x === t1.x + 1 && t.y === t1.y && t.value === t1.value && !idsProcessed.has(t.id) && t.type !== TileType.BOSS);
        // Check Down
        const t3 = newGrid.find(t => t.x === t1.x && t.y === t1.y + 1 && t.value === t1.value && !idsProcessed.has(t.id) && t.type !== TileType.BOSS);
        
        const target = t2 || t3;
        
        if (target) {
            occurred = true;
            const newVal = t1.value * 2;
            // Reward Multiplier based on step
            const mult = 1 + (cascadeStep * 0.2);
            
            xp += Math.floor(newVal * mult);
            gold += Math.floor((newVal / 5) * mult);
            
            const mergedTile: Tile = {
                ...target,
                id: createId(),
                value: newVal,
                mergedFrom: [t1.id, target.id],
                isCascade: true // Visual flag
            };
            
            idsProcessed.add(t1.id);
            idsProcessed.add(target.id);
            idsProcessed.add(mergedTile.id); // Don't merge this new one again this frame
            
            newGrid = newGrid.filter(t => t.id !== t1.id && t.id !== target.id);
            newGrid.push(mergedTile);
        }
    }
    
    return { occurred, grid: newGrid, rewards: { xp, gold } };
};

// --- ACHIEVEMENTS ---
export const checkAchievements = (state: GameState): Achievement[] => {
    return ACHIEVEMENTS.filter(ach => {
        if (state.achievements.includes(ach.id)) return false;
        return ach.condition(state.stats, state);
    });
};

export const savePersistentAchievements = (ids: string[]) => {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(ids));
};

// --- DATA MGMT ---
export const getHighscores = (): LeaderboardEntry[] => {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    return data ? JSON.parse(data) : [];
};

export const saveHighscore = (entry: LeaderboardEntry) => {
    const scores = getHighscores();
    scores.push(entry);
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(scores.slice(0, 50)));
};

export const clearSaveData = () => {
    localStorage.removeItem('2048_rpg_state_v3');
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
    localStorage.removeItem(LEADERBOARD_KEY);
    window.location.reload();
};
