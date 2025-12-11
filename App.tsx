
import React, { useEffect, useReducer, useRef, useState } from 'react';
import { Grid } from './components/Grid';
import { HUD } from './components/HUD';
import { Store } from './components/Store';
import { SplashScreen } from './components/SplashScreen';
import { Leaderboard } from './components/Leaderboard';
import { Settings } from './components/Settings';
import { RunSummary } from './components/RunSummary';
import { TutorialOverlay } from './components/TutorialOverlay';
import { HelpScreen } from './components/HelpScreen';
import { GameStatsModal } from './components/GameStatsModal';
import { AmbientBackground } from './components/AmbientBackground';
import { Direction, GameState, TileType, InventoryItem, FloatingText, CraftingRecipe, View, Achievement, ItemType, InputSettings, HeroClass, GameMode, PlayerProfile } from './types';
import { initializeGame, moveGrid, spawnTile, isGameOver, checkLoot, useInventoryItem, applyMidasTouch, applyChronosShift, applyVoidSingularity, tryAutoMerge, checkAchievements, savePersistentAchievements, executeAutoCascade } from './services/gameLogic';
import { SHOP_ITEMS, getXpThreshold, getStage, getStageBackground, getItemDefinition, TILE_STYLES, SHOP_CONFIG } from './constants';
import { audioService } from './services/audioService';
import { loadCriticalAssets, loadBackgroundAssets } from './services/assetLoader';
import { getPlayerProfile, completeTutorial } from './services/storageService';
import { Trophy, Star, Skull, Zap, Info, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, useAnimation } from 'framer-motion';

// Actions
type Action = 
  | { type: 'MOVE'; direction: Direction }
  | { type: 'RESTART'; selectedClass?: HeroClass; mode?: GameMode }
  | { type: 'CONTINUE' }
  | { type: 'LOAD_GAME'; state: GameState }
  | { type: 'BUY_ITEM'; item: typeof SHOP_ITEMS[0] }
  | { type: 'CRAFT_ITEM'; recipe: CraftingRecipe }
  | { type: 'USE_ITEM'; item: InventoryItem }
  | { type: 'CLEAR_LOGS' }
  | { type: 'TRIGGER_POWERUP_EFFECT'; effect: string }
  | { type: 'APPLY_POWERUP_RESULT'; resultState: Partial<GameState> }
  | { type: 'REROLL' }
  | { type: 'GAME_OVER_ACK' }
  | { type: 'UNLOCK_ACHIEVEMENT'; achievement: Achievement }
  | { type: 'UPDATE_SETTINGS'; settings: InputSettings }
  | { type: 'CASCADE_STEP'; payload: { grid: any[], rewards: { xp: number, gold: number } } }
  | { type: 'CASCADE_COMPLETE' }
  | { type: 'ADVANCE_TUTORIAL' }
  | { type: 'ACK_LEVEL_UP' };

const reducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'RESTART':
      return initializeGame(true, action.selectedClass || HeroClass.ADVENTURER, action.mode || 'RPG'); 
      
    case 'LOAD_GAME':
      return action.state;

    case 'CONTINUE':
      return { ...state, victory: false, gameWon: true };
    
    case 'GAME_OVER_ACK':
        return state;

    case 'CLEAR_LOGS':
        return { ...state, logs: [] };
    
    case 'ACK_LEVEL_UP':
        return { ...state, justLeveledUp: false, unlockedPerk: undefined };

    case 'UPDATE_SETTINGS': {
        const newState = { ...state, settings: action.settings };
        localStorage.setItem('2048_rpg_state_v3', JSON.stringify(newState));
        return newState;
    }

    case 'UNLOCK_ACHIEVEMENT':
        const newAchievements = [...state.achievements, action.achievement.id];
        savePersistentAchievements(newAchievements); 
        return {
            ...state,
            achievements: newAchievements,
            gold: state.gold + (action.achievement.reward?.gold || 0),
            xp: state.xp + (action.achievement.reward?.xp || 0),
            logs: [...state.logs, `ACHIEVEMENT UNLOCKED: ${action.achievement.name}`]
        };

    case 'BUY_ITEM': {
      const shopState = state.shop || { items: {}, turnsUntilRestock: 50 };
      // Fallback for missing shop item state
      const itemState = shopState.items[action.item.id] || { stock: 1, priceMultiplier: 1.0 };
      const currentPrice = Math.floor(action.item.price * itemState.priceMultiplier);

      if (state.gold < currentPrice) return { ...state, logs: [...state.logs, "Not enough gold!"] };
      if (itemState.stock <= 0) return { ...state, logs: [...state.logs, "Item sold out!"] };
      if (state.inventory.length >= 3) return { ...state, logs: [...state.logs, "Inventory Full!"] };
      
      const newItem: InventoryItem = {
          id: Math.random().toString(36),
          type: action.item.id,
          name: action.item.name,
          description: action.item.desc,
          icon: action.item.icon
      };

      // Update Shop State (Reduce stock, Increase Inflation)
      const newShopState = { ...shopState, items: { ...shopState.items } };
      newShopState.items[action.item.id] = {
          stock: itemState.stock - 1,
          priceMultiplier: itemState.priceMultiplier + (SHOP_CONFIG.INFLATION_RATE || 0.15)
      };

      const newState = {
          ...state,
          gold: state.gold - currentPrice,
          inventory: [...state.inventory, newItem],
          shop: newShopState,
          logs: [...state.logs, `Bought ${action.item.name} for ${currentPrice}G`]
      };
      
      localStorage.setItem('2048_rpg_state_v3', JSON.stringify(newState));
      return newState;
    }

    case 'CRAFT_ITEM': {
        const { recipe } = action;
        if (state.gold < recipe.goldCost) return state;

        let newInventory = [...state.inventory];
        let missing = false;
        
        for (const ing of recipe.ingredients) {
            let needed = ing.count;
            newInventory = newInventory.filter(item => {
                if (item.type === ing.type && needed > 0) {
                    needed--;
                    return false; 
                }
                return true;
            });
            if (needed > 0) missing = true;
        }

        if (missing) return { ...state, logs: [...state.logs, "Missing ingredients!"] };

        const def = getItemDefinition(recipe.resultId);
        const newItem: InventoryItem = {
            id: Math.random().toString(36),
            type: recipe.resultId,
            name: def.name,
            description: def.desc,
            icon: def.icon
        };

        const newState = {
            ...state,
            gold: state.gold - recipe.goldCost,
            inventory: [...newInventory, newItem],
            logs: [...state.logs, `Crafted ${def.name}!`]
        };
        
        localStorage.setItem('2048_rpg_state_v3', JSON.stringify(newState));
        return newState;
    }

    case 'USE_ITEM': {
        const result = useInventoryItem(state, action.item);
        if (!result) return state;
        
        const updatedRunStats = {
            ...state.runStats,
            powerUpsUsed: state.runStats.powerUpsUsed + 1
        };

        const newState = { ...state, ...result, runStats: updatedRunStats };
        localStorage.setItem('2048_rpg_state_v3', JSON.stringify(newState));
        return newState as GameState;
    }

    case 'TRIGGER_POWERUP_EFFECT':
        return { ...state, powerUpEffect: action.effect };

    case 'APPLY_POWERUP_RESULT':
        const nextState = { ...state, ...action.resultState, powerUpEffect: undefined };
        localStorage.setItem('2048_rpg_state_v3', JSON.stringify(nextState));
        return nextState as GameState;

    case 'REROLL': {
        if (state.level < 15) return state;
        
        let cost = 0;
        let newRerolls = state.rerolls;
        
        if (state.rerolls > 0) {
            newRerolls = state.rerolls - 1;
        } else {
            if (state.gold < 50) return { ...state, logs: [...state.logs, "Not enough Gold!"] };
            cost = 50;
        }

        if (!state.lastSpawnedTileId) return { ...state, logs: [...state.logs, "Nothing to reroll!"] };

        const gridWithoutLast = state.grid.filter(t => t.id !== state.lastSpawnedTileId);
        if (gridWithoutLast.length === state.grid.length) return state;

        const rerolledGrid = spawnTile(gridWithoutLast, state.gridSize, state.level, { isClassic: state.gameMode === 'CLASSIC' });
        const newTile = rerolledGrid.find(t => !gridWithoutLast.includes(t));

        audioService.playMove();

        return {
            ...state,
            grid: rerolledGrid,
            gold: state.gold - cost,
            rerolls: newRerolls,
            lastSpawnedTileId: newTile?.id,
            logs: [...state.logs, "Fate Rerolled..."]
        };
    }

    case 'MOVE': {
      if (state.gameOver || (state.victory && !state.gameWon) || state.powerUpEffect || state.isCascading) return state;

      const { grid: movedGrid, score, xpGained, goldGained, itemsFound, moved, mergedIds, powerUpTriggered, combo, comboMultiplier, logs: moveLogs, bossDefeated } = moveGrid(state.grid, action.direction, state.gridSize, state.gameMode, state.effectCounters);

      if (!moved) return state;

      audioService.playMove();

      let newGrid = movedGrid;
      let newScore = state.score + score;
      let newXp = state.xp + (xpGained * (state.level >= 7 ? 1.5 : 1));
      let newGold = state.gold + goldGained;
      let newLevel = state.level;
      let newLogs = [...state.logs, ...moveLogs];
      let newGridSize = state.gridSize;
      let newInventory = [...state.inventory];
      let currentStage = state.currentStage;
      let newEffectCounters = { ...state.effectCounters };
      let activeEffects = state.activeEffects || [];
      let nextPowerUpEffect = undefined;
      let newRerolls = state.rerolls;
      
      // Shop State Logic
      let newShopState = state.shop ? { ...state.shop, items: { ...state.shop.items } } : { items: {}, turnsUntilRestock: 50 };
      newShopState.turnsUntilRestock = Math.max(0, newShopState.turnsUntilRestock - 1);
      
      // Restock Trigger: Timer hit 0 OR Boss Defeated
      if (newShopState.turnsUntilRestock === 0 || bossDefeated) {
          newLogs.push("Merchant Restocked!");
          newShopState.turnsUntilRestock = SHOP_CONFIG.RESTOCK_INTERVAL;
          
          // Reset Stock & Calm Inflation slightly
          SHOP_ITEMS.forEach(item => {
               const currentState = newShopState.items[item.id] || { stock: 0, priceMultiplier: 1.0 };
               const cat = item.category as keyof typeof SHOP_CONFIG.STOCK_LIMITS;
               const maxStock = SHOP_CONFIG.STOCK_LIMITS[cat] || 3;
               
               newShopState.items[item.id] = {
                   stock: maxStock,
                   // Decay inflation by 0.1 (market correction), but keep it above 1.0
                   priceMultiplier: Math.max(1.0, currentState.priceMultiplier - 0.1)
               };
          });
      }

      // Stats Update
      let newStats = { ...state.stats };
      newStats.totalMoves++;
      if (score > 0) newStats.totalMerges += mergedIds.length;
      if (combo > newStats.highestCombo) newStats.highestCombo = combo;
      newStats.goldCollected += goldGained;
      
      const maxTile = Math.max(...newGrid.map(t => t.value));
      if (maxTile > newStats.highestTile) newStats.highestTile = maxTile;

      let newRunStats = { 
          ...state.runStats,
          turnCount: newStats.totalMoves,
          goldEarned: newStats.goldCollected,
          highestTile: newStats.highestTile,
          highestMonster: TILE_STYLES[newStats.highestTile]?.label || 'Monster',
          mergesCount: state.runStats.mergesCount + mergedIds.length
      };
      
      if (bossDefeated) {
          newRunStats.bossesDefeated += 1;
          newStats.bossesDefeated += 1;
      }

      const mergedTiles = newGrid.filter(t => mergedIds.includes(t.id));
      mergedTiles.forEach(t => {
          if (t.value === 4) newStats.slimesMerged += 1;
          if (t.value === 128) {
              newEffectCounters['DEMON_CURSE'] = 1;
              newLogs.push("Demon Curse! Next spawn dangerous.");
          }
      });

      // Updated Audio Call to include combo
      if (score > 0) audioService.playMerge(score, combo);

      // Decrement Effect Counters
      ['LUCKY_LOOT', 'CHAIN_CATALYST', 'LUCKY_DICE', 'MIDAS_POTION', 'VOID_STONE', 'RADIANT_AURA', 'FLOW_STATE', 'HARMONIC_RESONANCE'].forEach(effect => {
           if (newEffectCounters[effect] > 0) {
               newEffectCounters[effect]--;
               if (newEffectCounters[effect] === 0) newLogs.push(`${effect.replace('_', ' ')} expired.`);
           }
      });

      if (state.gameMode !== 'CLASSIC' && Math.random() < 0.005) { 
          const eventRoll = Math.random();
          if (eventRoll < 0.6) {
             newEffectCounters['MIDAS_POTION'] = (newEffectCounters['MIDAS_POTION'] || 0) + 10;
             newLogs.push("EVENT: Gold Rush! 2x Gold (10 turns)");
          } else {
             newRerolls += 3;
             newLogs.push("EVENT: Mana Storm! +3 Free Rerolls");
          }
      }

      if (itemsFound && itemsFound.length > 0) {
          itemsFound.forEach(item => {
              if (newInventory.length < 3) {
                  newInventory.push(item);
                  newLogs.push(`Looted: ${item.name}!`);
              } else {
                  const fallbackGold = 50;
                  newGold += fallbackGold;
                  newLogs.push(`Bag Full! Converted ${item.name} to ${fallbackGold}G`);
              }
          });
      }

      const hasLuckyCharm = (newEffectCounters['LUCKY_LOOT'] || 0) > 0;
      const loot = checkLoot(state.level, mergedIds, hasLuckyCharm, state.gameMode === 'CLASSIC');
      if (loot) {
        newLogs.push(loot.message);
        if (loot.gold) newGold += loot.gold;
        if (loot.item) {
             if (newInventory.length < 3) newInventory.push(loot.item);
             else newLogs.push("Inventory full! Item lost.");
        }
      }

      let justLeveledUp = false;
      let unlockedPerk = undefined;

      if (state.gameMode !== 'CLASSIC') {
        let threshold = getXpThreshold(newLevel);
        while (newXp >= threshold) {
            newXp -= threshold;
            newLevel++;
            newLogs.push(`LEVEL UP! You are now level ${newLevel}!`);
            audioService.playLevelUp();
            justLeveledUp = true;
            
            if (newLevel % 5 === 0 && newGridSize < 8) {
                newGridSize++;
                newLogs.push(`Grid Expanded to ${newGridSize}x${newGridSize}!`);
                unlockedPerk = "GRID EXPANDED!";
            }
            if (newLevel === 15) {
                newLogs.push("Reroll Unlocked!");
                unlockedPerk = "REROLL UNLOCKED!";
            }

            const stageConfig = getStage(newLevel);
            if (stageConfig.name !== currentStage.name) {
                currentStage = {
                    name: stageConfig.name,
                    minLevel: stageConfig.minLevel,
                    backgroundUrl: getStageBackground(stageConfig.name),
                    colorTheme: stageConfig.colorTheme,
                    barColor: stageConfig.barColor,
                    themeId: stageConfig.themeId
                };
                newLogs.push(`ENTERING STAGE: ${currentStage.name}`);
            }
            newRunStats.stageReached = currentStage.name;
            threshold = getXpThreshold(newLevel);
        }
      }

      let forcedValue;
      let forcedType;
      
      const existingBoss = newGrid.find(t => t.type === TileType.BOSS);
      if (newLevel > 0 && newLevel % 5 === 0 && !existingBoss && Math.random() < 0.1 && state.gameMode !== 'CLASSIC') {
          forcedType = TileType.BOSS;
          newLogs.push("WARNING: A BOSS APPEARED!");
      } else if (activeEffects.includes('GOLDEN_SPAWN')) {
          forcedValue = 16;
          newLogs.push("Rune activated! High tier spawn!");
          activeEffects = activeEffects.filter(e => e !== 'GOLDEN_SPAWN');
      } else if ((newEffectCounters['ASCENDANT_SPAWN'] || 0) > 0) {
          forcedValue = 32;
          newEffectCounters['ASCENDANT_SPAWN']--;
          if (newEffectCounters['ASCENDANT_SPAWN'] === 0) newLogs.push("Ascendant effect expired.");
      } else if ((newEffectCounters['DEMON_CURSE'] || 0) > 0) {
          forcedValue = 2; 
          forcedType = TileType.BOMB;
          newEffectCounters['DEMON_CURSE'] = 0;
          newLogs.push("The curse manifests!");
      }
      
      const diceBonus = (newEffectCounters['LUCKY_DICE'] || 0) > 0 ? 0.05 : 0;

      let finalGrid = spawnTile(newGrid, newGridSize, newLevel, { 
          forcedValue, 
          type: forcedType, 
          bossLevel: Math.floor(newLevel / 5),
          isClassic: state.gameMode === 'CLASSIC',
          powerUpChanceBonus: diceBonus
      });
      const lastSpawned = finalGrid.find(t => !newGrid.includes(t));

      if (newLevel >= 20 && state.gameMode !== 'CLASSIC') {
          const autoMerge = tryAutoMerge(finalGrid);
          if (autoMerge.success) {
              finalGrid = autoMerge.grid;
              newScore += autoMerge.value;
              newLogs.push("Auto-Merge Perk Activated!");
          }
      }

      if (powerUpTriggered) {
          newRunStats.powerUpsUsed += 1;
          if (powerUpTriggered === TileType.RUNE_MIDAS) nextPowerUpEffect = 'MIDAS';
          if (powerUpTriggered === TileType.RUNE_CHRONOS) nextPowerUpEffect = 'CHRONOS';
          if (powerUpTriggered === TileType.RUNE_VOID) nextPowerUpEffect = 'VOID';
          if (powerUpTriggered === TileType.BOMB) {
              audioService.playBomb();
              newLogs.push("BOMB DETONATED!");
              const sorted = finalGrid.filter(t => t.type !== TileType.BOSS).sort((a, b) => a.value - b.value);
              const toKill = sorted.slice(0, 3).map(t => t.id);
              finalGrid = finalGrid.filter(t => !toKill.includes(t.id));
          }
      }

      const gameOver = isGameOver(finalGrid, newGridSize);
      const victory = !state.gameWon && finalGrid.some(t => t.value === 2048);
      const isChainActive = (newEffectCounters['CHAIN_CATALYST'] || 0) > 0;
      // UNLOCK CASCADES AT LEVEL 5 (Confirmed)
      const canCascade = (state.accountLevel >= 5 || isChainActive) && state.gameMode !== 'CLASSIC';

      const nextState: GameState = {
        ...state,
        grid: finalGrid,
        score: newScore,
        bestScore: Math.max(state.bestScore, newScore),
        xp: newXp,
        level: newLevel,
        gold: newGold,
        inventory: newInventory,
        gridSize: newGridSize,
        gameOver,
        victory,
        logs: newLogs.slice(-4), 
        activeEffects,
        effectCounters: newEffectCounters,
        currentStage,
        powerUpEffect: nextPowerUpEffect,
        lastSpawnedTileId: lastSpawned?.id,
        rerolls: newRerolls,
        stats: newStats,
        runStats: newRunStats,
        gameWon: state.gameWon || victory,
        isCascading: canCascade, 
        cascadeStep: 0,
        justLeveledUp: state.justLeveledUp || justLeveledUp,
        unlockedPerk: unlockedPerk || state.unlockedPerk,
        shop: newShopState
      };

      localStorage.setItem('2048_rpg_state_v3', JSON.stringify(nextState));
      return nextState;
    }

    case 'CASCADE_STEP': {
        const { grid, rewards } = action.payload;
        const newStep = (state.cascadeStep || 0) + 1;
        
        audioService.playCascade(newStep);

        const updatedRunStats = {
            ...state.runStats,
            cascadesTriggered: state.runStats.cascadesTriggered + 1,
            goldEarned: state.runStats.goldEarned + rewards.gold
        };

        // Determine logs based on multipliers
        let multiplier = Math.pow(1.1, newStep).toFixed(1);
        if (state.effectCounters['FLOW_STATE'] > 0) {
             multiplier = Math.pow(1.1 + (0.5 * 0.2), newStep).toFixed(1); // Approximation for display
        }

        return {
            ...state,
            grid,
            xp: state.xp + rewards.xp,
            gold: state.gold + rewards.gold,
            cascadeStep: newStep,
            runStats: updatedRunStats,
            logs: [...state.logs, `Cascade x${newStep}! (${multiplier}x)`].slice(-4),
            isCascading: true 
        };
    }

    case 'CASCADE_COMPLETE': {
        return {
            ...state,
            isCascading: false,
            cascadeStep: 0
        };
    }

    default:
      return state;
  }
};

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, null, () => initializeGame());
  const [view, setView] = useState<View>('SPLASH');
  const [showStore, setShowStore] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<{type: 'BOSS' | 'LEVEL_UP' | 'STAGE', text: string} | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Shake State
  const [shakeIntensity, setShakeIntensity] = useState(0); // 0, 1, 2, 3
  
  // Track merge locations for particles
  const [mergeEvents, setMergeEvents] = useState<{ id: string, x: number, y: number, value: number, type: string }[]>([]);
  
  // Loot Visual Events
  const [lootEvents, setLootEvents] = useState<{ id: string, x: number, y: number, type: 'GOLD' | 'ITEM', value?: string | number, icon?: string }[]>([]);
  const prevGold = useRef(state.gold);
  const prevInvCount = useRef(state.inventory.length);

  // Background Parallax Controls
  const bgControls = useAnimation();
  const prevMerges = useRef(state.runStats.mergesCount);

  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showBossTutorial, setShowBossTutorial] = useState(false);

  // Asset Loading
  useEffect(() => {
      const load = async () => {
          // 1. Load critical assets (images + splash music + 1st gameplay track)
          // Pass the current stage's themeId to ensure its specific assets are loaded immediately
          await loadCriticalAssets((p) => setLoadingProgress(p), state.currentStage.themeId);
          setIsLoading(false);
          audioService.playSplashTheme();
          
          // 2. Trigger background loading for remaining 7 gameplay tracks + death music + ALL THEME ASSETS
          // We do not await this, it happens while user plays
          loadBackgroundAssets();
      };
      load();
  }, []);
  
  // Audio State Management
  useEffect(() => {
      if (view === 'GAME' && !state.gameOver) {
          audioService.playGameplayTheme();
      } else if (state.gameOver) {
          audioService.playDeathTheme();
      } else if (view === 'SPLASH') {
          audioService.playSplashTheme();
      }
  }, [view, state.gameOver]);

  // Audio Intensity Update
  useEffect(() => {
      if (view === 'GAME') {
          // Calculate intensity: grid fullness + high combos
          const fillRatio = state.grid.length / (state.gridSize * state.gridSize);
          const comboFactor = Math.min(1, (state.combo || 0) / 10);
          const intensity = Math.min(1, fillRatio * 0.5 + comboFactor * 0.5);
          audioService.updateGameplayIntensity(intensity);
      }
  }, [state.grid, state.combo, view]);

  // Dynamic Background Parallax Trigger - Disable in Low Perf Mode
  useEffect(() => {
      if (state.settings.lowPerformanceMode) return;

      if (state.runStats.mergesCount > prevMerges.current) {
          // Trigger physics jolt
          const randomX = (Math.random() - 0.5) * 10;
          const randomY = (Math.random() - 0.5) * 10;
          
          bgControls.start({
              scale: [1.1, 1.15, 1.1], // Push back/deep
              x: [0, randomX, 0],
              y: [0, randomY, 0],
              transition: { 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 15,
                  mass: 0.5
              }
          });
      }
      prevMerges.current = state.runStats.mergesCount;
  }, [state.runStats.mergesCount, bgControls, state.settings.lowPerformanceMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.shiftKey && e.key === '|') {
            setShowDebug(prev => !prev);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
      const profile = getPlayerProfile();
      if (!profile.tutorialCompleted && view === 'GAME') {
          setShowTutorial(true);
      }
  }, [view]);

  useEffect(() => {
    if (state.logs.length === 0) return;
    const lastLog = state.logs[state.logs.length - 1];

    if (lastLog.includes("WARNING: A BOSS APPEARED!")) {
        setActiveOverlay({ type: 'BOSS', text: 'BOSS APPROACHES' });
        audioService.playBossSpawn();
        setShakeIntensity(3);
        
        // Trigger Boss Tutorial if needed
        const profile = getPlayerProfile();
        // Check local state so we don't spam it during current session before profile updates
        if (!profile.bossTutorialCompleted) {
            setTimeout(() => setShowBossTutorial(true), 2000);
        }

        setTimeout(() => { setActiveOverlay(null); setShakeIntensity(0); }, 2500);
    } 
    else if (lastLog.includes("ENTERING STAGE:")) {
        const stageName = lastLog.replace("ENTERING STAGE: ", "");
        setActiveOverlay({ type: 'STAGE', text: stageName });
        audioService.playStageTransition();
        setTimeout(() => setActiveOverlay(null), 3000);
    }
  }, [state.logs]);

  useEffect(() => {
      if (state.justLeveledUp) {
          setActiveOverlay({ type: 'LEVEL_UP', text: state.unlockedPerk || 'LEVEL UP!' });
          audioService.playLevelUp();
          
          // Auto-close failsafe after 3s (slightly longer to allow reading if idle)
          const timer = setTimeout(() => {
              setActiveOverlay(null);
              dispatch({ type: 'ACK_LEVEL_UP' });
          }, 3000);
          return () => clearTimeout(timer);
      }
  }, [state.justLeveledUp, state.unlockedPerk]);

  // Tutorial Step Logic
  useEffect(() => {
      if (!showTutorial) return;
      
      // Step 0 -> 1: Triggered by user successfully moving (stats.totalMoves increments)
      if (tutorialStep === 0 && state.stats.totalMoves > 0) {
          setTutorialStep(1);
      }
      
      // Auto-close failsafe if user somehow progresses deep into game
      if (state.stats.totalMoves >= 10) {
          completeTutorial();
          setShowTutorial(false);
      }
  }, [state.stats.totalMoves, showTutorial, tutorialStep]);

  // Boss Tutorial Dismiss Logic
  const handleBossTutorialDismiss = () => {
      setShowBossTutorial(false);
      const profile = getPlayerProfile();
      profile.bossTutorialCompleted = true;
      localStorage.setItem('dragons_hoard_profile', JSON.stringify(profile));
  };

  const advanceTutorial = () => {
      if (tutorialStep === 1) {
          setTutorialStep(2);
      } else if (tutorialStep >= 2) {
          completeTutorial();
          setShowTutorial(false);
      }
  };

  useEffect(() => {
      if (state.powerUpEffect) {
          setTimeout(() => {
            let resultState: Partial<GameState> = {};
            if (state.powerUpEffect === 'MIDAS') {
                const res = applyMidasTouch(state.grid);
                resultState = { grid: res.grid, score: state.score + res.score, logs: [...state.logs, `Midas: +${res.score} pts!`] };
            } else if (state.powerUpEffect === 'CHRONOS') {
                const newGrid = applyChronosShift(state.grid, state.gridSize);
                resultState = { grid: newGrid, logs: [...state.logs, "Time Shifted!"] };
            } else if (state.powerUpEffect === 'VOID') {
                const res = applyVoidSingularity(state.grid, state.gridSize);
                resultState = { grid: res.grid, score: state.score + res.score, logs: [...state.logs, "Void consumed board!"] };
            }
            dispatch({ type: 'APPLY_POWERUP_RESULT', resultState });
          }, 600); 
      }
  }, [state.powerUpEffect]);

  useEffect(() => {
      if (state.isCascading) {
          // SPEED UP: Reduced from 300 to 120ms
          const timer = setTimeout(() => {
              if ((state.cascadeStep || 0) >= 8) {
                  dispatch({ type: 'CASCADE_COMPLETE' });
                  return;
              }
              const result = executeAutoCascade(state.grid, state.gridSize, (state.cascadeStep || 0) + 1, state.effectCounters);
              if (result.occurred) {
                  dispatch({ type: 'CASCADE_STEP', payload: result });
                  setShakeIntensity(1);
                  setTimeout(() => setShakeIntensity(0), 100); // Shorter shake
              } else {
                  dispatch({ type: 'CASCADE_COMPLETE' });
              }
          }, 120);
          return () => clearTimeout(timer);
      }
  }, [state.isCascading, state.grid, state.cascadeStep, state.gridSize, state.effectCounters]);

  useEffect(() => {
      const unlocked = checkAchievements(state);
      unlocked.forEach(ach => {
          dispatch({ type: 'UNLOCK_ACHIEVEMENT', achievement: ach });
      });
  }, [state.stats]);

  useEffect(() => {
    if (!state.settings.enableKeyboard) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Boss Tutorial Blocking
      if (showBossTutorial) {
          e.preventDefault();
          handleBossTutorialDismiss();
          return;
      }

      // 2. Main Tutorial Blocking (Step 1+)
      if (showTutorial && tutorialStep > 0) {
          e.preventDefault();
          if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'Enter', ' '].includes(e.key)) {
              advanceTutorial();
          }
          return;
      }

      // 3. Level Up Dismissal (New Feature)
      if (activeOverlay?.type === 'LEVEL_UP') {
          // Allow any movement key to dismiss immediately and proceed
          setActiveOverlay(null);
          dispatch({ type: 'ACK_LEVEL_UP' });
          // Note: We don't return here, so the key press ALSO moves the grid (eats the first swipe but applies move)
          // or we can return to block the move. "Close quicker" implies fluidity. Let's process the move.
      }

      if (view !== 'GAME' || showStore || state.gameOver || state.isCascading) return;
      
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': e.preventDefault(); dispatch({ type: 'MOVE', direction: Direction.UP }); break;
        case 'ArrowDown': case 's': case 'S': e.preventDefault(); dispatch({ type: 'MOVE', direction: Direction.DOWN }); break;
        case 'ArrowLeft': case 'a': case 'A': e.preventDefault(); dispatch({ type: 'MOVE', direction: Direction.LEFT }); break;
        case 'ArrowRight': case 'd': case 'D': e.preventDefault(); dispatch({ type: 'MOVE', direction: Direction.RIGHT }); break;
        case '1': if (state.inventory[0]) dispatch({ type: 'USE_ITEM', item: state.inventory[0] }); break;
        case '2': if (state.inventory[1]) dispatch({ type: 'USE_ITEM', item: state.inventory[1] }); break;
        case '3': if (state.inventory[2]) dispatch({ type: 'USE_ITEM', item: state.inventory[2] }); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.settings.enableKeyboard, view, showStore, state.gameOver, state.isCascading, state.inventory, showBossTutorial, showTutorial, tutorialStep, activeOverlay]);

  const touchStart = useRef<{x: number, y: number} | null>(null);

  useEffect(() => {
      if (!state.settings.enableSwipe) return;
      const handleStart = (x: number, y: number) => {
          // Block regular touch start actions if tutorials are active?
          // We allow touch start, but handleEnd decides logic
          if (view !== 'GAME' || showStore || state.gameOver || state.isCascading) return;
          touchStart.current = { x, y };
      };
      const handleEnd = (x: number, y: number) => {
          // 1. Boss Tutorial
          if (showBossTutorial) {
              handleBossTutorialDismiss();
              touchStart.current = null;
              return;
          }

          // 2. Main Tutorial (Step 1+)
          if (showTutorial && tutorialStep > 0) {
              advanceTutorial();
              touchStart.current = null;
              return;
          }

          // 3. Level Up Dismissal
          if (activeOverlay?.type === 'LEVEL_UP') {
              setActiveOverlay(null);
              dispatch({ type: 'ACK_LEVEL_UP' });
              // Continue to process swipe
          }

          if (!touchStart.current || view !== 'GAME' || showStore || state.gameOver || state.isCascading) return;
          const deltaX = x - touchStart.current.x;
          const deltaY = y - touchStart.current.y;
          const absX = Math.abs(deltaX);
          const absY = Math.abs(deltaY);
          // Slightly more sensitive for tutorial progression if we wanted, but let's keep consistency
          const threshold = 90 - (state.settings.sensitivity * 7); 

          if (Math.max(absX, absY) > threshold) {
              // Valid Swipe Logic
              let dir: Direction | null = null;
              if (absX > absY) dir = deltaX > 0 ? Direction.RIGHT : Direction.LEFT;
              else dir = deltaY > 0 ? Direction.DOWN : Direction.UP;

              if (dir) {
                  if (state.settings.invertSwipe) {
                      if (dir === Direction.UP) dir = Direction.DOWN;
                      else if (dir === Direction.DOWN) dir = Direction.UP;
                      else if (dir === Direction.LEFT) dir = Direction.RIGHT;
                      else if (dir === Direction.RIGHT) dir = Direction.LEFT;
                  }
                  dispatch({ type: 'MOVE', direction: dir });
              }
          }
          touchStart.current = null;
      };
      
      const handleCancel = () => { touchStart.current = null; };
      const onTouchStart = (e: TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY);
      const onTouchEnd = (e: TouchEvent) => handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      const onMouseDown = (e: MouseEvent) => handleStart(e.clientX, e.clientY);
      const onMouseUp = (e: MouseEvent) => handleEnd(e.clientX, e.clientY);
      const onMouseLeave = (e: MouseEvent) => handleCancel();

      window.addEventListener('touchstart', onTouchStart);
      window.addEventListener('touchend', onTouchEnd);
      window.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('mouseleave', onMouseLeave);

      return () => {
          window.removeEventListener('touchstart', onTouchStart);
          window.removeEventListener('touchend', onTouchEnd);
          window.removeEventListener('mousedown', onMouseDown);
          window.removeEventListener('mouseup', onMouseUp);
          window.removeEventListener('mouseleave', onMouseLeave);
      };
  }, [state.settings.enableSwipe, state.settings.invertSwipe, state.settings.sensitivity, view, showStore, state.gameOver, state.isCascading, showBossTutorial, showTutorial, tutorialStep, activeOverlay]);

  useEffect(() => {
      const resumeAudio = () => audioService.resume();
      window.addEventListener('click', resumeAudio);
      window.addEventListener('keydown', resumeAudio);
      window.addEventListener('touchstart', resumeAudio);
      return () => {
          window.removeEventListener('click', resumeAudio);
          window.removeEventListener('keydown', resumeAudio);
          window.removeEventListener('touchstart', resumeAudio);
      };
  }, []);

  // Effect to detect merges and trigger shake/particles based on logic in moveGrid return (which we don't have access to here easily)
  // Workaround: We track grid state changes.
  useEffect(() => {
      // Find new merges? The Reducer computes this. 
      const newMerges: { id: string, x: number, y: number, value: number, type: string }[] = [];
      let maxMergeValue = 0;
      let hitBoss = false;
      
      state.grid.forEach(t => {
          if (t.mergedFrom) {
              if (t.mergedFrom[0] === 'damage') hitBoss = true;
              else {
                  newMerges.push({ id: t.id, x: t.x, y: t.y, value: t.value, type: t.type });
                  if (t.value > maxMergeValue) maxMergeValue = t.value;
              }
          }
      });
      
      // Calculate Loot Changes for Visual Pops
      const goldDiff = state.gold - prevGold.current;
      const invDiff = state.inventory.length - prevInvCount.current;
      
      // Loot Spawn Logic: Use the position of the highest value merge (heuristic)
      if ((goldDiff > 0 || invDiff > 0) && newMerges.length > 0) {
          const sourceMerge = newMerges.sort((a,b) => b.value - a.value)[0];
          const newLoot: typeof lootEvents = [];

          if (goldDiff > 0) {
              newLoot.push({ id: uuidv4(), x: sourceMerge.x, y: sourceMerge.y, type: 'GOLD', value: goldDiff });
          }
          if (invDiff > 0 && state.inventory.length > 0) {
               const item = state.inventory[state.inventory.length - 1];
               newLoot.push({ id: uuidv4(), x: sourceMerge.x, y: sourceMerge.y, type: 'ITEM', icon: item.icon });
          }
          setLootEvents(prev => [...prev, ...newLoot]);
          
          // Cleanup
          setTimeout(() => {
              setLootEvents(prev => prev.filter(l => !newLoot.some(nl => nl.id === l.id)));
          }, 1000);
      }

      // Update refs
      prevGold.current = state.gold;
      prevInvCount.current = state.inventory.length;

      if (hitBoss) {
          setShakeIntensity(2); // Boss Hit Shake
          // Wait slightly longer for heavy hits
          setTimeout(() => setShakeIntensity(0), 200);
      }
      else if (newMerges.length > 0) {
          setMergeEvents(newMerges);
          // Shake Logic
          if (maxMergeValue >= 128) {
              setShakeIntensity(2);
          } else if (maxMergeValue >= 32 || state.combo > 1) {
              setShakeIntensity(1);
          }
          if (shakeIntensity > 0) setTimeout(() => setShakeIntensity(0), 150); // Faster reset
      }
  }, [state.grid, state.stats.totalMoves]); // Dep on totalMoves ensures it runs on move

  if (isLoading) {
      return (
          <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center z-[100]">
              <div className="w-24 h-24 mb-8 relative animate-pulse">
                   <div className="absolute inset-0 bg-red-600 blur-2xl opacity-20"></div>
                   <Skull size={96} className="text-red-900 relative z-10" />
              </div>
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-200 to-red-700 fantasy-font mb-4 tracking-widest">
                  DRAGON'S HOARD
              </h1>
              <div className="w-64 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${loadingProgress}%` }}></div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-slate-500 font-mono text-xs">
                  <Loader2 size={12} className="animate-spin" /> Preparing Dungeon... {loadingProgress}%
              </div>
          </div>
      );
  }

  if (view === 'SPLASH') {
    return <SplashScreen 
        onStart={(selectedClass, mode) => {
            dispatch({ type: 'RESTART', selectedClass, mode });
            setView('GAME');
        }} 
        onContinue={() => setView('GAME')}
        onOpenLeaderboard={() => setView('LEADERBOARD')}
        onOpenSettings={() => setView('SETTINGS')}
        onOpenHelp={() => setView('HELP')}
        hasSave={state.score > 0} 
    />;
  }

  if (view === 'LEADERBOARD') return <Leaderboard onBack={() => setView('SPLASH')} />;
  if (view === 'HELP') return <HelpScreen onBack={() => setView('SPLASH')} />;
  if (view === 'SETTINGS') return <Settings 
        settings={state.settings}
        onUpdateSettings={(s) => dispatch({ type: 'UPDATE_SETTINGS', settings: s })}
        onBack={() => setView('SPLASH')} 
        onClearData={() => { dispatch({ type: 'RESTART' }); setView('SPLASH'); }}
  />;

  return (
    // Fixed Viewport for Gameplay
    <div className={`fixed inset-0 w-full h-[100dvh] overflow-hidden flex flex-col items-center justify-center p-0 sm:p-2 relative select-none cursor-default touch-none`}>
      
      {/* --- PLANE 3: DYNAMIC BACKGROUND PARALLAX --- */}
      <motion.div 
         className="fixed inset-0 z-0 bg-cover bg-center"
         // KEY forces re-mount on stage change for clean transition
         key={state.currentStage.name}
         initial={{ opacity: 0 }}
         animate={{ opacity: 1, scale: 1.1 }}
         transition={{ duration: 1.5 }}
         style={{
             backgroundImage: `url('${state.currentStage.backgroundUrl}')`,
         }}
      >
          {/* Overlays on top of the bg image but still part of the parallax plane */}
          <div className={`absolute inset-0 bg-black/60 ${state.level >= 30 ? 'bg-black/80' : ''}`}></div>
          <div className={`absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80`}></div>
          
          {/* Fog Layer */}
          {!state.settings.lowPerformanceMode && (
              <div className="fog-wrapper">
                  <div className="fog-piece"></div>
                  <div className="fog-piece"></div>
              </div>
          )}

          {!state.settings.lowPerformanceMode && <div className="scanlines"></div>}
          <div className="vignette"></div>
      </motion.div>

      {/* --- AMBIENT PARTICLES (Behind Grid) --- */}
      <AmbientBackground lowPerformanceMode={state.settings.lowPerformanceMode} />

      {/* --- PLANE 2: UI OVERLAYS (Static relative to camera) --- */}
      {activeOverlay && (
          <div className={`fixed inset-0 z-[80] pointer-events-none flex items-center justify-center
              ${activeOverlay.type === 'BOSS' ? 'animate-boss-pulse bg-red-950/20' : ''}
              ${activeOverlay.type === 'LEVEL_UP' ? 'animate-level-flash' : ''}
              ${activeOverlay.type === 'STAGE' ? 'animate-stage-overlay bg-black/80' : ''}
          `}>
              {activeOverlay.type === 'BOSS' && (
                  <div className="text-center animate-shake">
                      <Skull size={120} className="text-red-500 mx-auto animate-pulse mb-4 drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]" />
                      <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-900 fantasy-font drop-shadow-2xl">WARNING</h1>
                      <p className="text-red-200 text-xl md:text-2xl font-bold tracking-[0.5em] mt-2">BOSS APPROACHING</p>
                  </div>
              )}
              {activeOverlay.type === 'LEVEL_UP' && (
                   <div className="text-center animate-in zoom-in-50 duration-500 flex flex-col items-center">
                        <div className="text-6xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-amber-500 fantasy-font drop-shadow-[0_0_40px_rgba(251,191,36,0.8)] filter drop-shadow-lg">LEVEL UP!</div>
                        {activeOverlay.text !== 'LEVEL UP!' && (
                            <div className="mt-4 text-xl md:text-2xl font-bold text-white bg-black/80 px-8 py-4 rounded-xl border-2 border-yellow-500/50 animate-in slide-in-from-bottom-4 shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
                                <span className="text-yellow-400">UNLOCKED:</span> {activeOverlay.text}
                            </div>
                        )}
                   </div>
              )}
              {activeOverlay.type === 'STAGE' && (
                  <div className="text-center space-y-4">
                      <p className="text-slate-400 tracking-[0.4em] text-sm uppercase">Entering</p>
                      <h1 className="text-5xl md:text-7xl font-black text-white fantasy-font drop-shadow-2xl">{activeOverlay.text}</h1>
                  </div>
              )}
          </div>
      )}

      {/* --- PLANE 1: GAME GRID & HUD (Foreground) --- */}
      <div className={`relative z-10 w-full max-w-lg h-full min-h-0 flex flex-col items-center justify-center gap-1 md:gap-2 pb-safe
            ${shakeIntensity === 1 ? 'animate-shake-sm' : ''}
            ${shakeIntensity === 2 ? 'animate-shake-md' : ''}
            ${shakeIntensity === 3 ? 'animate-shake-lg chromatic-shake' : ''}
      `}>
        {showTutorial && <TutorialOverlay step={tutorialStep} gridSize={state.gridSize} />}
        
        {/* Boss Tutorial Overlay */}
        {showBossTutorial && (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={handleBossTutorialDismiss}>
                <TutorialOverlay step={4} gridSize={state.gridSize} />
                <div className="absolute bottom-10 z-[110] animate-bounce pointer-events-none">
                    <span className="text-white font-bold bg-black/50 px-4 py-2 rounded-full border border-white/20">Tap / Swipe / Key to Continue</span>
                </div>
            </div>
        )}

        {/* Floating Logs - Absolutely positioned to not affect layout */}
        <div className="absolute top-[10%] left-0 right-0 pointer-events-none flex flex-col items-center space-y-1 z-50 h-0 overflow-visible">
             {state.logs.map((log, i) => {
                 let type = 'INFO';
                 if (log.includes('ACHIEVEMENT')) type = 'ACHIEVEMENT';
                 if (log.includes('LEVEL UP')) type = 'LEVEL_UP';
                 if (log.includes('BOSS') || log.includes('Curse')) type = 'DANGER';
                 if (log.includes('Loot') || log.includes('Gold Rush') || log.includes('Mana Storm') || log.includes('Pouch') || log.includes('Cascade') || log.includes('Flow') || log.includes('Harmonic')) type = 'LOOT';

                 return (
                    <div key={i} className={`
                            floating-text text-xs md:text-sm font-bold px-3 py-1.5 rounded-lg border shadow-xl flex items-center gap-2 whitespace-nowrap ${state.settings.lowPerformanceMode ? 'bg-slate-900 border-slate-700' : 'backdrop-blur-md'}
                            ${type === 'ACHIEVEMENT' ? 'bg-yellow-900/80 border-yellow-400 text-yellow-100 animate-in slide-in-from-top-4' : ''}
                            ${type === 'LEVEL_UP' ? 'bg-indigo-900/80 border-indigo-400 text-indigo-100 animate-in zoom-in-50' : ''}
                            ${type === 'DANGER' ? 'bg-red-900/80 border-red-500 text-red-100 animate-shake' : ''}
                            ${type === 'LOOT' ? 'bg-green-900/60 border-green-500 text-green-100' : ''}
                            ${type === 'INFO' ? 'bg-black/40 border-slate-600/50 text-slate-200 text-[10px] py-1' : ''}
                    `}>
                        {type === 'ACHIEVEMENT' && <Trophy size={14} className="text-yellow-400" />}
                        {type === 'LEVEL_UP' && <Star size={14} className="text-indigo-400" />}
                        {type === 'DANGER' && <Skull size={14} className="text-red-400" />}
                        {type === 'LOOT' && <Zap size={12} className="text-green-400" />}
                        <span>{log.replace('ACHIEVEMENT UNLOCKED:', '')}</span>
                    </div>
                 );
             })}
        </div>

        {/* HUD - Shrinkable header */}
        <div className="w-full shrink-0 relative z-40">
          <HUD 
            score={state.score} 
            bestScore={state.bestScore} 
            level={state.level} 
            xp={state.xp} 
            gold={state.gold} 
            inventory={state.inventory}
            rerolls={state.rerolls}
            effectCounters={state.effectCounters}
            currentStage={state.currentStage}
            gameMode={state.gameMode}
            accountLevel={state.accountLevel}
            settings={state.settings}
            combo={state.combo} // Pass combo here
            onOpenStore={() => setShowStore(true)}
            onUseItem={(item) => dispatch({ type: 'USE_ITEM', item })}
            onReroll={() => dispatch({ type: 'REROLL' })}
            onMenu={() => setView('SPLASH')}
            onOpenStats={() => setShowStats(true)}
          />
        </div>

        {/* Grid - Fixed Aspect Ratio Container */}
        {/* We center this within the available flexible space */}
        <div className="w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden p-2">
            <div className="relative aspect-square w-full h-full max-w-full max-h-full mx-auto shadow-2xl rounded-xl">
                <Grid 
                    grid={state.grid} 
                    size={state.gridSize} 
                    mergeEvents={mergeEvents} 
                    lootEvents={lootEvents} 
                    slideSpeed={state.settings.slideSpeed || 150}
                    themeId={state.currentStage.themeId}
                    lowPerformanceMode={state.settings.lowPerformanceMode}
                />
            </div>
        </div>
      </div>

      {showStore && (
        <Store 
          gold={state.gold} 
          inventory={state.inventory} 
          onClose={() => setShowStore(false)} 
          onBuy={(item) => dispatch({ type: 'BUY_ITEM', item })}
          onCraft={(recipe) => dispatch({ type: 'CRAFT_ITEM', recipe })}
          onUseItem={(item) => dispatch({ type: 'USE_ITEM', item })}
          shopState={state.shop}
        />
      )}

      {showStats && (
          <GameStatsModal 
             gameState={state} 
             onClose={() => setShowStats(false)} 
             nextLevelXp={getXpThreshold(state.level)} 
          />
      )}

      {showDebug && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-red-500 p-6 rounded-xl w-full max-w-md shadow-2xl">
                <h2 className="text-2xl font-bold text-red-500 mb-4 flex items-center gap-2"><Skull size={24}/> ADMIN CONSOLE</h2>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => dispatch({ type: 'LOAD_GAME', state: { ...state, xp: state.xp + 10000 } })} className="p-3 bg-indigo-900 hover:bg-indigo-800 rounded font-mono text-xs">+10,000 XP</button>
                    <button onClick={() => dispatch({ type: 'LOAD_GAME', state: { ...state, gold: state.gold + 5000 } })} className="p-3 bg-yellow-900 hover:bg-yellow-800 rounded font-mono text-xs">+5,000 GOLD</button>
                    <button onClick={() => {
                            let grid = [...state.grid];
                            const targets = grid.filter(t => t.type === TileType.NORMAL);
                            if (targets.length > 0) {
                                const t = targets[0];
                                t.type = TileType.BOSS; t.value = 0; t.health = 500; t.maxHealth = 500;
                            }
                            dispatch({ type: 'LOAD_GAME', state: { ...state, grid, logs: [...state.logs, "DEBUG: BOSS SPAWNED"] } });
                        }} className="p-3 bg-red-900 hover:bg-red-800 rounded font-mono text-xs">SPAWN BOSS</button>
                    <button onClick={() => { dispatch({ type: 'LOAD_GAME', state: { ...state, gameOver: true } }); setShowDebug(false); }} className="p-3 bg-slate-700 hover:bg-slate-600 rounded font-mono text-xs">TRIGGER DEFEAT</button>
                    <button onClick={() => setShowDebug(false)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded font-mono text-xs col-span-2">CLOSE CONSOLE</button>
                </div>
            </div>
        </div>
      )}

      {state.gameOver && (
          <RunSummary gameState={state} onRestart={() => dispatch({ type: 'RESTART' })} onShowLeaderboard={() => setView('LEADERBOARD')} onHome={() => setView('SPLASH')} />
      )}
      
      {state.victory && !state.gameWon && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-yellow-900 to-amber-900 p-8 rounded-xl border-2 border-yellow-500 text-center shadow-[0_0_50px_rgba(234,179,8,0.5)] animate-in zoom-in">
             <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-amber-500 fantasy-font mb-4">VICTORY</h2>
             <p className="text-yellow-100 mb-6">You have created the Dragon God tile!</p>
             <button onClick={() => dispatch({ type: 'CONTINUE' })} className="px-8 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 hover:scale-105 transition-all shadow-lg">CONTINUE RUN</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
