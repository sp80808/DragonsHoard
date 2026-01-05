
import { Direction, GameState, Tile, TileType, MoveResult, ItemType, InventoryItem, Stage, LeaderboardEntry, GameStats, Achievement, HeroClass, CraftingRecipe, DailyModifier, StoryEntry, PlayerProfile, Medal, AbilityType, AbilityState, Difficulty, LootEvent, ShopState, GameMode, RunStats, MergeEvent } from '../types';
import { GRID_SIZE_INITIAL, SHOP_ITEMS, getXpThreshold, getStage, getStageBackground, ACHIEVEMENTS, TILE_STYLES, FALLBACK_STYLE, getItemDefinition, BOSS_DEFINITIONS, SHOP_CONFIG, DAILY_MODIFIERS, STORY_ENTRIES, MEDALS, CLASS_SKILL_TREES, CLASS_ABILITIES } from '../constants';
import { RNG, rng, generateId } from '../utils/rng';
import { audioService } from './audioService'; 
import { claimDailyReward, getPlayerProfile, awardMedal, unlockLore, getNextLevelXp, getLocalHistory } from './storageService';
import { initGauntletState } from './gauntletService';

export { rng };
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
  
  // Default values
  let value = rng.next() < 0.9 ? 2 : 4;
  
  // WARRIOR PASSIVE: Heavy Handed (WAR_2) - 10% chance to spawn Tier 2 (Rat) instead of Tier 1 (Slime)
  // Logic: If we rolled a 2, give it a 10% chance to be a 4.
  if (value === 2 && options && typeof options !== 'number' && options.activeClassSkills?.includes('WAR_2')) {
      if (rng.next() < 0.1) value = 4;
  }

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
  // ROG_4: Lucky Charm
  if (opts.activeClassSkills?.includes('ROG_4')) {
      runeChance *= 1.1;
  }
  // PAL_2: Divine Favor (Implicit in constants logic but implemented here just in case, though PAL_2 is Smite Evil in constants)
  // Checking constants: PAL_2 is Smite Evil (-10% Boss HP). It's PAL_2 in constants.ts.

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
          // Paladin Smite Evil (PAL_2)
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
        
        if (activeSkills?.includes('ROG_2')) priceMult *= 0.9;
        if (activeSkills?.includes('ADV_4')) priceMult *= 0.9;
        if (activeSkills?.includes('WAR_3') && item.category === 'BATTLE') priceMult *= 0.8;
        if (activeSkills?.includes('MAG_4') && item.category === 'CONSUMABLE') priceMult *= 0.8;
        if (activeSkills?.includes('DS_4')) priceMult *= 0.85;

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
  const gauntletState = mode === 'GAUNTLET' ? initGauntletState(heroClass) : undefined;
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

  const activeClassSkills: string[] = profile.classProgress?.[heroClass]?.unlockedNodes || [];
  
  // Apply Start Bonuses from Skill Tree (ROG_5, MAG_5, etc.)
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

  if (activeClassSkills.includes('DS_5')) {
      startGold += 1000;
  }

  let tempState: GameState = {
      grid: [], score: 0, bestScore: 0, xp: 0, level: startLevel, gold: startGold,
      inventory: [], gridSize: GRID_SIZE_INITIAL, gameOver: false, victory: false, gameWon: false,
      combo: 0, logs: [], activeEffects: [], effectCounters: {}, currentStage: initialStage,
      rerolls: 0, stats, runStats, achievements: [], settings: {} as any,
      selectedClass: heroClass, gameMode: mode, difficulty, tilesetId,
      accountLevel: profile.accountLevel, baselineAccountXp: profile.totalAccountXp,
      justLeveledUp: false, shop: { items: {}, turnsUntilRestock: 0 },
      activeModifiers, lootEvents: [], mergeEvents: [], lastTurnMedals: [], abilities: {} as any,
      targetingMode: null, activeClassSkills, gauntlet: gauntletState
  };

  // Execute 'effect' callbacks from skill nodes for initial state setup
  activeClassSkills.forEach(nodeId => {
      const node = CLASS_SKILL_TREES[heroClass]?.find(n => n.id === nodeId);
      if (node && node.effect) {
          const partial = node.effect(tempState);
          if (partial.inventory) inventory = [...inventory, ...partial.inventory];
          if (partial.gold) startGold += partial.gold;
      }
  });
  
  let initialGrid: Tile[] = [];
  if (mode !== 'GAUNTLET') {
      initialGrid = spawnTile([], GRID_SIZE_INITIAL, startLevel, { isClassic: mode === 'CLASSIC', modifiers: activeModifiers, difficulty, activeClassSkills });
      initialGrid = spawnTile(initialGrid, GRID_SIZE_INITIAL, startLevel, { isClassic: mode === 'CLASSIC', modifiers: activeModifiers, difficulty, activeClassSkills });
  }

  // MAG_5: Time Warp - Start with Chronos Rune
  if (activeClassSkills.includes('MAG_5') && mode !== 'GAUNTLET') {
      const empty = getEmptyCells(initialGrid, GRID_SIZE_INITIAL);
      if (empty.length > 0) {
          const {x, y} = empty[0];
          initialGrid.push({
              id: createId(), x, y, value: 0, type: TileType.RUNE_CHRONOS, isNew: true
          });
      }
  }

  const classAbilityDef = CLASS_ABILITIES[heroClass];
  let abilityCooldownReduced = 0;
  if (activeClassSkills.includes('WAR_5')) abilityCooldownReduced = 10;
  if (activeClassSkills.includes('MAG_2')) abilityCooldownReduced = Math.floor(classAbilityDef.cooldown * 0.1);

  const abilities: Record<AbilityType, AbilityState> = {
      'SCORCH': { id: 'SCORCH', isUnlocked: profile.unlockedPowerups?.includes('SCORCH'), charges: 1, maxCharges: 1, cooldown: 30, currentCooldown: 30 },
      'DRAGON_BREATH': { id: 'DRAGON_BREATH', isUnlocked: profile.unlockedPowerups?.includes('DRAGON_BREATH'), charges: 1, maxCharges: 1, cooldown: 60, currentCooldown: 60 },
      'GOLDEN_EGG': { id: 'GOLDEN_EGG', isUnlocked: profile.unlockedPowerups?.includes('GOLDEN_EGG'), charges: 1, maxCharges: 1, cooldown: 50, currentCooldown: 50 },
      'CLASS_ABILITY': { id: 'CLASS_ABILITY', isUnlocked: true, charges: 1, maxCharges: 1, cooldown: Math.max(10, classAbilityDef.cooldown - abilityCooldownReduced), currentCooldown: 0 }
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
    cascadeDelay: 250,
    activeClassSkills,
    gauntlet: gauntletState
  };
};

export const processClassAbilities = (state: GameState): Partial<GameState> => {
    const ability = state.abilities['CLASS_ABILITY'];
    if (!ability || !ability.isUnlocked || ability.currentCooldown > 0) return {};

    const heroClass = state.selectedClass;
    let newGrid = [...state.grid];
    let logs: string[] = [];
    let lootEvents: LootEvent[] = [];
    let triggered = false;

    // Helper counts
    const occupancy = newGrid.filter(t => !t.isDying).length;
    const capacity = state.gridSize * state.gridSize;
    const density = occupancy / capacity;
    const boss = newGrid.find(t => t.type === TileType.BOSS && !t.isDying);

    switch (heroClass) {
        case HeroClass.WARRIOR:
            // Whirlwind: Trigger if grid is crowded (>75%). Clears a random row (excluding boss).
            if (density > 0.75) {
                const row = Math.floor(rng.next() * state.gridSize);
                // Keep boss, kill others in row
                const beforeCount = newGrid.length;
                newGrid = newGrid.filter(t => t.y !== row || t.type === TileType.BOSS);
                
                if (newGrid.length < beforeCount) {
                    logs.push("Whirlwind!");
                    triggered = true;
                }
            }
            break;
        case HeroClass.MAGE:
            // Transmute: Trigger if 3+ low tiles (2s or 4s) exist. Upgrades them.
            const lowTiles = newGrid.filter(t => t.type === TileType.NORMAL && t.value <= 4);
            if (lowTiles.length >= 3) {
                // Shuffle and pick 3
                const targets = rng.shuffle(lowTiles).slice(0, 3);
                targets.forEach(t => { 
                    t.value *= 2; 
                    t.isNew = true; 
                    // Visual feedback: Upgrade effect
                });
                logs.push("Transmute!");
                triggered = true;
            }
            break;
        case HeroClass.ROGUE:
            // Pilfer: Trigger if density > 50% AND luck roll. 
            // Effect: Turns a random tile into Gold OR collects existing gold immediately.
            // Simplified: If not boss, steal it (turn to gold).
            if (density > 0.5) {
                const target = rng.choice(newGrid.filter(t => t.type === TileType.NORMAL));
                if (target) {
                    const goldAmount = target.value * 5 * (state.activeClassSkills.includes('ROG_3') ? 1.2 : 1);
                    // Remove tile
                    newGrid = newGrid.filter(t => t.id !== target.id);
                    lootEvents.push({ id: createId(), x: target.x, y: target.y, type: 'GOLD', value: Math.floor(goldAmount) });
                    logs.push(`Pilfered: +${Math.floor(goldAmount)}G`);
                    triggered = true;
                }
            }
            break;
        case HeroClass.PALADIN:
            // Smite: Trigger immediately if Boss exists.
            if (boss) {
                const dmg = 100;
                boss.health = Math.max(0, (boss.health || 0) - dmg);
                boss.mergedFrom = ['damage']; // Visual flash
                logs.push(`Smite!`);
                triggered = true;
            }
            break;
        case HeroClass.DRAGON_SLAYER:
            // Execute: Trigger if Boss < 35% HP.
            if (boss && boss.health && boss.maxHealth) {
                const threshold = boss.maxHealth * (state.activeClassSkills.includes('DS_5') ? 0.35 : 0.30); // DS_5 might buff threshold? Actually DS_5 is start gold. Let's say DS_2 buffs damage. 
                // Let's stick to base 30%.
                if (boss.health < threshold) {
                    boss.health = 0;
                    boss.mergedFrom = ['damage'];
                    logs.push("EXECUTE!");
                    triggered = true;
                }
            }
            break;
        case HeroClass.ADVENTURER:
            // Second Wind: Trigger if grid crowded (>85%) - Panic Save
            if (density > 0.85) {
                 const target = rng.choice(newGrid.filter(t => t.type === TileType.NORMAL));
                 if (target) {
                     newGrid = newGrid.filter(t => t.id !== target.id);
                     logs.push("Second Wind!");
                     triggered = true;
                 }
            }
            break;
    }

    if (triggered) {
        return {
            grid: newGrid,
            logs,
            lootEvents,
            abilities: {
                ...state.abilities,
                'CLASS_ABILITY': { ...ability, currentCooldown: ability.cooldown }
            }
        };
    }

    return {};
};

export const moveGrid = (
  grid: Tile[],
  direction: Direction,
  size: number,
  mode: GameMode,
  effectCounters: Record<string, number>,
  activeModifiers: DailyModifier[] = [],
  difficulty: Difficulty = 'NORMAL',
  stats?: GameStats
): MoveResult => {
  let score = 0;
  let moved = false;
  let mergedIds: string[] = [];
  let xpGained = 0;
  let goldGained = 0;
  let itemsFound: InventoryItem[] = [];
  let logs: string[] = [];
  let bossDefeated = false;
  let powerUpTriggered: TileType | undefined;
  let lootEvents: LootEvent[] = [];
  let combo = 0;
  let medalsEarned: Medal[] = [];
  let hitstopDuration = 0;

  // Helper vectors
  const vector = { x: 0, y: 0 };
  if (direction === Direction.UP) vector.y = -1;
  if (direction === Direction.RIGHT) vector.x = 1;
  if (direction === Direction.DOWN) vector.y = 1;
  if (direction === Direction.LEFT) vector.x = -1;

  const traversals: { x: number[], y: number[] } = { x: [], y: [] };
  for (let pos = 0; pos < size; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  }
  if (direction === Direction.RIGHT) traversals.x.reverse();
  if (direction === Direction.DOWN) traversals.y.reverse();

  const newGrid: Tile[] = grid.map(t => ({ ...t, mergedFrom: null, isNew: false })); // Clone and reset flags
  const cellContent: (Tile | null)[][] = Array(size).fill(null).map(() => Array(size).fill(null));
  
  newGrid.forEach(tile => {
      if (!tile.isDying) cellContent[tile.x][tile.y] = tile;
  });

  let moves = 0;

  traversals.x.forEach(x => {
    traversals.y.forEach(y => {
      const tile = cellContent[x][y];
      if (tile) {
        // Find furthest position
        let previous = { x, y };
        let next = { x: x + vector.x, y: y + vector.y };
        while (next.x >= 0 && next.x < size && next.y >= 0 && next.y < size && !cellContent[next.x][next.y]) {
            previous = next;
            next = { x: next.x + vector.x, y: next.y + vector.y };
        }

        const nextCell = (next.x >= 0 && next.x < size && next.y >= 0 && next.y < size) ? cellContent[next.x][next.y] : null;
        
        // Detect if the target cell is a Rune/Power-up
        const isRune = nextCell && (nextCell.type === TileType.RUNE_MIDAS || nextCell.type === TileType.RUNE_CHRONOS || nextCell.type === TileType.RUNE_VOID);

        if (nextCell && !nextCell.mergedFrom && nextCell.type === TileType.NORMAL && tile.type === TileType.NORMAL && nextCell.value === tile.value) {
            // MERGE
            const mergedValue = tile.value * 2;
            const mergedTile: Tile = {
                id: createId(),
                x: next.x,
                y: next.y,
                value: mergedValue,
                type: TileType.NORMAL,
                mergedFrom: [tile.id, nextCell.id],
                isNew: true
            };

            // Update Grid State
            cellContent[x][y] = null;
            cellContent[next.x][next.y] = mergedTile;
            
            // Mark old tiles as dying (for animation)
            tile.x = next.x; tile.y = next.y; tile.isDying = true;
            nextCell.isDying = true;
            
            newGrid.push(mergedTile);
            
            score += mergedValue;
            xpGained += mergedValue;
            mergedIds.push(mergedTile.id);
            moved = true;
            combo++;

            if (mergedValue >= 2048) {
                hitstopDuration = 300;
                awardMedal('TILE_2048');
            }

        } else if (nextCell && nextCell.type === TileType.BOSS && tile.type === TileType.NORMAL && tile.value >= 16) {
            // ATTACK BOSS
            let damage = tile.value * 10;
            
            nextCell.health = Math.max(0, (nextCell.health || 0) - damage);
            nextCell.mergedFrom = ['damage'];
            hitstopDuration = 100;
            
            // Tile is consumed
            tile.x = next.x; tile.y = next.y; tile.isDying = true;
            cellContent[x][y] = null;
            
            score += damage;
            xpGained += damage;
            moved = true;
            
            if (nextCell.health <= 0) {
                nextCell.isDying = true;
                cellContent[next.x][next.y] = null; // Boss removed from active
                bossDefeated = true;
                score += 1000;
                xpGained += 2000;
                goldGained += 500;
                lootEvents.push({ id: createId(), x: next.x, y: next.y, type: 'GOLD', value: 500 });
                logs.push("Boss Defeated!");
            } else {
                logs.push(`Boss Hit: ${damage} Dmg`);
            }

        } else if (isRune && tile.type === TileType.NORMAL) {
            // COLLECT RUNE
            // The moving tile collects the rune and moves into its spot.
            if (nextCell!.type === TileType.RUNE_MIDAS) {
                goldGained += 250;
                lootEvents.push({ id: createId(), x: next.x, y: next.y, type: 'GOLD', value: 250 });
            } else if (nextCell!.type === TileType.RUNE_CHRONOS) {
                xpGained += 500;
                lootEvents.push({ id: createId(), x: next.x, y: next.y, type: 'XP', value: 500 });
            } else if (nextCell!.type === TileType.RUNE_VOID) {
                score += 1000;
                // Void consumed
            }
            
            powerUpTriggered = nextCell!.type;
            nextCell!.isDying = true; // Remove the rune
            
            // Move tile to rune's spot
            cellContent[x][y] = null;
            cellContent[next.x][next.y] = tile;
            tile.x = next.x;
            tile.y = next.y;
            moved = true;

        } else {
            // MOVE
            cellContent[x][y] = null;
            cellContent[previous.x][previous.y] = tile;
            tile.x = previous.x;
            tile.y = previous.y;
            if (x !== previous.x || y !== previous.y) {
                moved = true;
            }
        }
      }
    });
  });

  // Calculate Combo Multipliers
  let comboMultiplier = 1;
  if (combo >= 2) comboMultiplier = 1.5;
  if (combo >= 5) comboMultiplier = 2;
  if (combo >= 10) comboMultiplier = 3;

  score = Math.floor(score * comboMultiplier);
  xpGained = Math.floor(xpGained * comboMultiplier);

  // Generate Gold from high merges
  mergedIds.forEach(id => {
      const t = newGrid.find(x => x.id === id);
      if (t && t.value >= 64) {
          const amount = Math.floor(t.value / 2);
          goldGained += amount;
          lootEvents.push({ id: createId(), x: t.x, y: t.y, type: 'GOLD', value: amount });
      }
  });

  const finalGrid = newGrid.filter(t => !t.isDying || t.mergedFrom); // Keep mergedFrom for animation frames, clean up later

  return {
      grid: finalGrid,
      score,
      xpGained,
      goldGained,
      itemsFound,
      moved,
      mergedIds,
      combo,
      comboMultiplier,
      logs,
      powerUpTriggered,
      bossDefeated,
      lootEvents,
      medalsEarned,
      abilitiesTriggered: [],
      hitstopDuration
  };
};

export const isGameOver = (grid: Tile[], size: number): boolean => {
    const activeTiles = grid.filter(t => !t.isDying);
    if (activeTiles.length < size * size) return false;

    // Check for possible merges
    for (let tile of activeTiles) {
        if (tile.type !== TileType.NORMAL) continue;
        const neighbors = [
            activeTiles.find(t => t.x === tile.x + 1 && t.y === tile.y),
            activeTiles.find(t => t.x === tile.x - 1 && t.y === tile.y),
            activeTiles.find(t => t.x === tile.x && t.y === tile.y + 1),
            activeTiles.find(t => t.x === tile.x && t.y === tile.y - 1)
        ];
        
        for (let n of neighbors) {
            if (n && n.type === TileType.NORMAL && n.value === tile.value) return false;
            // Boss attack is a valid move
            if (n && n.type === TileType.BOSS && tile.value >= 16) return false;
            // Runes are now collectable by moving into them, so if a rune is adjacent, it's a valid move
            if (n && (n.type === TileType.RUNE_MIDAS || n.type === TileType.RUNE_CHRONOS || n.type === TileType.RUNE_VOID)) return false;
        }
    }
    return true;
};

export const useInventoryItem = (state: GameState, item: InventoryItem): Partial<GameState> | null => {
    let newGrid = [...state.grid];
    let newGold = state.gold;
    let newXp = state.xp;
    let logs = [...state.logs];
    let used = false;
    let effectCounters = { ...state.effectCounters };

    switch(item.type) {
        case ItemType.XP_POTION:
            newXp += 1000;
            logs.push("Gained 1000 XP");
            used = true;
            break;
        case ItemType.BOMB_SCROLL:
            // Destroy 3 random low tiles
            const targets = newGrid.filter(t => t.type === TileType.NORMAL).sort((a,b) => a.value - b.value).slice(0, 3);
            if (targets.length > 0) {
                newGrid = newGrid.filter(t => !targets.some(target => target.id === t.id));
                logs.push(`Destroyed ${targets.length} tiles`);
                audioService.playBomb();
                used = true;
            }
            break;
        case ItemType.REROLL_TOKEN:
            newGrid = spawnTile(spawnTile([], state.gridSize, state.level), state.gridSize, state.level);
            logs.push("Board Rerolled");
            audioService.playZap(1);
            used = true;
            break;
        case ItemType.CHAIN_CATALYST:
            effectCounters['CHAIN_CATALYST'] = 10;
            logs.push("Cascade Enabled (10 Turns)");
            used = true;
            break;
        case ItemType.GOLDEN_RUNE:
            // Force spawn next
            // Handled in spawnTile usually, but we can just spawn one now if space
            const empty = getEmptyCells(newGrid, state.gridSize);
            if (empty.length > 0) {
                const {x,y} = empty[0];
                newGrid.push({ id: createId(), x, y, value: 0, type: TileType.RUNE_MIDAS, isNew: true });
                logs.push("Golden Rune Spawned");
                used = true;
            } else {
                logs.push("No space!");
            }
            break;
        case ItemType.MIDAS_POTION:
            effectCounters['MIDAS_POTION'] = 50;
            logs.push("Double Gold (50 Turns)");
            used = true;
            break;
        case ItemType.SIEGE_BREAKER:
            effectCounters['SIEGE_BREAKER'] = 1; // Next hit
            logs.push("Next Boss Hit Buffed");
            used = true;
            break;
        // Add other items logic here...
        default:
            logs.push("Item has no effect yet.");
            break;
    }

    if (used) {
        const newInventory = [...state.inventory];
        const idx = newInventory.indexOf(item);
        if (idx > -1) newInventory.splice(idx, 1);
        
        return {
            grid: newGrid,
            xp: newXp,
            gold: newGold,
            inventory: newInventory,
            logs,
            effectCounters
        };
    }
    return null;
};

export const executeAutoCascade = (grid: Tile[], size: number, step: number, effectCounters: Record<string, number>): { occurred: boolean, grid: Tile[], type: 'MERGE' | 'SPAWN', lootEvents: LootEvent[], mergeEvents: MergeEvent[], rewards: { xp: number, gold: number } } => {
    // For MVP, just return false to disable cascade temporarily or implement minimal gravity
    return { occurred: false, grid, type: 'SPAWN', lootEvents: [], mergeEvents: [], rewards: { xp: 0, gold: 0 } };
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

export const checkLoreUnlocks = (state: GameState) => {
    // Check for monster kills or level thresholds to unlock lore
    // This is handled via storageService usually
};

export const executePowerupAction = (state: GameState, tileId: string, row?: number) => {
    // Handle clicking a tile (e.g., Rune activation)
    const tile = state.grid.find(t => t.id === tileId);
    if (!tile) return null;

    if (tile.type === TileType.RUNE_MIDAS) {
        // Collect Gold
        const amount = 100 * state.level;
        return {
            gold: state.gold + amount,
            grid: state.grid.filter(t => t.id !== tileId),
            logs: [...state.logs, `Rune: +${amount} Gold`]
        };
    }
    // Other runes...
    return null;
};

export const updateCooldowns = (state: GameState): GameState => {
    return state; // Reducer handles this
};

export const saveHighscore = (score: number) => {
    // Managed by storageService
};

export const getHighscores = (): LeaderboardEntry[] => {
    return getLocalHistory();
};

export const clearSaveData = () => {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
    localStorage.removeItem(LEADERBOARD_KEY);
    window.location.reload();
};

export const processPassiveAbilities = (state: GameState) => {
    // Handle periodic effects like "Scorch"
    return { grid: state.grid, abilities: state.abilities, triggered: [] };
};

export const generateFallbackStory = (state: GameState): string => {
    return `Here lies a hero who merged ${state.stats.totalMerges} times and reached level ${state.level}. Their greed for gold was their end.`;
};
