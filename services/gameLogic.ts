
import { Direction, GameState, Tile, TileType, MoveResult, LootResult, ItemType, InventoryItem, Stage, LeaderboardEntry, GameStats, Achievement, HeroClass, CraftingRecipe, DailyModifier, StoryEntry, PlayerProfile, Medal, AbilityType, AbilityState, Difficulty, LootEvent, ShopState, GameMode, RunStats } from '../types';
import { GRID_SIZE_INITIAL, SHOP_ITEMS, getXpThreshold, getStage, getStageBackground, ACHIEVEMENTS, TILE_STYLES, FALLBACK_STYLE, getItemDefinition, BOSS_DEFINITIONS, SHOP_CONFIG, DAILY_MODIFIERS, STORY_ENTRIES, MEDALS } from '../constants';
import { RNG, rng, generateId } from '../utils/rng';
import { audioService } from './audioService'; // Needed for type checking if needed, but not used directly here as audio is triggered in App or via events

// ... existing code ...

export const createId = () => generateId();
const LEADERBOARD_KEY = 'dragon_hoard_leaderboard';
const ACHIEVEMENTS_STORAGE_KEY = 'dragon_hoard_unlocked_achievements';
const PROFILE_STORAGE_KEY = 'dragons_hoard_profile';

// ... existing helper functions (getEmptyCells, spawnTile, etc.) ...

export const getEmptyCells = (grid: Tile[], size: number) => {
  const cells: { x: number; y: number }[] = [];
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      if (!grid.find((tile) => tile.x === x && tile.y === y && !tile.isDying)) {
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
  powerUpChanceBonus?: number;
  modifiers?: DailyModifier[];
  difficulty?: Difficulty;
}

const hasMod = (mods: DailyModifier[] | undefined, id: string) => mods ? mods.some(m => m.id === id) : false;

export const spawnTile = (grid: Tile[], size: number, level: number, options?: SpawnOptions | number): Tile[] => {
  const emptyCells = getEmptyCells(grid, size);
  if (emptyCells.length === 0) return grid;

  const { x, y } = emptyCells[Math.floor(rng.next() * emptyCells.length)];
  
  let value = rng.next() < 0.9 ? 2 : 4;
  let type = TileType.NORMAL;
  let health = undefined;
  let maxHealth = undefined;
  let bossThemeId = undefined;

  let opts: SpawnOptions = {};
  if (typeof options === 'number') {
      opts = { forcedValue: options };
  } else if (options) {
      opts = options;
  }

  if (opts.forcedValue) value = opts.forcedValue;
  if (opts.type) type = opts.type;

  if (!opts.forcedValue && !opts.type && !opts.isClassic) {
      const isBossRush = hasMod(opts.modifiers, 'BOSS_RUSH');
      if (isBossRush || level >= 4) {
          const bossChance = isBossRush ? 0.05 : 0.002; 
          if (rng.next() < bossChance) {
              type = TileType.BOSS;
          }
      }
  }

  let runeChance = 0.01 + (opts.powerUpChanceBonus || 0);
  if (hasMod(opts.modifiers, 'CHAOS_THEORY')) {
      runeChance *= 3;
  }

  if (type === TileType.NORMAL && !opts.forcedValue && !opts.type && !opts.isClassic && rng.next() < runeChance) {
      const roll = rng.next();
      if (roll < 0.4) type = TileType.RUNE_MIDAS;
      else if (roll < 0.7) type = TileType.RUNE_CHRONOS;
      else type = TileType.RUNE_VOID;
      value = 0;
  }

  if (type === TileType.BOSS) {
      if (grid.some(t => t.type === TileType.BOSS && !t.isDying)) {
          type = TileType.NORMAL;
          value = 2;
      } else {
          value = 0; 
          const stage = getStage(level);
          const bossDef = BOSS_DEFINITIONS[stage.themeId] || BOSS_DEFINITIONS['DEFAULT'];
          const bossScale = opts.bossLevel || 1;
          
          let hpMult = 1.0;
          if (hasMod(opts.modifiers, 'GOLD_RUSH')) hpMult = 1.5;
          if (opts.difficulty === 'HARD') hpMult *= 1.5;

          maxHealth = Math.floor(bossDef.baseHealth * Math.pow(1.55, bossScale) * hpMult); 
          health = maxHealth;
          bossThemeId = stage.themeId;
      }
  }

  const newTile: Tile = {
    id: createId(),
    x,
    y,
    value,
    type,
    isNew: true,
    health,
    maxHealth,
    bossThemeId
  };

  return [...grid, newTile];
};

const getInitialShopState = (modifiers?: DailyModifier[]): ShopState => {
    const items: Record<string, { stock: number; priceMultiplier: number }> = {};
    SHOP_ITEMS.forEach(item => {
        const cat = item.category as keyof typeof SHOP_CONFIG.STOCK_LIMITS;
        const limit = SHOP_CONFIG.STOCK_LIMITS[cat] || 3;
        
        let priceMult = 1.0;
        if (hasMod(modifiers, 'MANA_DROUGHT')) priceMult += 0.5;
        if (hasMod(modifiers, 'VOLATILE_ALCHEMY') && item.category === 'CONSUMABLE') priceMult -= 0.5;

        items[item.id] = { stock: limit, priceMultiplier: priceMult };
    });
    return {
        items,
        turnsUntilRestock: SHOP_CONFIG.RESTOCK_INTERVAL
    };
};

export const generateDailyModifiers = (seed: number): DailyModifier[] => {
    const dayRng = new RNG();
    dayRng.setSeed(seed);
    
    const shuffled = [...DAILY_MODIFIERS];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(dayRng.next() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled.slice(0, 2);
};

export const initializeGame = (restart = false, heroClass: HeroClass = HeroClass.ADVENTURER, mode: GameMode = 'RPG', seed?: number, difficulty: Difficulty = 'NORMAL', tilesetId: string = 'DEFAULT'): GameState => {
  
  if (mode === 'DAILY' && seed) {
      rng.setSeed(seed);
  } else {
      rng.disableSeeded();
  }

  const profileStr = localStorage.getItem(PROFILE_STORAGE_KEY);
  const profile: PlayerProfile = profileStr ? JSON.parse(profileStr) : { accountLevel: 1, unlockedPowerups: [], totalAccountXp: 0 };

  if (!restart && mode !== 'DAILY') {
    const saved = localStorage.getItem('2048_rpg_state_v3');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (!parsed.abilities) {
                parsed.abilities = {
                    'SCORCH': { id: 'SCORCH', isUnlocked: false, charges: 1, maxCharges: 1, cooldown: 30, currentCooldown: 30 },
                    'DRAGON_BREATH': { id: 'DRAGON_BREATH', isUnlocked: false, charges: 1, maxCharges: 1, cooldown: 60, currentCooldown: 60 },
                    'GOLDEN_EGG': { id: 'GOLDEN_EGG', isUnlocked: false, charges: 1, maxCharges: 1, cooldown: 50, currentCooldown: 50 }
                };
            }
            Object.keys(parsed.abilities).forEach(key => {
                if (profile.unlockedPowerups && profile.unlockedPowerups.includes(key as AbilityType)) {
                    parsed.abilities[key].isUnlocked = true;
                }
            });
            if (parsed.settings) {
                if (parsed.settings.enableScreenShake === undefined) parsed.settings.enableScreenShake = true;
                if (parsed.settings.enableParticles === undefined) parsed.settings.enableParticles = true;
                if (parsed.settings.reduceMotion === undefined) parsed.settings.reduceMotion = false;
                if (parsed.settings.orientation === undefined) parsed.settings.orientation = 'AUTO';
            }
            // Ensure baseline exists if recovering old save
            if (parsed.baselineAccountXp === undefined) {
                parsed.baselineAccountXp = profile.totalAccountXp;
            }
            parsed.grid = parsed.grid.filter((t: Tile) => !t.isDying);
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
      barColor: stage.barColor,
      themeId: stage.themeId
  };

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
  } else if (heroClass === HeroClass.DRAGON_SLAYER) {
      const def = getItemDefinition(ItemType.SIEGE_BREAKER);
      inventory.push({ id: createId(), type: ItemType.SIEGE_BREAKER, name: def.name, description: def.desc, icon: def.icon });
  }

  const stats: GameStats = {
      totalMerges: 0, highestCombo: 0, slimesMerged: 0, bossesDefeated: 0, goldCollected: 0, highestTile: 0, totalMoves: 0
  };

  const runStats: RunStats = {
      highestTile: 0, highestMonster: 'Slime', stageReached: stage.name, turnCount: 0, powerUpsUsed: 0, goldEarned: 0, cascadesTriggered: 0, startTime: Date.now(), bossesDefeated: 0, mergesCount: 0, itemsCrafted: 0, medalsEarned: []
  };

  let activeModifiers: DailyModifier[] = [];
  if (mode === 'DAILY' && seed) {
      activeModifiers = generateDailyModifiers(seed);
  }

  let startLevel = 1;
  let startGold = mode === 'CLASSIC' ? 0 : 0;
  if (mode === 'BOSS_RUSH') {
      startLevel = 5; 
      startGold = 500;
      const bossMod = DAILY_MODIFIERS.find(m => m.id === 'BOSS_RUSH');
      if (bossMod) activeModifiers.push(bossMod);
  }

  let initialGrid = spawnTile([], GRID_SIZE_INITIAL, startLevel, { isClassic: mode === 'CLASSIC', modifiers: activeModifiers, difficulty });
  initialGrid = spawnTile(initialGrid, GRID_SIZE_INITIAL, startLevel, { isClassic: mode === 'CLASSIC', modifiers: activeModifiers, difficulty });

  const abilities: Record<AbilityType, AbilityState> = {
      'SCORCH': { id: 'SCORCH', isUnlocked: profile.unlockedPowerups?.includes('SCORCH'), charges: 1, maxCharges: 1, cooldown: 30, currentCooldown: 30 },
      'DRAGON_BREATH': { id: 'DRAGON_BREATH', isUnlocked: profile.unlockedPowerups?.includes('DRAGON_BREATH'), charges: 1, maxCharges: 1, cooldown: 60, currentCooldown: 60 },
      'GOLDEN_EGG': { id: 'GOLDEN_EGG', isUnlocked: profile.unlockedPowerups?.includes('GOLDEN_EGG'), charges: 1, maxCharges: 1, cooldown: 50, currentCooldown: 50 }
  };

  return {
    grid: initialGrid,
    score: 0,
    bestScore: 0,
    xp: 0,
    level: startLevel,
    gold: startGold,
    inventory,
    gridSize: GRID_SIZE_INITIAL,
    gameOver: false,
    victory: false,
    gameWon: false,
    combo: 0,
    logs: ['Welcome, hero.'],
    activeEffects: [],
    effectCounters: {},
    currentStage: initialStage,
    rerolls: 0,
    stats,
    runStats,
    achievements: [],
    settings: { 
        enableKeyboard: true, 
        enableSwipe: true, 
        enableScroll: true,
        enableHaptics: true,
        invertSwipe: false, 
        invertScroll: false, 
        sensitivity: 5, 
        enableTooltips: true, 
        slideSpeed: 150,
        graphicsQuality: 'HIGH',
        enableScreenShake: true,
        enableParticles: true,
        reduceMotion: false,
        orientation: 'AUTO'
    },
    selectedClass: heroClass,
    gameMode: mode,
    difficulty,
    tilesetId,
    accountLevel: profile.accountLevel,
    baselineAccountXp: profile.totalAccountXp, // Track starting XP
    justLeveledUp: false,
    shop: getInitialShopState(activeModifiers),
    activeModifiers,
    lootEvents: [],
    lastTurnMedals: [],
    abilities,
    targetingMode: null
  };
};

export const moveGrid = (
    grid: Tile[], 
    direction: Direction, 
    size: number, 
    mode: GameMode, 
    effectCounters: Record<string, number>,
    modifiers?: DailyModifier[],
    difficulty: Difficulty = 'NORMAL',
    stats?: GameStats
): MoveResult => {
  // ROBUSTNESS: Ensure we don't start with any 'isDying' or malformed tiles
  let newGrid = grid.filter(t => !t.isDying && t.value !== undefined && t.x >= 0 && t.x < size && t.y >= 0 && t.y < size).map(t => ({...t}));
  let score = 0;
  let xpGained = 0;
  let goldGained = 0;
  let itemsFound: InventoryItem[] = [];
  let moved = false;
  let mergedIds: string[] = [];
  let powerUpTriggered: TileType | undefined;
  let bossDefeated = false;
  let lootEvents: LootEvent[] = [];
  const logs: string[] = [];
  const medalsEarned: Medal[] = [];
  const abilitiesTriggered: string[] = [];

  // Reset transient flags
  newGrid.forEach(t => { delete t.isNew; delete t.isCascade; delete t.mergedFrom; });

  const vector = {
    [Direction.UP]: { x: 0, y: -1 },
    [Direction.DOWN]: { x: 0, y: 1 },
    [Direction.LEFT]: { x: -1, y: 0 },
    [Direction.RIGHT]: { x: 1, y: 0 },
  }[direction];

  // ROBUSTNESS: Sort tiles based on traversal direction to avoid double-processing
  // If moving Right (x=1), process Right-most tiles first (Desc X)
  // If moving Left (x=-1), process Left-most tiles first (Asc X)
  // If moving Down (y=1), process Bottom-most tiles first (Desc Y)
  // If moving Up (y=-1), process Top-most tiles first (Asc Y)
  newGrid.sort((a, b) => {
      if (vector.x === 1) return b.x - a.x;
      if (vector.x === -1) return a.x - b.x;
      if (vector.y === 1) return b.y - a.y;
      if (vector.y === -1) return a.y - b.y;
      return 0;
  });

  // Track occupied positions during this move to handle collisions robustly
  // We cannot rely on 'newGrid.find' because we are mutating tile positions
  const occupancyMap = new Map<string, Tile>();
  newGrid.forEach(t => occupancyMap.set(`${t.x},${t.y}`, t));

  let combo = 0;
  let mergedCount = 0;

  // Iterate over sorted tiles
  for (const tile of newGrid) {
      if (tile.isDying) continue; // Skip if already merged/killed in this pass

      let cell = { x: tile.x, y: tile.y };
      let next = { x: cell.x + vector.x, y: cell.y + vector.y };
      
      // Remove self from map before moving
      occupancyMap.delete(`${tile.x},${tile.y}`);

      // Bosses don't move
      if (tile.type === TileType.BOSS) {
          occupancyMap.set(`${tile.x},${tile.y}`, tile);
          continue;
      }

      while (next.x >= 0 && next.x < size && next.y >= 0 && next.y < size) {
        const nextKey = `${next.x},${next.y}`;
        const nextTile = occupancyMap.get(nextKey);
        
        if (!nextTile) {
          // Can move into empty space
          cell = { ...next };
          next = { x: cell.x + vector.x, y: cell.y + vector.y };
          continue;
        } 
        
        // INTERACTION: Hit Boss
        if (nextTile.type === TileType.BOSS) {
            const projectileValue = tile.value;
            let siegeMultiplier = (effectCounters['SIEGE_BREAKER'] || 0) > 0 ? 3 : 1;
            if (hasMod(modifiers, 'GLASS_CANNON')) siegeMultiplier *= 2;

            const baseDmg = Math.max(1, Math.floor(projectileValue / 2));
            const damage = baseDmg * siegeMultiplier;
            
            nextTile.health = Math.max(0, (nextTile.health || 0) - damage);
            nextTile.mergedFrom = ['damage']; // Visual flash

            // Current tile dies on impact
            tile.x = next.x;
            tile.y = next.y;
            tile.isDying = true; 
            
            lootEvents.push({ id: createId(), x: next.x, y: next.y, type: 'XP', value: damage });

            if ((nextTile.health || 0) <= 0) {
                // Boss dies
                nextTile.isDying = true; 
                occupancyMap.delete(nextKey); // Remove boss from map so others can move there next turn (or same turn if logic allows, but usually blocking)
                
                score += 500;
                xpGained += 2000;
                goldGained += 100;
                bossDefeated = true;
                
                lootEvents.push({ id: createId(), x: next.x, y: next.y, type: 'GOLD', value: 100 });
                lootEvents.push({ id: createId(), x: next.x, y: next.y, type: 'XP', value: 2000 });

                if (mode === 'BOSS_RUSH') {
                    xpGained += 5000;
                    goldGained += 300;
                }
                medalsEarned.push(MEDALS.BOSS_KILL);
            } else {
                const dist = Math.abs(cell.x - nextTile.x) + Math.abs(cell.y - nextTile.y);
                if (dist >= 3) medalsEarned.push(MEDALS.SNIPER);
            }
            moved = true;
            // Tile is dead, don't add back to map
            break; 
        }

        // INTERACTION: Hit Rune
        if ((nextTile.type as any).startsWith('RUNE_')) {
             if (nextTile.type === TileType.RUNE_MIDAS) {
                 goldGained += 50;
                 lootEvents.push({ id: createId(), x: nextTile.x, y: nextTile.y, type: 'GOLD', value: 50 });
             } else if (nextTile.type === TileType.RUNE_CHRONOS) {
                 xpGained += 250;
                 lootEvents.push({ id: createId(), x: nextTile.x, y: nextTile.y, type: 'XP', value: 250 });
             } else if (nextTile.type === TileType.RUNE_VOID) {
                 score += 500;
                 lootEvents.push({ id: createId(), x: nextTile.x, y: nextTile.y, type: 'XP', value: 500, icon: '⚫' });
             }
             
             // Rune is consumed
             nextTile.isDying = true;
             occupancyMap.delete(nextKey);
             powerUpTriggered = nextTile.type;
             
             // Tile moves into rune's spot
             cell = { ...next };
             next = { x: cell.x + vector.x, y: cell.y + vector.y };
             moved = true;
             continue; // Continue moving past the rune
        }

        // INTERACTION: Merge
        if (nextTile.value === tile.value && !nextTile.mergedFrom) {
          const mergedValue = tile.value * 2;
          const mergedTile: Tile = {
            id: createId(),
            x: next.x,
            y: next.y,
            value: mergedValue,
            type: TileType.NORMAL,
            mergedFrom: [tile.id, nextTile.id],
            health: undefined, maxHealth: undefined,
            isNew: true
          };

          if (tile.type === TileType.GOLDEN || nextTile.type === TileType.GOLDEN) {
              mergedTile.type = TileType.GOLDEN;
              goldGained += mergedValue; 
              lootEvents.push({ id: createId(), x: next.x, y: next.y, type: 'GOLD', value: mergedValue });
          }

          // Mark old tiles as dying
          tile.x = next.x;
          tile.y = next.y;
          tile.isDying = true; 
          nextTile.isDying = true; 

          // Update grid array with new tile
          newGrid.push(mergedTile);
          
          // Update map: Replace nextTile with mergedTile
          occupancyMap.set(nextKey, mergedTile);

          score += mergedValue;
          xpGained += mergedValue;
          
          lootEvents.push({ id: createId(), x: next.x, y: next.y, type: 'XP', value: mergedValue });

          // Loot & Effects Logic
          if (mode !== 'CLASSIC' && rng.next() < 0.05) {
               goldGained += Math.floor(mergedValue / 5); 
          }

          const goldMult = (effectCounters['MIDAS_POTION'] || 0) > 0 ? 2 : 1;
          const basicGold = Math.floor((mergedValue / 10) * goldMult);
          if (basicGold > 0) {
              goldGained += basicGold;
          }

          if (mode === 'RPG' || mode === 'DAILY' || mode === 'BOSS_RUSH') {
              const luckBuff = (effectCounters['LUCKY_LOOT'] || 0) > 0 ? 0.05 : 0;
              const diceBuff = (effectCounters['LUCKY_DICE'] || 0) > 0 ? 0.05 : 0;
              let difficultyNerf = difficulty === 'HARD' ? 0.5 : 1.0;
              
              const baseChance = Math.min(0.1, (Math.log2(mergedValue) * 0.005) + 0.005);
              const totalChance = (baseChance + luckBuff + diceBuff) * difficultyNerf;

              if (rng.next() < totalChance) {
                  const roll = rng.next();
                  if (roll < 0.8) {
                      let goldAmount = Math.floor(mergedValue * 0.5) + 10;
                      if (hasMod(modifiers, 'GOLD_RUSH')) goldAmount *= 2;
                      goldGained += goldAmount;
                      logs.push(`Found Pouch: ${goldAmount} G`);
                      lootEvents.push({ id: createId(), x: next.x, y: next.y, type: 'GOLD', value: goldAmount });
                  } else {
                      const availableItems = SHOP_ITEMS.filter(i => i.category !== 'BATTLE');
                      const itemDef = availableItems[Math.floor(rng.next() * availableItems.length)];
                      
                      const item: InventoryItem = {
                          id: createId(),
                          type: itemDef.id as ItemType,
                          name: itemDef.name,
                          description: itemDef.desc,
                          icon: itemDef.icon
                      };
                      itemsFound.push(item);
                      lootEvents.push({ id: createId(), x: next.x, y: next.y, type: 'ITEM', icon: itemDef.icon, value: itemDef.name });
                  }
              }
          }

          if (mergedValue === 64) medalsEarned.push(MEDALS.TILE_64);
          else if (mergedValue === 256) medalsEarned.push(MEDALS.TILE_256);
          else if (mergedValue === 1024) medalsEarned.push(MEDALS.TILE_1024);
          else if (mergedValue === 2048) medalsEarned.push(MEDALS.TILE_2048);

          mergedIds.push(mergedTile.id);
          combo++;
          mergedCount++;
          moved = true;
          
          // Stop processing this tile
          break; 
        } 
        
        // Blocked by non-matching tile
        break;
      }
      
      // Final Position Assignment (if not dying)
      if (!tile.isDying) {
          if (tile.x !== cell.x || tile.y !== cell.y) {
              tile.x = cell.x;
              tile.y = cell.y;
              moved = true;
          }
          // Place back into map at new position
          occupancyMap.set(`${tile.x},${tile.y}`, tile);
      }
  }

  if (moved) {
      if (stats && stats.totalMerges === 0 && mergedCount > 0) medalsEarned.push(MEDALS.FIRST_MERGE);
      if (mergedCount === 2) medalsEarned.push(MEDALS.DOUBLE_MERGE);
      if (mergedCount === 3) medalsEarned.push(MEDALS.MULTI_MERGE);
      if (mergedCount >= 5) medalsEarned.push(MEDALS.MEGA_MERGE);
      
      if (combo === 3) medalsEarned.push(MEDALS.COMBO_3);
      if (combo === 5) medalsEarned.push(MEDALS.COMBO_5);
      if (combo === 10) medalsEarned.push(MEDALS.COMBO_10);
  }

  return {
      grid: newGrid,
      score,
      xpGained,
      goldGained,
      itemsFound,
      moved,
      mergedIds,
      combo,
      comboMultiplier: Math.min(4, 1 + (combo * 0.1)),
      logs,
      powerUpTriggered,
      bossDefeated,
      lootEvents,
      medalsEarned,
      abilitiesTriggered
  };
};

// ... remaining functions
export const isGameOver = (grid: Tile[], size: number): boolean => {
    if (grid.length < size * size) return false;

    const map: Record<string, Tile> = {};
    grid.forEach(t => { map[`${t.x},${t.y}`] = t; });

    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            const current = map[`${x},${y}`];
            if (!current) return false; 
            if (current.type === TileType.BOSS) continue;

            const right = map[`${x + 1},${y}`];
            if (right && right.value === current.value && right.type !== TileType.BOSS) return false;

            const down = map[`${x},${y + 1}`];
            if (down && down.value === current.value && down.type !== TileType.BOSS) return false;
        }
    }

    return true;
};

export const useInventoryItem = (state: GameState, item: InventoryItem): Partial<GameState> | null => {
    const { grid, score, xp, gold, inventory, gridSize, effectCounters } = state;
    const newInventory = inventory.filter(i => i.id !== item.id);
    const newEffectCounters = { ...effectCounters };
    let newGrid = [...grid];
    let newGold = gold;
    let newXp = xp;
    let logs = [...state.logs];

    switch (item.type) {
        case ItemType.XP_POTION:
            newXp += 1000;
            logs.push("Used XP Potion (+1000 XP)");
            break;
        case ItemType.GREATER_XP_POTION:
            newXp += 2500;
            logs.push("Used Greater XP Potion (+2500 XP)");
            break;
        case ItemType.GRANDMASTER_BREW:
            newXp += 5000;
            newEffectCounters['FLOW_STATE'] = (newEffectCounters['FLOW_STATE'] || 0) + 50;
            logs.push("Used Grandmaster Brew (+5000 XP, Flow State)");
            break;
        case ItemType.BOMB_SCROLL: {
            const targets = newGrid.filter(t => t.type === TileType.NORMAL && t.value > 0).sort((a, b) => a.value - b.value).slice(0, 3);
            if (targets.length === 0) return null; 
            newGrid = newGrid.filter(t => !targets.includes(t));
            logs.push(`Bomb Scroll destroyed ${targets.length} tiles.`);
            break;
        }
        case ItemType.CATACLYSM_SCROLL: {
             const targets = newGrid.filter(t => (t.type as any) !== TileType.BOSS);
             const count = Math.floor(targets.length / 2);
             for (let i = targets.length - 1; i > 0; i--) {
                 const j = Math.floor(Math.random() * (i + 1));
                 [targets[i], targets[j]] = [targets[j], targets[i]];
             }
             const toDestroy = targets.slice(0, count);
             newGrid = newGrid.filter(t => !toDestroy.includes(t));
             logs.push(`Cataclysm purged ${count} tiles.`);
             break;
        }
        case ItemType.THUNDER_SCROLL: {
            return {
                inventory: newInventory,
                isCascading: true,
                cascadeStep: 0,
                logs: [...logs, "Thunder Scroll triggered a cascade!"]
            };
        }
        case ItemType.GOLDEN_RUNE:
            newEffectCounters['GOLDEN_SPAWN'] = 1;
            logs.push("Golden Rune active (Next spawn is Gold)");
            break;
        case ItemType.ASCENDANT_RUNE:
            newEffectCounters['ASCENDANT_SPAWN'] = 5;
            logs.push("Ascendant Rune active (Next 5 spawns upgraded)");
            break;
        case ItemType.REROLL_TOKEN:
            newGrid = spawnTile(spawnTile([], gridSize, state.level), gridSize, state.level);
            logs.push("Board Rerolled.");
            break;
        case ItemType.LUCKY_CHARM:
            newEffectCounters['LUCKY_LOOT'] = (newEffectCounters['LUCKY_LOOT'] || 0) + 50; 
            logs.push("Lucky Charm active.");
            break;
        case ItemType.CHAIN_CATALYST:
            newEffectCounters['CHAIN_CATALYST'] = 10;
            logs.push("Chain Catalyst active.");
            break;
        case ItemType.LUCKY_DICE:
            newEffectCounters['LUCKY_DICE'] = (newEffectCounters['LUCKY_DICE'] || 0) + 20;
            logs.push("Lucky Dice active.");
            break;
        case ItemType.MIDAS_POTION:
            newEffectCounters['MIDAS_POTION'] = 50;
            logs.push("Midas Potion active.");
            break;
        case ItemType.SIEGE_BREAKER:
            newEffectCounters['SIEGE_BREAKER'] = 1; 
            logs.push("Siege Breaker ready.");
            break;
        case ItemType.VOID_STONE:
            newEffectCounters['VOID_STONE'] = 10;
            logs.push("Void Stone active.");
            break;
        case ItemType.RADIANT_AURA:
            newEffectCounters['RADIANT_AURA'] = 20;
            logs.push("Radiant Aura active.");
            break;
        case ItemType.FLOW_ELIXIR:
            newEffectCounters['FLOW_STATE'] = 20;
            logs.push("Flow State active.");
            break;
        case ItemType.HARMONIC_CRYSTAL:
            newEffectCounters['HARMONIC_RESONANCE'] = 20;
            logs.push("Harmonic Resonance active.");
            break;
    }

    return {
        grid: newGrid,
        gold: newGold,
        xp: newXp,
        inventory: newInventory,
        effectCounters: newEffectCounters,
        logs
    };
};

export const generateFallbackStory = (gameState: GameState): string => {
    const cause = gameState.runStats.highestTile >= 2048 ? "ascension" : "greed";
    const cls = gameState.selectedClass;
    const loc = gameState.currentStage.name;
    const reason = gameState.runStats.bossesDefeated > 2 ? "battle fatigue" : "bad luck";
    return `The ${cls} fell in ${loc}, consumed by ${cause}. Leaving behind ${gameState.runStats.goldEarned} gold coins.`;
};

export const checkAchievements = (state: GameState): string[] => {
    const newUnlocked: string[] = [];
    ACHIEVEMENTS.forEach(ach => {
        if (!state.achievements.includes(ach.id)) {
            if (ach.condition(state.stats, state)) {
                newUnlocked.push(ach.id);
            }
        }
    });
    return newUnlocked;
};

export const executeAutoCascade = (grid: Tile[], size: number, step: number, effectCounters: Record<string, number>) => {
    let moved = false;
    let newGrid = grid.map(t => ({...t}));
    
    for (let x = 0; x < size; x++) {
        const col = newGrid.filter(t => t.x === x).sort((a, b) => a.y - b.y);
        let writeY = size - 1;
        for (let i = col.length - 1; i >= 0; i--) {
            const tile = col[i];
            if (tile.y !== writeY) {
                tile.y = writeY;
                moved = true;
            }
            writeY--;
        }
    }
    
    const mergedIds: string[] = [];
    let xp = 0;
    let gold = 0;
    
    for (let x = 0; x < size; x++) {
        for (let y = size - 1; y > 0; y--) {
            const current = newGrid.find(t => t.x === x && t.y === y && !mergedIds.includes(t.id));
            const above = newGrid.find(t => t.x === x && t.y === y - 1 && !mergedIds.includes(t.id));
            
            if (current && above && current.value === above.value && current.value > 0) {
                current.value *= 2;
                current.isCascade = true;
                current.mergedFrom = [current.id, above.id]; 
                
                newGrid = newGrid.filter(t => t.id !== above.id);
                mergedIds.push(current.id); 
                
                xp += current.value;
                gold += Math.floor(current.value / 10);
                moved = true;
            }
        }
    }

    return {
        grid: newGrid,
        rewards: { xp, gold },
        lootEvents: [], 
        occurred: moved
    };
};

export const checkLoreUnlocks = (state: GameState, profile: PlayerProfile): StoryEntry[] => {
    return STORY_ENTRIES.filter(entry => {
        if (profile.unlockedLore.includes(entry.id)) return false;
        return entry.unlockCondition(state.stats, state, profile);
    });
};

export const executePowerupAction = (state: GameState, tileId: string, row?: number): Partial<GameState> | null => {
    return null;
};

export const processPassiveAbilities = (state: GameState): { grid: Tile[], abilities: Record<AbilityType, AbilityState>, triggered: string[] } => {
    let { grid, abilities } = state;
    const triggered: string[] = [];
    const newAbilities = { ...abilities };
    let newGrid = [...grid];

    if (newAbilities['SCORCH'].isUnlocked && newAbilities['SCORCH'].currentCooldown <= 0) {
        const targets = newGrid.filter(t => (t.type as any) !== TileType.BOSS).sort((a, b) => a.value - b.value);
        if (targets.length > 0) {
            const target = targets[0];
            newGrid = newGrid.filter(t => t.id !== target.id);
            newAbilities['SCORCH'].currentCooldown = newAbilities['SCORCH'].cooldown;
            triggered.push('SCORCH');
        }
    }

    if (newAbilities['DRAGON_BREATH'].isUnlocked && newAbilities['DRAGON_BREATH'].currentCooldown <= 0) {
        const rows: Record<number, Tile[]> = {};
        newGrid.forEach(t => {
            if (!rows[t.y]) rows[t.y] = [];
            rows[t.y].push(t);
        });
        const targetRow = Object.keys(rows).sort((a, b) => rows[parseInt(b)].length - rows[parseInt(a)].length)[0];
        if (targetRow) {
            const y = parseInt(targetRow);
            newGrid = newGrid.filter(t => t.y !== y || (t.type as any) === TileType.BOSS);
            newAbilities['DRAGON_BREATH'].currentCooldown = newAbilities['DRAGON_BREATH'].cooldown;
            triggered.push('DRAGON_BREATH');
        }
    }

    if (newAbilities['GOLDEN_EGG'].isUnlocked && newAbilities['GOLDEN_EGG'].currentCooldown <= 0) {
        const targets = newGrid.filter(t => (t.type as any) !== TileType.BOSS);
        if (targets.length > 0) {
            const target = targets[Math.floor(Math.random() * targets.length)];
            const idx = newGrid.indexOf(target);
            if (idx > -1) {
                newGrid[idx] = { ...target, value: target.value * 2, isNew: true };
                newAbilities['GOLDEN_EGG'].currentCooldown = newAbilities['GOLDEN_EGG'].cooldown;
                triggered.push('GOLDEN_EGG');
            }
        }
    }

    return { grid: newGrid, abilities: newAbilities, triggered };
};

export const updateCooldowns = (abilities: Record<AbilityType, AbilityState>): Record<AbilityType, AbilityState> => {
    const next = { ...abilities };
    Object.keys(next).forEach(k => {
        const key = k as AbilityType;
        if (next[key].currentCooldown > 0) {
            next[key] = { ...next[key], currentCooldown: next[key].currentCooldown - 1 };
        }
    });
    return next;
};

export const getHighscores = (): LeaderboardEntry[] => {
    try {
        const stored = localStorage.getItem(LEADERBOARD_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
};

export const saveHighscore = (entry: LeaderboardEntry) => {
    const scores = getHighscores();
    scores.push(entry);
    scores.sort((a, b) => b.score - a.score);
    const top = scores.slice(0, 50);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(top));
};

export const clearSaveData = () => {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
    localStorage.removeItem('2048_rpg_state_v3');
};
