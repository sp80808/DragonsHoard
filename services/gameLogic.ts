import { Direction, GameState, Tile, TileType, MoveResult, ItemType, InventoryItem, Stage, LeaderboardEntry, GameStats, Achievement, HeroClass, CraftingRecipe, DailyModifier, StoryEntry, PlayerProfile, Medal, AbilityType, AbilityState, Difficulty, LootEvent, ShopState, GameMode, RunStats, MergeEvent } from '../types';
import { GRID_SIZE_INITIAL, SHOP_ITEMS, getXpThreshold, getStage, getStageBackground, ACHIEVEMENTS, TILE_STYLES, FALLBACK_STYLE, getItemDefinition, BOSS_DEFINITIONS, SHOP_CONFIG, DAILY_MODIFIERS, STORY_ENTRIES, MEDALS, CLASS_SKILL_TREES } from '../constants';
import { RNG, rng, generateId } from '../utils/rng';
import { audioService } from './audioService'; 
import { claimDailyReward, getPlayerProfile } from './storageService';

export const createId = () => generateId();
const LEADERBOARD_KEY = 'dragon_hoard_leaderboard';
const ACHIEVEMENTS_STORAGE_KEY = 'dragon_hoard_unlocked_achievements';
const PROFILE_STORAGE_KEY = 'dragons_hoard_profile';

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
  activeClassSkills?: string[];
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
  // ADV_5: Archaeologist
  if (opts.activeClassSkills?.includes('ADV_5')) {
      runeChance *= 1.2;
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
          // Paladin Smite: Weakens bosses
          if (opts.activeClassSkills?.includes('PAL_2')) hpMult *= 0.9;

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

const getInitialShopState = (modifiers?: DailyModifier[], activeSkills?: string[]): ShopState => {
    const items: Record<string, { stock: number; priceMultiplier: number }> = {};
    SHOP_ITEMS.forEach(item => {
        const cat = item.category as keyof typeof SHOP_CONFIG.STOCK_LIMITS;
        const limit = SHOP_CONFIG.STOCK_LIMITS[cat] || 3;
        
        let priceMult = 1.0;
        if (hasMod(modifiers, 'MANA_DROUGHT')) priceMult += 0.5;
        if (hasMod(modifiers, 'VOLATILE_ALCHEMY') && item.category === 'CONSUMABLE') priceMult -= 0.5;
        
        // Rogue Discount (ROG_2)
        if (activeSkills?.includes('ROG_2')) priceMult *= 0.9;
        
        // Adventurer Haggler (ADV_4) - Stackable? Yes.
        if (activeSkills?.includes('ADV_4')) priceMult *= 0.9;

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

  const profile = getPlayerProfile();

  if (!restart && mode !== 'DAILY') {
    const saved = localStorage.getItem('2048_rpg_state_v3');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // ... (keep existing compatibility checks)
            if (!parsed.abilities) {
                parsed.abilities = {
                    'SCORCH': { id: 'SCORCH', isUnlocked: false, charges: 1, maxCharges: 1, cooldown: 30, currentCooldown: 30 },
                    'DRAGON_BREATH': { id: 'DRAGON_BREATH', isUnlocked: false, charges: 1, maxCharges: 1, cooldown: 60, currentCooldown: 60 },
                    'GOLDEN_EGG': { id: 'GOLDEN_EGG', isUnlocked: false, charges: 1, maxCharges: 1, cooldown: 50, currentCooldown: 50 }
                };
            }
            if (!parsed.mergeEvents) parsed.mergeEvents = [];
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
            if (parsed.baselineAccountXp === undefined) {
                parsed.baselineAccountXp = profile.totalAccountXp;
            }
            if (!parsed.activeClassSkills) parsed.activeClassSkills = [];
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

  let inventory: InventoryItem[] = [];
  
  const stats: GameStats = {
      totalMerges: 0, highestCombo: 0, slimesMerged: 0, bossesDefeated: 0, goldCollected: 0, highestTile: 0, totalMoves: 0
  };

  const runStats: RunStats = {
      highestTile: 0, highestMonster: 'Slime', stageReached: stage.name, turnCount: 0, powerUpsUsed: 0, goldEarned: 0, cascadesTriggered: 0, startTime: Date.now(), bossesDefeated: 0, mergesCount: 0, itemsCrafted: 0, medalsEarned: [],
      xpGainedClass: 0, xpGainedAccount: 0
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

  // --- NEW: Apply Skill Tree Effects ---
  const activeClassSkills: string[] = profile.classProgress?.[heroClass]?.unlockedNodes || [];
  
  // ROG_5: Shadow Guild - Start with 2 random items
  if (activeClassSkills.includes('ROG_5')) {
      for (let i = 0; i < 2; i++) {
          const randomItem = SHOP_ITEMS[Math.floor(rng.next() * SHOP_ITEMS.length)];
          inventory.push({ 
              id: createId(), 
              type: randomItem.id as ItemType, 
              name: randomItem.name, 
              description: randomItem.desc, 
              icon: randomItem.icon 
          });
      }
  }

  // DS_5: Dragon Heart
  if (activeClassSkills.includes('DS_5')) {
      startGold += 1000;
  }

  // We need a temporary state to pass to effect functions
  let tempState: GameState = {
      grid: [], score: 0, bestScore: 0, xp: 0, level: startLevel, gold: startGold,
      inventory: [], gridSize: GRID_SIZE_INITIAL, gameOver: false, victory: false, gameWon: false,
      combo: 0, logs: [], activeEffects: [], effectCounters: {}, currentStage: initialStage,
      rerolls: 0, stats, runStats, achievements: [], settings: {} as any,
      selectedClass: heroClass, gameMode: mode, difficulty, tilesetId,
      accountLevel: profile.accountLevel, baselineAccountXp: profile.totalAccountXp,
      justLeveledUp: false, shop: { items: {}, turnsUntilRestock: 0 },
      activeModifiers, lootEvents: [], mergeEvents: [], lastTurnMedals: [], abilities: {} as any,
      targetingMode: null, activeClassSkills
  };

  // Run effects
  activeClassSkills.forEach(nodeId => {
      const node = CLASS_SKILL_TREES[heroClass]?.find(n => n.id === nodeId);
      if (node && node.effect) {
          const partial = node.effect(tempState);
          if (partial.inventory) inventory = [...inventory, ...partial.inventory];
          if (partial.gold) startGold += partial.gold;
      }
  });
  
  let initialGrid = spawnTile([], GRID_SIZE_INITIAL, startLevel, { isClassic: mode === 'CLASSIC', modifiers: activeModifiers, difficulty, activeClassSkills });
  initialGrid = spawnTile(initialGrid, GRID_SIZE_INITIAL, startLevel, { isClassic: mode === 'CLASSIC', modifiers: activeModifiers, difficulty, activeClassSkills });

  // MAGE_5: Time Warp - Inject Chronos Rune
  if (activeClassSkills.includes('MAGE_5')) {
      const empty = getEmptyCells(initialGrid, GRID_SIZE_INITIAL);
      if (empty.length > 0) {
          const {x, y} = empty[0];
          initialGrid.push({
              id: createId(), x, y, value: 0, type: TileType.RUNE_CHRONOS, isNew: true
          });
      }
  }

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
    baselineAccountXp: profile.totalAccountXp,
    justLeveledUp: false,
    shop: getInitialShopState(activeModifiers, activeClassSkills),
    activeModifiers,
    lootEvents: [],
    mergeEvents: [],
    lastTurnMedals: [],
    abilities,
    targetingMode: null,
    cascadeDelay: 250, // default
    activeClassSkills
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
    stats?: GameStats,
    activeClassSkills?: string[] // Added for passive checks
): MoveResult => {
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
  let maxMergedValue = 0;

  newGrid.forEach(t => { delete t.isNew; delete t.isCascade; delete t.mergedFrom; });

  const vector = {
    [Direction.UP]: { x: 0, y: -1 },
    [Direction.DOWN]: { x: 0, y: 1 },
    [Direction.LEFT]: { x: -1, y: 0 },
    [Direction.RIGHT]: { x: 1, y: 0 },
  }[direction];

  newGrid.sort((a, b) => {
      if (vector.x === 1) return b.x - a.x;
      if (vector.x === -1) return a.x - b.x;
      if (vector.y === 1) return b.y - a.y;
      if (vector.y === -1) return a.y - b.y;
      return 0;
  });

  const occupancyMap = new Map<string, Tile>();
  newGrid.forEach(t => occupancyMap.set(`${t.x},${t.y}`, t));

  let combo = 0;
  let mergedCount = 0;

  for (const tile of newGrid) {
      if (tile.isDying) continue;

      let cell = { x: tile.x, y: tile.y };
      let next = { x: cell.x + vector.x, y: cell.y + vector.y };
      
      occupancyMap.delete(`${tile.x},${tile.y}`);

      if (tile.type === TileType.BOSS) {
          occupancyMap.set(`${tile.x},${tile.y}`, tile);
          continue;
      }

      while (next.x >= 0 && next.x < size && next.y >= 0 && next.y < size) {
        const nextKey = `${next.x},${next.y}`;
        const nextTile = occupancyMap.get(nextKey);
        
        if (!nextTile) {
          cell = { ...next };
          next = { x: cell.x + vector.x, y: cell.y + vector.y };
          continue;
        } 
        
        if (nextTile.type === TileType.BOSS) {
            const projectileValue = tile.value;
            let siegeMultiplier = (effectCounters['SIEGE_BREAKER'] || 0) > 0 ? 3 : 1;
            if (hasMod(modifiers, 'GLASS_CANNON')) siegeMultiplier *= 2;
            
            // Skill Tree Passives
            if (activeClassSkills?.includes('WAR_2')) siegeMultiplier *= 1.2; // Giant Slayer
            if (activeClassSkills?.includes('DS_1')) siegeMultiplier *= 1.5; // Apex Predator
            
            // WAR_5: Berserker (5% chance double damage)
            if (activeClassSkills?.includes('WAR_5') && rng.next() < 0.05) {
                siegeMultiplier *= 2;
                logs.push("Berserk Hit!");
            }

            const baseDmg = Math.max(1, Math.floor(projectileValue / 2));
            const damage = baseDmg * siegeMultiplier;
            
            nextTile.health = Math.max(0, (nextTile.health || 0) - damage);
            nextTile.mergedFrom = ['damage'];

            // DS_3: Executioner - Instakill below 20%
            if (activeClassSkills?.includes('DS_3') && nextTile.health && nextTile.maxHealth && (nextTile.health / nextTile.maxHealth) < 0.2) {
                nextTile.health = 0;
                logs.push("Executioner Triggered!");
            }

            tile.x = next.x;
            tile.y = next.y;
            tile.isDying = true; 
            
            lootEvents.push({ id: createId(), x: next.x, y: next.y, type: 'XP', value: damage });

            if ((nextTile.health || 0) <= 0) {
                nextTile.isDying = true; 
                occupancyMap.delete(nextKey);
                
                score += 500;
                xpGained += 2000;
                goldGained += 100;
                bossDefeated = true;
                
                // DS_2: Hoard Sense
                if (activeClassSkills?.includes('DS_2')) goldGained += 100;
                // WAR_4: Vampirism
                if (activeClassSkills?.includes('WAR_4')) {
                    goldGained += 200;
                    lootEvents.push({ id: createId(), x: next.x, y: next.y, type: 'GOLD', value: 200 });
                }
                // PAL_4: Justicar
                if (activeClassSkills?.includes('PAL_4')) xpGained += 1000;

                lootEvents.push({ id: createId(), x: next.x, y: next.y, type: 'GOLD', value: activeClassSkills?.includes('DS_2') ? 200 : 100 });
                lootEvents.push({ id: createId(), x: next.x, y: next.y, type: 'XP', value: activeClassSkills?.includes('PAL_4') ? 3000 : 2000 });

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
            break; 
        }

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
             
             nextTile.isDying = true;
             occupancyMap.delete(nextKey);
             powerUpTriggered = nextTile.type;
             
             cell = { ...next };
             next = { x: cell.x + vector.x, y: cell.y + vector.y };
             moved = true;
             continue;
        }

        if (nextTile.value === tile.value && !nextTile.mergedFrom) {
          const mergedValue = tile.value * 2;
          maxMergedValue = Math.max(maxMergedValue, mergedValue);

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

          tile.x = next.x;
          tile.y = next.y;
          tile.isDying = true; 
          nextTile.isDying = true; 

          newGrid.push(mergedTile);
          occupancyMap.set(nextKey, mergedTile);

          // ADV_1: Survivor Score Bonus
          const scoreMult = activeClassSkills?.includes('ADV_1') ? 1.1 : 1.0;
          score += Math.floor(mergedValue * scoreMult);
          
          // INCREASED XP GAIN
          let mergeXp = Math.floor(mergedValue * 2) + 10;
          // MAGE_1: Arcane Study
          if (activeClassSkills?.includes('MAGE_1')) mergeXp = Math.floor(mergeXp * 1.15);
          
          xpGained += mergeXp;
          
          lootEvents.push({ id: createId(), x: next.x, y: next.y, type: 'XP', value: mergeXp });

          if (mode !== 'CLASSIC' && rng.next() < 0.05) {
               goldGained += Math.floor(mergedValue / 5); 
          }

          let goldMult = (effectCounters['MIDAS_POTION'] || 0) > 0 ? 2 : 1;
          // ADV_3: Veteran Gold Bonus
          if (activeClassSkills?.includes('ADV_3')) goldMult *= 1.1;

          const basicGold = Math.floor((mergedValue / 10) * goldMult);
          if (basicGold > 0) {
              goldGained += basicGold;
          }
          
          // ROG_3: Jackpot
          if (activeClassSkills?.includes('ROG_3') && rng.next() < 0.01) {
              const jackpot = 500;
              goldGained += jackpot;
              lootEvents.push({ id: createId(), x: next.x, y: next.y, type: 'GOLD', value: jackpot, icon: '🎰' });
              logs.push("JACKPOT!");
          }
          // ROG_4: Pickpocket
          if (activeClassSkills?.includes('ROG_4') && rng.next() < 0.05) {
              goldGained += 1;
          }

          if (mode === 'RPG' || mode === 'DAILY' || mode === 'BOSS_RUSH') {
              const luckBuff = (effectCounters['LUCKY_LOOT'] || 0) > 0 ? 0.05 : 0;
              const diceBuff = (effectCounters['LUCKY_DICE'] || 0) > 0 ? 0.05 : 0;
              let difficultyNerf = difficulty === 'HARD' ? 0.5 : 1.0;
              
              // ADV_2: Lucky Find
              const classBuff = activeClassSkills?.includes('ADV_2') ? 0.02 : 0;

              const baseChance = Math.min(0.1, (Math.log2(mergedValue) * 0.005) + 0.005);
              const totalChance = (baseChance + luckBuff + diceBuff + classBuff) * difficultyNerf;

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
          break; 
        } 
        
        break;
      }

      if (cell.x !== tile.x || cell.y !== tile.y) {
          tile.x = cell.x;
          tile.y = cell.y;
          moved = true;
          occupancyMap.set(`${tile.x},${tile.y}`, tile);
      } else {
          occupancyMap.set(`${tile.x},${tile.y}`, tile);
      }
  }

  // --- Medals Checks ---
  if (stats && stats.totalMerges === 0 && mergedCount >= 1) medalsEarned.push(MEDALS.FIRST_MERGE);
  if (mergedCount === 2) medalsEarned.push(MEDALS.DOUBLE_MERGE);
  if (mergedCount === 3) medalsEarned.push(MEDALS.MULTI_MERGE);
  if (mergedCount >= 5) medalsEarned.push(MEDALS.MEGA_MERGE);
  
  if (combo >= 3) medalsEarned.push(MEDALS.COMBO_3);
  if (combo >= 5) medalsEarned.push(MEDALS.COMBO_5);
  if (combo >= 10) medalsEarned.push(MEDALS.COMBO_10);

  return {
      grid: newGrid,
      score,
      xpGained,
      goldGained,
      itemsFound,
      moved,
      mergedIds,
      combo,
      comboMultiplier: 1 + (combo * 0.1),
      logs,
      powerUpTriggered,
      bossDefeated,
      lootEvents,
      medalsEarned,
      abilitiesTriggered,
      hitstopDuration: bossDefeated ? 500 : 0
  };
};

export const isGameOver = (grid: Tile[], size: number) => {
    if (getEmptyCells(grid, size).length > 0) return false;
    
    const tileMap: Record<string, Tile> = {};
    grid.forEach(t => { tileMap[`${t.x},${t.y}`] = t; });

    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            const current = tileMap[`${x},${y}`];
            if (!current) continue;
            
            const neighbors = [
                {x: x+1, y}, {x: x-1, y}, {x, y: y+1}, {x, y: y-1}
            ];
            
            for (const n of neighbors) {
                const neighbor = tileMap[`${n.x},${n.y}`];
                if (neighbor && neighbor.value === current.value && neighbor.type !== TileType.STONE && current.type !== TileType.STONE) {
                    return false;
                }
            }
        }
    }
    return true;
};

export const useInventoryItem = (state: GameState, item: InventoryItem): Partial<GameState> | null => {
    const invIndex = state.inventory.findIndex(i => i.id === item.id);
    if (invIndex === -1) return null;

    let newState: Partial<GameState> = {};
    let used = true;
    let logs = [...state.logs];
    let newInventory = [...state.inventory];
    let newGrid = [...state.grid];
    let effectCounters = { ...state.effectCounters };

    switch(item.type) {
        case ItemType.XP_POTION:
            newState.xp = state.xp + 1000; // Increased base value
            logs.push("Gained 1000 XP");
            newState.lootEvents = [...state.lootEvents, { id: createId(), x: 1, y: 1, type: 'XP', value: 1000 }];
            break;
        case ItemType.GREATER_XP_POTION:
            newState.xp = state.xp + 2500;
            logs.push("Gained 2500 XP");
            newState.lootEvents = [...state.lootEvents, { id: createId(), x: 1, y: 1, type: 'XP', value: 2500 }];
            break;
        case ItemType.MIDAS_POTION:
            effectCounters['MIDAS_POTION'] = 50;
            logs.push("Midas Touch Active (50 turns)");
            break;
        case ItemType.RADIANT_AURA:
            effectCounters['RADIANT_AURA'] = 20;
            logs.push("Radiant Aura (20 turns)");
            break;
        case ItemType.LUCKY_CHARM:
            effectCounters['LUCKY_LOOT'] = 50;
            logs.push("Feeling Lucky (50 turns)");
            break;
        case ItemType.CHAIN_CATALYST:
            effectCounters['CHAIN_CATALYST'] = 10;
            logs.push("Chain Reaction Ready (10 turns)");
            newState.isCascading = true; // Trigger immediate check
            break;
        case ItemType.LUCKY_DICE:
            effectCounters['LUCKY_DICE'] = 30;
            logs.push("Dice Rolled! (30 turns)");
            break;
        case ItemType.VOID_STONE:
            effectCounters['VOID_STONE'] = 10;
            logs.push("Void Stone Active (10 turns)");
            break;
        case ItemType.SIEGE_BREAKER:
            effectCounters['SIEGE_BREAKER'] = 1;
            logs.push("Siege Breaker Ready!");
            break;
        case ItemType.BOMB_SCROLL:
            // Remove 3 lowest value tiles
            const targets = newGrid.filter(t => t.type === TileType.NORMAL).sort((a,b) => a.value - b.value).slice(0, 3);
            newGrid = newGrid.filter(t => !targets.includes(t));
            audioService.playBomb();
            logs.push(`Destroyed ${targets.length} tiles`);
            break;
        case ItemType.CATACLYSM_SCROLL:
            // Remove 50% of tiles
            const allNormal = newGrid.filter(t => t.type === TileType.NORMAL);
            const toRemove = rng.shuffle(allNormal).slice(0, Math.floor(allNormal.length / 2));
            newGrid = newGrid.filter(t => !toRemove.includes(t));
            audioService.playBomb();
            logs.push("Cataclysm Unleashed!");
            break;
        case ItemType.THUNDER_SCROLL:
            newState.isCascading = true; // Force cascade
            logs.push("Thunderstruck!");
            audioService.playZap(3);
            break;
        case ItemType.MERCHANT_BELL:
            newState.shop = {
                items: state.shop.items, // Logic would be complex here, let's assume it resets restock timer
                turnsUntilRestock: 0 // Will trigger restock logic in App or moveGrid
            };
            logs.push("Shop Restocked!");
            break;
        case ItemType.REROLL_TOKEN:
            newState.rerolls = state.rerolls + 1;
            logs.push("Reroll Added");
            break;
        case ItemType.GOLDEN_RUNE:
            // Handled by spawn logic checking inventory or effect?
            // Let's add a buff for next spawn
            effectCounters['ASCENDANT_SPAWN'] = 1; 
            logs.push("Next spawn upgraded");
            break;
        case ItemType.OMNI_SLASH:
            // Damage all bosses
            newGrid.forEach(t => {
                if (t.type === TileType.BOSS) {
                    t.health = Math.max(0, (t.health || 0) - 20);
                    t.mergedFrom = ['damage'];
                }
            });
            // Cleanup dead bosses handled in moveGrid usually, but we can do simple check here or let next move handle it
            logs.push("Omnislash!");
            audioService.playZap(2);
            break;
        case ItemType.TRANSMUTATION_SCROLL:
            // Upgrade lowest tier
            const minVal = Math.min(...newGrid.filter(t => t.type === TileType.NORMAL).map(t => t.value));
            newGrid.forEach(t => {
                if (t.type === TileType.NORMAL && t.value === minVal) {
                    t.value *= 2;
                    t.isNew = true; // Trigger animation
                }
            });
            logs.push("Transmutation Complete");
            audioService.playLevelUp();
            break;
        default:
            used = false;
    }

    if (used) {
        newInventory.splice(invIndex, 1);
        newState.inventory = newInventory;
        newState.logs = logs;
        newState.effectCounters = effectCounters;
        newState.grid = newGrid;
        return newState;
    }
    return null;
}

export const executeAutoCascade = (grid: Tile[], size: number, step: number, effectCounters: Record<string, number>): { 
    occurred: boolean; 
    grid: Tile[]; 
    rewards: { xp: number; gold: number }; 
    lootEvents: LootEvent[]; 
    mergeEvents: MergeEvent[]; 
    type: 'MERGE' | 'SPAWN' 
} => {
    // 1. GRAVITY: Move tiles down
    let moved = false;
    let newGrid = grid.map(t => ({...t, isNew: false, isCascade: false, mergedFrom: undefined }));
    let lootEvents: LootEvent[] = [];
    
    // Sort by Y desc (bottom up) to handle gravity correctly
    newGrid.sort((a,b) => b.y - a.y);
    
    const map = new Map<string, Tile>();
    newGrid.forEach(t => map.set(`${t.x},${t.y}`, t));

    // Gravity Pass
    for (const tile of newGrid) {
        if (tile.type === TileType.BOSS || tile.type === TileType.STONE) continue; // Heavy objects dont fall in this logic? Or do they? Let's say they do.
        
        let currentY = tile.y;
        while (currentY < size - 1) {
            const nextY = currentY + 1;
            if (!map.has(`${tile.x},${nextY}`)) {
                map.delete(`${tile.x},${currentY}`);
                tile.y = nextY;
                map.set(`${tile.x},${tile.y}`, tile);
                currentY = nextY;
                moved = true;
            } else {
                break;
            }
        }
    }

    if (moved) {
        return { occurred: true, grid: newGrid, rewards: {xp:0, gold:0}, lootEvents: [], mergeEvents: [], type: 'SPAWN' };
    }

    // 2. MERGE: Check vertical matches after settling
    let merged = false;
    let xp = 0;
    let gold = 0;
    let mergeEvents: MergeEvent[] = [];
    
    // Process from bottom up again
    // We need to re-sort because Ys changed
    newGrid.sort((a,b) => b.y - a.y);
    
    // Cleanup map
    map.clear();
    newGrid.forEach(t => map.set(`${t.x},${t.y}`, t));

    const finalGrid: Tile[] = [];
    const processedIds = new Set<string>();

    for (const tile of newGrid) {
        if (processedIds.has(tile.id)) continue;

        // Check above neighbor for merge (since we iterate bottom-up, we look "up" for the pair falling onto us? No, gravity settles them. We check adjacency.)
        // Actually for standard match-3 cascade, we look for matches. 
        // 2048 Cascade: If [2] is above [2], they merge.
        
        const aboveKey = `${tile.x},${tile.y - 1}`;
        const aboveTile = map.get(aboveKey);

        if (aboveTile && !processedIds.has(aboveTile.id) && aboveTile.value === tile.value && tile.type !== TileType.BOSS && tile.type !== TileType.STONE) {
            // Merge!
            const newValue = tile.value * 2;
            const newTile: Tile = {
                id: createId(),
                x: tile.x,
                y: tile.y,
                value: newValue,
                type: TileType.NORMAL,
                isNew: true,
                isCascade: true,
                mergedFrom: [tile.id, aboveTile.id]
            };
            
            processedIds.add(tile.id);
            processedIds.add(aboveTile.id);
            finalGrid.push(newTile);
            
            merged = true;
            
            // Rewards
            const multiplier = (effectCounters['FLOW_STATE'] || 0) > 0 ? 2 : 1;
            const baseXp = Math.floor(newValue * 2 * multiplier);
            const baseGold = Math.floor(newValue / 2 * multiplier);
            
            xp += baseXp;
            gold += baseGold;
            
            lootEvents.push({ id: createId(), x: tile.x, y: tile.y, type: 'XP', value: baseXp });
            if (baseGold > 0) lootEvents.push({ id: createId(), x: tile.x, y: tile.y, type: 'GOLD', value: baseGold });
            
            mergeEvents.push({
                id: newTile.id,
                x: tile.x,
                y: tile.y,
                value: newValue,
                type: TileType.NORMAL,
                isCascade: true
            });

        } else {
            // No merge, keep tile
            if (!processedIds.has(tile.id)) {
                finalGrid.push(tile);
                processedIds.add(tile.id);
            }
        }
    }

    if (merged) {
        return { occurred: true, grid: finalGrid, rewards: {xp, gold}, lootEvents, mergeEvents, type: 'MERGE' };
    }

    return { occurred: false, grid, rewards: {xp:0, gold:0}, lootEvents: [], mergeEvents: [], type: 'SPAWN' };
}

export const checkAchievements = (state: GameState): string[] => {
    const unlocked: string[] = [];
    ACHIEVEMENTS.forEach(ach => {
        if (!state.achievements.includes(ach.id) && ach.condition(state.stats, state)) {
            unlocked.push(ach.id);
        }
    });
    return unlocked;
}

export const checkLoreUnlocks = (state: GameState): string[] => {
    // Logic to check if new lore is available based on kills/encounter
    // Currently purely simulated or based on high-tile
    const newLore: string[] = [];
    // Example: Unlock "DRAGON" lore if 2048 tile exists
    if (state.stats.highestTile >= 2048) newLore.push('lore_dragon');
    return newLore;
}

export const executePowerupAction = (state: GameState, id: string, row?: number): Partial<GameState> | null => {
    // This handles click-to-activate abilities on grid (e.g. targeted destruction)
    if (state.targetingMode === 'SCORCH' && id) {
        const target = state.grid.find(t => t.id === id);
        if (target) {
            const newGrid = state.grid.filter(t => t.id !== id);
            return {
                grid: newGrid,
                targetingMode: null,
                abilities: { ...state.abilities, 'SCORCH': { ...state.abilities['SCORCH'], currentCooldown: state.abilities['SCORCH'].cooldown } }
            };
        }
    }
    return null;
}

export const updateCooldowns = (abilities: Record<AbilityType, AbilityState>): Record<AbilityType, AbilityState> => {
    const next = { ...abilities };
    Object.keys(next).forEach(key => {
        const k = key as AbilityType;
        if (next[k].currentCooldown > 0) {
            next[k].currentCooldown--;
        }
    });
    return next;
}

export const saveHighscore = (score: number, heroClass: HeroClass) => {
    const scores = getHighscores();
    scores.push({ score, heroClass, date: Date.now(), name: 'You' });
    scores.sort((a,b) => b.score - a.score);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(scores.slice(0, 10)));
}

export const getHighscores = (): LeaderboardEntry[] => {
    try {
        return JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]');
    } catch { return []; }
}

export const clearSaveData = () => {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    localStorage.removeItem('2048_rpg_state_v3');
    localStorage.removeItem(LEADERBOARD_KEY);
    localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
}

export const generateFallbackStory = (state: GameState): string => {
    return `The hero ${state.selectedClass} delved into the ${state.currentStage.name}, amassing ${state.gold} gold before falling.`;
}

export const processPassiveAbilities = (state: GameState): { triggered: string[], grid: Tile[], abilities: Record<AbilityType, AbilityState> } => {
    let grid = [...state.grid];
    let triggered: string[] = [];
    let abilities = { ...state.abilities };

    // SCORCH: Burn lowest tile
    if (abilities['SCORCH']?.isUnlocked && abilities['SCORCH'].currentCooldown <= 0) {
        // Find target
        const target = grid.filter(t => t.type === TileType.NORMAL).sort((a,b) => a.value - b.value)[0];
        if (target) {
            grid = grid.filter(t => t.id !== target.id);
            abilities['SCORCH'].currentCooldown = abilities['SCORCH'].cooldown;
            triggered.push('SCORCH');
        }
    }

    // DRAGON_BREATH: Clear Row
    if (abilities['DRAGON_BREATH']?.isUnlocked && abilities['DRAGON_BREATH'].currentCooldown <= 0) {
        const row = Math.floor(rng.next() * state.gridSize);
        grid = grid.filter(t => t.y !== row);
        abilities['DRAGON_BREATH'].currentCooldown = abilities['DRAGON_BREATH'].cooldown;
        triggered.push('DRAGON_BREATH');
    }

    // GOLDEN_EGG: Evolve Tile
    if (abilities['GOLDEN_EGG']?.isUnlocked && abilities['GOLDEN_EGG'].currentCooldown <= 0) {
        const target = rng.choice(grid.filter(t => t.type === TileType.NORMAL));
        if (target) {
            target.value *= 2;
            target.isNew = true;
            abilities['GOLDEN_EGG'].currentCooldown = abilities['GOLDEN_EGG'].cooldown;
            triggered.push('GOLDEN_EGG');
        }
    }

    return { triggered, grid, abilities };
}
