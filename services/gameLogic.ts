
// services/gameLogic.ts

import { Direction, GameState, Tile, TileType, MoveResult, LootResult, ItemType, InventoryItem, Stage, LeaderboardEntry, GameStats, Achievement, InputSettings, RunStats, HeroClass, GameMode, PlayerProfile, ShopState, DailyModifier, Difficulty, LootEvent, StoryEntry, Medal } from '../types';
import { GRID_SIZE_INITIAL, SHOP_ITEMS, getXpThreshold, getStage, getStageBackground, ACHIEVEMENTS, TILE_STYLES, FALLBACK_STYLE, getItemDefinition, BOSS_DEFINITIONS, SHOP_CONFIG, DAILY_MODIFIERS, STORY_ENTRIES, MEDALS } from '../constants';
import { v4 as uuidv4 } from 'uuid';
import { rng } from '../utils/rng';

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

  let runeChance = 0.01 + (opts.powerUpChanceBonus || 0);
  
  if (hasMod(opts.modifiers, 'CHAOS_THEORY')) {
      runeChance *= 3;
  }

  if (!opts.forcedValue && !opts.type && !opts.isClassic && rng.next() < runeChance) {
      const roll = rng.next();
      if (roll < 0.4) type = TileType.RUNE_MIDAS;
      else if (roll < 0.7) type = TileType.RUNE_CHRONOS;
      else type = TileType.RUNE_VOID;
      value = 0;
  }

  if (type === TileType.BOSS) {
      if (grid.some(t => t.type === TileType.BOSS)) {
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

          maxHealth = Math.floor(bossDef.baseHealth * Math.pow(1.5, bossScale) * hpMult); 
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
    const dayRng = new (rng.constructor as any)();
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

  if (!restart && mode !== 'DAILY') {
    const saved = localStorage.getItem('2048_rpg_state_v3');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (!parsed.effectCounters) parsed.effectCounters = {};
            if (!parsed.gameMode) parsed.gameMode = 'RPG';
            if (!parsed.difficulty) parsed.difficulty = 'NORMAL';
            if (!parsed.tilesetId) parsed.tilesetId = 'DEFAULT';
            if (!parsed.settings.slideSpeed) parsed.settings.slideSpeed = 150;
            if (parsed.justLeveledUp === undefined) parsed.justLeveledUp = false;
            
            // Graphics Migration
            if (parsed.settings.graphicsQuality === undefined) {
                // Map old setting if present, otherwise default High
                parsed.settings.graphicsQuality = parsed.settings.lowPerformanceMode ? 'LOW' : 'HIGH';
                delete parsed.settings.lowPerformanceMode;
            }

            if (!parsed.lootEvents) parsed.lootEvents = [];
            if (!parsed.shop) parsed.shop = getInitialShopState();
            if (!parsed.activeModifiers) parsed.activeModifiers = [];
            if (parsed.victory === undefined) parsed.victory = false;
            if (parsed.gameWon === undefined) parsed.gameWon = false;
            if (!parsed.lastTurnMedals) parsed.lastTurnMedals = [];
            
            if (!parsed.runStats.medalsEarned) parsed.runStats.medalsEarned = [];

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

  const storedAchievements = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
  const achievements = storedAchievements ? JSON.parse(storedAchievements) : [];
  const profileStr = localStorage.getItem(PROFILE_STORAGE_KEY);
  const profile = profileStr ? JSON.parse(profileStr) : { accountLevel: 1 };

  let activeModifiers: DailyModifier[] = [];
  if (mode === 'DAILY' && seed) {
      activeModifiers = generateDailyModifiers(seed);
  }

  let startLevel = 1;
  let startGold = mode === 'CLASSIC' ? 0 : 0;
  
  if (mode === 'BOSS_RUSH') {
      startLevel = 5; 
      startGold = 500;
  }

  let initialGrid = spawnTile([], GRID_SIZE_INITIAL, startLevel, { isClassic: mode === 'CLASSIC', modifiers: activeModifiers, difficulty });
  initialGrid = spawnTile(initialGrid, GRID_SIZE_INITIAL, startLevel, { isClassic: mode === 'CLASSIC', modifiers: activeModifiers, difficulty });

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
    logs: ['Welcome, hero.', mode === 'CLASSIC' ? 'Classic Mode Active.' : mode === 'DAILY' ? 'Daily Challenge Started!' : `Class: ${heroClass}`, difficulty === 'HARD' ? 'Hard Mode Active!' : ''],
    activeEffects: [],
    effectCounters: {},
    currentStage: initialStage,
    rerolls: 0,
    stats,
    runStats,
    achievements,
    settings: { 
        enableKeyboard: true, 
        enableSwipe: true, 
        enableScroll: true, 
        invertSwipe: false, 
        invertScroll: false, 
        sensitivity: 5, 
        enableTooltips: true, 
        slideSpeed: 150,
        graphicsQuality: 'HIGH' 
    },
    selectedClass: heroClass,
    gameMode: mode,
    difficulty,
    tilesetId,
    accountLevel: profile.accountLevel,
    justLeveledUp: false,
    shop: getInitialShopState(activeModifiers),
    activeModifiers,
    lootEvents: [],
    lastTurnMedals: []
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
  let newGrid = grid.map(t => ({...t}));
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
  let mergedCount = 0;

  traversalX.forEach(x => {
    traversalY.forEach(y => {
      const tile = newGrid.find(t => t.x === x && t.y === y);
      if (!tile) return;

      const cell = { x: tile.x, y: tile.y };
      let next = { x: cell.x + vector.x, y: cell.y + vector.y };
      
      if (tile.type === TileType.BOSS) return;

      while (next.x >= 0 && next.x < size && next.y >= 0 && next.y < size) {
        const nextTile = newGrid.find(t => t.x === next.x && t.y === next.y);
        
        if (!nextTile) {
          cell.x = next.x;
          cell.y = next.y;
          next = { x: cell.x + vector.x, y: cell.y + vector.y };
          continue;
        } 
        
        if (nextTile.type === TileType.BOSS) {
            const projectileValue = tile.value;
            let siegeMultiplier = (effectCounters['SIEGE_BREAKER'] || 0) > 0 ? 3 : 1;
            
            if (hasMod(modifiers, 'GLASS_CANNON')) siegeMultiplier *= 2;

            const baseDmg = Math.max(1, Math.floor(projectileValue / 2));
            const damage = baseDmg * siegeMultiplier;
            
            nextTile.health = Math.max(0, (nextTile.health || 0) - damage);
            nextTile.mergedFrom = ['damage']; 

            lootEvents.push({ id: createId(), x: next.x, y: next.y, type: 'XP', value: damage });

            if (nextTile.health <= 0) {
                newGrid = newGrid.filter(t => t.id !== nextTile.id);
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
                const dist = Math.abs(tile.x - nextTile.x) + Math.abs(tile.y - nextTile.y);
                if (dist >= 3) medalsEarned.push(MEDALS.SNIPER);
            }
            
            newGrid = newGrid.filter(t => t.id !== tile.id);
            moved = true;
            return;
        }

        const isTileRune = tile.type.startsWith('RUNE_');
        const isNextRune = nextTile.type.startsWith('RUNE_');

        if (isTileRune || isNextRune) {
            const runeType = isTileRune ? tile.type : nextTile.type;
            powerUpTriggered = runeType as TileType;
            
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
              lootEvents.push({ id: createId(), x: next.x, y: next.y, type: 'GOLD', value: mergedValue });
          }

          newGrid = newGrid.filter(t => t.id !== tile.id && t.id !== nextTile.id);
          newGrid.push(mergedTile);

          score += mergedValue;
          xpGained += mergedValue;
          
          lootEvents.push({ id: createId(), x: next.x, y: next.y, type: 'XP', value: mergedValue });

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
        } else {
          cell.x = next.x - vector.x;
          cell.y = next.y - vector.y;
        }
        break;
      }
      
      // Update position only if it actually changed
      if (tile.x !== cell.x || tile.y !== cell.y) {
          tile.x = cell.x;
          tile.y = cell.y;
          moved = true;
      }
    });
  });

  // Calculate medals based on move performance
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
      medalsEarned
  };
};

export const isGameOver = (grid: Tile[], size: number): boolean => {
  if (getEmptyCells(grid, size).length > 0) return false;

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const tile = grid.find(t => t.x === x && t.y === y);
      if (!tile) continue;

      if (x < size - 1) {
        const right = grid.find(t => t.x === x + 1 && t.y === y);
        if (right && right.value === tile.value) return false;
      }
      if (y < size - 1) {
        const down = grid.find(t => t.x === x && t.y === y + 1);
        if (down && down.value === tile.value) return false;
      }
    }
  }
  return true;
};

export const useInventoryItem = (state: GameState, item: InventoryItem): Partial<GameState> | null => {
    let newGrid = [...state.grid];
    let newEffectCounters = { ...state.effectCounters };
    let newLogs = [...state.logs];
    let newGold = state.gold;
    let newXp = state.xp;
    let used = false;
    let newInventory = state.inventory.filter(i => i.id !== item.id);

    switch(item.type) {
        case ItemType.XP_POTION:
            newXp += 1000;
            newLogs.push("Used XP Potion: +1000 XP");
            used = true;
            break;
        case ItemType.GREATER_XP_POTION:
            newXp += 2500;
            newLogs.push("Used Greater XP Potion: +2500 XP");
            used = true;
            break;
        case ItemType.GRANDMASTER_BREW:
            newXp += 5000;
            newEffectCounters['FLOW_STATE'] = 20;
            newLogs.push("Grandmaster Brew Consumed!");
            used = true;
            break;
        case ItemType.REROLL_TOKEN:
             newGrid = spawnTile(spawnTile([], state.gridSize, state.level), state.gridSize, state.level);
             newLogs.push("Board Rerolled!");
             used = true;
             break;
        case ItemType.BOMB_SCROLL:
            {
                const tiles = newGrid.filter(t => t.type !== TileType.BOSS && t.value > 0).sort((a,b) => a.value - b.value);
                if (tiles.length > 0) {
                    const toRemove = tiles.slice(0, 3);
                    newGrid = newGrid.filter(t => !toRemove.includes(t));
                    newLogs.push("Bomb Scroll: Destroyed 3 weak tiles");
                    used = true;
                }
            }
            break;
        case ItemType.CATACLYSM_SCROLL:
            {
                 const tiles = newGrid.filter(t => t.type !== TileType.BOSS).sort((a,b) => a.value - b.value);
                 const toRemoveCount = Math.floor(tiles.length / 2);
                 const toRemove = tiles.slice(0, toRemoveCount);
                 newGrid = newGrid.filter(t => !toRemove.includes(t));
                 newLogs.push("Cataclysm! Half the board purged.");
                 used = true;
            }
            break;
        case ItemType.GOLDEN_RUNE:
            newEffectCounters['GOLDEN_SPAWN'] = 1;
            newLogs.push("Golden Rune Active: Next spawn is Golden");
            used = true;
            break;
        case ItemType.LUCKY_CHARM:
            newEffectCounters['LUCKY_LOOT'] = 50; 
            newLogs.push("Lucky Charm: Loot chance increased");
            used = true;
            break;
        case ItemType.LUCKY_DICE:
            newEffectCounters['LUCKY_DICE'] = 30;
            newLogs.push("Lucky Dice: Fate favors you.");
            used = true;
            break;
        case ItemType.MIDAS_POTION:
            newEffectCounters['MIDAS_POTION'] = 50;
            newLogs.push("Midas Potion: Gold x2 for 50 turns");
            used = true;
            break;
        case ItemType.SIEGE_BREAKER:
            newEffectCounters['SIEGE_BREAKER'] = 5;
            newLogs.push("Siege Breaker: Boss Damage x3");
            used = true;
            break;
        case ItemType.CHAIN_CATALYST:
            newEffectCounters['CHAIN_CATALYST'] = 10;
            newLogs.push("Chain Catalyst: Cascades Enabled");
            used = true;
            break;
         case ItemType.VOID_STONE:
            newEffectCounters['VOID_STONE'] = 10;
            newLogs.push("Void Stone: Consuming weak tiles...");
            used = true;
            break;
         case ItemType.RADIANT_AURA:
            newEffectCounters['RADIANT_AURA'] = 20;
            newLogs.push("Radiant Aura: +50% XP");
            used = true;
            break;
         case ItemType.THUNDER_SCROLL:
            // Immediate effect: destroy random tiles? Or just simulate cascade?
            // Let's destroy 2 random columns
            const cols = [Math.floor(Math.random() * state.gridSize), Math.floor(Math.random() * state.gridSize)];
            newGrid = newGrid.filter(t => t.type === TileType.BOSS || !cols.includes(t.x));
            newLogs.push("Thunder Scroll: Columns struck by lightning!");
            used = true;
            break;
         case ItemType.ASCENDANT_RUNE:
            newEffectCounters['ASCENDANT_SPAWN'] = 5;
            newLogs.push("Ascendant Rune: High tier spawns");
            used = true;
            break;
    }

    if (used) {
        return {
            grid: newGrid,
            effectCounters: newEffectCounters,
            inventory: newInventory,
            logs: newLogs,
            xp: newXp,
            gold: newGold
        };
    }
    return null;
};

export const checkAchievements = (state: GameState): string[] => {
    const unlocked: string[] = [];
    ACHIEVEMENTS.forEach(ach => {
        if (!state.achievements.includes(ach.id) && ach.condition(state.stats, state)) {
            unlocked.push(ach.id);
        }
    });
    return unlocked;
};

export const executeAutoCascade = (grid: Tile[], size: number, step: number, effectCounters: Record<string, number>) => {
    // Simple cascade logic:
    // If CHAIN_CATALYST or active cascade, check if any merges are possible "in place" without moving? 
    // Or maybe check if gravity applies (tiles falling into empty spots)
    
    // For this implementation, we will simulate gravity DOWN if there are empty spots below tiles.
    let newGrid = grid.map(t => ({...t}));
    let moved = false;
    let xp = 0;
    let gold = 0;
    const lootEvents: LootEvent[] = [];

    // Gravity logic (simple bubble sort down)
    // iterate columns
    for(let x=0; x<size; x++) {
        const colTiles = newGrid.filter(t => t.x === x).sort((a,b) => b.y - a.y); // bottom to top
        let writeY = size - 1;
        for(const tile of colTiles) {
            if (tile.type === TileType.BOSS) {
                writeY = tile.y - 1; // Boss blocks gravity
                continue;
            }
            if (tile.y !== writeY) {
                // Check if blocked by boss? No, sort order handles it if boss is in list
                // Need to be careful not to move tile past boss.
                // Assuming Boss doesn't move and takes a slot.
                const blocker = newGrid.find(t => t.x === x && t.y === writeY && t.id !== tile.id);
                if (!blocker) {
                    tile.y = writeY;
                    tile.isCascade = true;
                    moved = true;
                }
            }
            writeY--;
        }
    }

    // If we moved things, check for merges now
    if (moved) {
        // ... simplistic merge check on new positions?
        // Reuse moveGrid logic with NO direction? No, 2048 merges happen on move.
        // Let's just say "gravity happened" is the event.
    }

    return { occurred: moved, grid: newGrid, rewards: { xp, gold }, lootEvents };
};

export const checkLoreUnlocks = (state: GameState, profile: PlayerProfile): StoryEntry[] => {
    return STORY_ENTRIES.filter(entry => 
        !profile.unlockedLore.includes(entry.id) && entry.unlockCondition(state.stats, state, profile)
    );
};

export const getHighscores = (): LeaderboardEntry[] => {
    try {
        const data = localStorage.getItem(LEADERBOARD_KEY);
        return data ? JSON.parse(data) : [];
    } catch { return []; }
};

export const clearSaveData = () => {
    localStorage.removeItem('2048_rpg_state_v3');
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    localStorage.removeItem(LEADERBOARD_KEY);
    localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
    window.location.reload();
};
