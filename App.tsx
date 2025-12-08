
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
import { Direction, GameState, TileType, InventoryItem, FloatingText, CraftingRecipe, View, Achievement, ItemType, InputSettings, HeroClass, GameMode, PlayerProfile } from './types';
import { initializeGame, moveGrid, spawnTile, isGameOver, checkLoot, useInventoryItem, applyMidasTouch, applyChronosShift, applyVoidSingularity, tryAutoMerge, checkAchievements, savePersistentAchievements, executeAutoCascade } from './services/gameLogic';
import { SHOP_ITEMS, getXpThreshold, getStage, getStageBackground, getItemDefinition, TILE_STYLES } from './constants';
import { audioService } from './services/audioService';
import { getPlayerProfile, completeTutorial } from './services/storageService';
import { Trophy, Star, Skull, Zap, Info } from 'lucide-react';

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
        // Legacy ack, can be removed or kept for safety
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
      if (state.gold < action.item.price) return state;
      if (state.inventory.length >= 3) return { ...state, logs: [...state.logs, "Inventory Full!"] };
      
      const newItem: InventoryItem = {
          id: Math.random().toString(36),
          type: action.item.id,
          name: action.item.name,
          description: action.item.desc,
          icon: action.item.icon
      };

      const newState = {
          ...state,
          gold: state.gold - action.item.price,
          inventory: [...state.inventory, newItem],
          logs: [...state.logs, `Bought ${action.item.name}`]
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
        
        // Track usage in RunStats
        const updatedRunStats = {
            ...state.runStats,
            powerUpsUsed: state.runStats.powerUpsUsed + 1
        };

        const newState = { ...state, ...result, runStats: updatedRunStats };
        localStorage.setItem('2048_rpg_state_v3', JSON.stringify(newState));
        return newState as GameState;
    }

    case 'TRIGGER_POWERUP_EFFECT':
        // Track usage if triggered directly (mostly handled via USE_ITEM, but good to double check)
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

      const { grid: movedGrid, score, xpGained, goldGained, moved, mergedIds, powerUpTriggered, combo, comboMultiplier, logs: moveLogs } = moveGrid(state.grid, action.direction, state.gridSize, state.gameMode, state.effectCounters);

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

      // Stats Update
      let newStats = { ...state.stats };
      newStats.totalMoves++;
      if (score > 0) newStats.totalMerges += mergedIds.length;
      if (combo > newStats.highestCombo) newStats.highestCombo = combo;
      newStats.goldCollected += goldGained;
      
      const maxTile = Math.max(...newGrid.map(t => t.value));
      if (maxTile > newStats.highestTile) newStats.highestTile = maxTile;

      // Update RunStats
      let newRunStats = { 
          ...state.runStats,
          turnCount: newStats.totalMoves,
          goldEarned: newStats.goldCollected,
          highestTile: newStats.highestTile,
          highestMonster: TILE_STYLES[newStats.highestTile]?.label || 'Monster',
          mergesCount: state.runStats.mergesCount + mergedIds.length
      };

      const mergedTiles = newGrid.filter(t => mergedIds.includes(t.id));
      mergedTiles.forEach(t => {
          if (t.value === 4) newStats.slimesMerged += 1;
          
          if (t.value === 128) {
              newEffectCounters['DEMON_CURSE'] = 1;
              newLogs.push("Demon Curse! Next spawn dangerous.");
          }
      });

      if (score > 0) audioService.playMerge(score);

      // Decrement Effect Counters
      if (newEffectCounters['LUCKY_LOOT'] > 0) {
          newEffectCounters['LUCKY_LOOT']--;
          if (newEffectCounters['LUCKY_LOOT'] === 0) newLogs.push("Lucky Charm expired.");
      }
      if (newEffectCounters['CHAIN_CATALYST'] > 0) {
          newEffectCounters['CHAIN_CATALYST']--;
          if (newEffectCounters['CHAIN_CATALYST'] === 0) newLogs.push("Chain Catalyst expired.");
      }
      if (newEffectCounters['LUCKY_DICE'] > 0) {
          newEffectCounters['LUCKY_DICE']--;
          if (newEffectCounters['LUCKY_DICE'] === 0) newLogs.push("Lucky Dice expired.");
      }
      if (newEffectCounters['MIDAS_POTION'] > 0) {
          newEffectCounters['MIDAS_POTION']--;
          if (newEffectCounters['MIDAS_POTION'] === 0) newLogs.push("Midas Potion expired.");
      }
      // Siege Breaker doesn't decrement here, it is consumed on hit in gameLogic

      // Check for Loot
      const hasLuckyCharm = (newEffectCounters['LUCKY_LOOT'] || 0) > 0;
      const loot = checkLoot(state.level, mergedIds, hasLuckyCharm, state.gameMode === 'CLASSIC');
      if (loot) {
        newLogs.push(loot.message);
        if (loot.gold) newGold += loot.gold;
        if (loot.item) {
             if (newInventory.length < 3) {
                 newInventory.push(loot.item);
             } else {
                 newLogs.push("Inventory full! Item lost.");
             }
        }
      }

      // Handle XP & Level Up & Stage (Disabled in Classic)
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
                    colorTheme: stageConfig.color,
                    barColor: stageConfig.barColor
                };
                newLogs.push(`ENTERING STAGE: ${currentStage.name}`);
            }
            
            // Update stage reached
            newRunStats.stageReached = currentStage.name;

            threshold = getXpThreshold(newLevel);
        }
      }

      // Spawn new tile logic
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
      
      // Calculate Dice Bonus
      const diceBonus = (newEffectCounters['LUCKY_DICE'] || 0) > 0 ? 0.05 : 0;

      let finalGrid = spawnTile(newGrid, newGridSize, newLevel, { 
          forcedValue, 
          type: forcedType, 
          bossLevel: Math.floor(newLevel / 5),
          isClassic: state.gameMode === 'CLASSIC',
          powerUpChanceBonus: diceBonus
      });
      const lastSpawned = finalGrid.find(t => !newGrid.includes(t));

      // Auto Merge Perk check (Legacy, kept for backup logic) - Disable in Classic
      if (newLevel >= 20 && state.gameMode !== 'CLASSIC') {
          const autoMerge = tryAutoMerge(finalGrid);
          if (autoMerge.success) {
              finalGrid = autoMerge.grid;
              newScore += autoMerge.value;
              newLogs.push("Auto-Merge Perk Activated!");
          }
      }

      // PowerUps Triggering
      if (powerUpTriggered) {
          // Track Run Stats
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
      
      // Cascade Gating Logic: 
      // 1. Account Level >= 10 OR Chain Catalyst Active
      // 2. Not Classic Mode
      const isChainActive = (newEffectCounters['CHAIN_CATALYST'] || 0) > 0;
      const canCascade = (state.accountLevel >= 10 || isChainActive) && state.gameMode !== 'CLASSIC';

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
        logs: newLogs.slice(-4), // Limit logs for mobile space
        activeEffects,
        effectCounters: newEffectCounters,
        currentStage,
        powerUpEffect: nextPowerUpEffect,
        lastSpawnedTileId: lastSpawned?.id,
        stats: newStats,
        runStats: newRunStats,
        gameWon: state.gameWon || victory,
        isCascading: canCascade, // Will trigger effect if true
        cascadeStep: 0,
        justLeveledUp: state.justLeveledUp || justLeveledUp,
        unlockedPerk: unlockedPerk || state.unlockedPerk
      };

      localStorage.setItem('2048_rpg_state_v3', JSON.stringify(nextState));
      return nextState;
    }

    case 'CASCADE_STEP': {
        const { grid, rewards } = action.payload;
        const newStep = (state.cascadeStep || 0) + 1;
        const multiplier = Math.pow(1.1, newStep).toFixed(1);
        
        audioService.playCascade(newStep);

        // Update Run Stats for cascade
        const updatedRunStats = {
            ...state.runStats,
            cascadesTriggered: state.runStats.cascadesTriggered + 1,
            goldEarned: state.runStats.goldEarned + rewards.gold
        };

        return {
            ...state,
            grid,
            xp: state.xp + rewards.xp,
            gold: state.gold + rewards.gold,
            cascadeStep: newStep,
            runStats: updatedRunStats,
            logs: [...state.logs, `Cascade x${newStep}! (${multiplier}x Rewards)`].slice(-4),
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
  const [activeOverlay, setActiveOverlay] = useState<{type: 'BOSS' | 'LEVEL_UP' | 'STAGE', text: string} | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  
  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0); // 0: Move, 1: Merge, 2: XP, 3: Done

  // Admin Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.shiftKey && e.key === '|') {
            setShowDebug(prev => !prev);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check Tutorial Status on Load
  useEffect(() => {
      const profile = getPlayerProfile();
      if (!profile.tutorialCompleted && view === 'GAME') {
          setShowTutorial(true);
      }
  }, [view]);

  // Event Watcher (Boss, Level Up, Stage Change)
  useEffect(() => {
    // We only trigger overlays on state.justLeveledUp or log events
    // Log based triggers are kept for Boss/Stage for now
    if (state.logs.length === 0) return;
    const lastLog = state.logs[state.logs.length - 1];

    if (lastLog.includes("WARNING: A BOSS APPEARED!")) {
        setActiveOverlay({ type: 'BOSS', text: 'BOSS APPROACHES' });
        audioService.playBossSpawn();
        setTimeout(() => setActiveOverlay(null), 2500);
    } 
    else if (lastLog.includes("ENTERING STAGE:")) {
        const stageName = lastLog.replace("ENTERING STAGE: ", "");
        setActiveOverlay({ type: 'STAGE', text: stageName });
        audioService.playStageTransition();
        setTimeout(() => setActiveOverlay(null), 3000);
    }
  }, [state.logs]);

  // Level Up Overlay Hook
  useEffect(() => {
      if (state.justLeveledUp) {
          setActiveOverlay({ type: 'LEVEL_UP', text: state.unlockedPerk || 'LEVEL UP!' });
          audioService.playLevelUp();
          setTimeout(() => {
              setActiveOverlay(null);
              dispatch({ type: 'ACK_LEVEL_UP' });
          }, 2000);
      }
  }, [state.justLeveledUp, state.unlockedPerk]);

  // Tutorial Progression Logic
  useEffect(() => {
      if (!showTutorial) return;
      if (state.stats.totalMoves >= 4) {
          completeTutorial();
          setShowTutorial(false);
          return;
      }

      // Step 0 -> 1: Player Moved
      if (tutorialStep === 0 && state.stats.totalMoves > 0) {
          setTutorialStep(1);
      }
      // Step 1 -> 2: Player Merged (Score increased)
      else if (tutorialStep === 1 && state.score > 0) {
          setTutorialStep(2);
          setTimeout(() => {
              setTutorialStep(3); // Auto advance to done after showing XP
              setTimeout(() => {
                  completeTutorial();
                  setShowTutorial(false);
              }, 3000);
          }, 3000);
      }
  }, [state.stats.totalMoves, state.score, showTutorial, tutorialStep]);

  // PowerUp Effects Handling
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

  // Cascade Chain Reaction Loop
  useEffect(() => {
      if (state.isCascading) {
          const timer = setTimeout(() => {
              if ((state.cascadeStep || 0) >= 8) {
                  dispatch({ type: 'CASCADE_COMPLETE' });
                  return;
              }

              const result = executeAutoCascade(state.grid, state.gridSize, (state.cascadeStep || 0) + 1);
              
              if (result.occurred) {
                  dispatch({ type: 'CASCADE_STEP', payload: result });
              } else {
                  dispatch({ type: 'CASCADE_COMPLETE' });
              }
          }, 300);

          return () => clearTimeout(timer);
      }
  }, [state.isCascading, state.grid, state.cascadeStep, state.gridSize]);

  // Achievements Check
  useEffect(() => {
      const unlocked = checkAchievements(state);
      unlocked.forEach(ach => {
          dispatch({ type: 'UNLOCK_ACHIEVEMENT', achievement: ach });
      });
  }, [state.stats]);

  // Keyboard
  useEffect(() => {
    if (!state.settings.enableKeyboard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (view !== 'GAME' || showStore || state.gameOver || state.isCascading) return;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          dispatch({ type: 'MOVE', direction: Direction.UP });
          break;
        case 'ArrowDown':
          e.preventDefault();
          dispatch({ type: 'MOVE', direction: Direction.DOWN });
          break;
        case 'ArrowLeft':
          e.preventDefault();
          dispatch({ type: 'MOVE', direction: Direction.LEFT });
          break;
        case 'ArrowRight':
          e.preventDefault();
          dispatch({ type: 'MOVE', direction: Direction.RIGHT });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.settings.enableKeyboard, view, showStore, state.gameOver, state.isCascading]);

  // Swipe & Mouse Drag
  const touchStart = useRef<{x: number, y: number} | null>(null);

  useEffect(() => {
      if (!state.settings.enableSwipe) return;

      const handleStart = (x: number, y: number) => {
          if (view !== 'GAME' || showStore || state.gameOver || state.isCascading) return;
          touchStart.current = { x, y };
      };

      const handleEnd = (x: number, y: number) => {
          if (!touchStart.current || view !== 'GAME' || showStore || state.gameOver || state.isCascading) return;
          
          const deltaX = x - touchStart.current.x;
          const deltaY = y - touchStart.current.y;
          const absX = Math.abs(deltaX);
          const absY = Math.abs(deltaY);
          
          const threshold = 90 - (state.settings.sensitivity * 7); 

          if (Math.max(absX, absY) > threshold) {
              let dir: Direction | null = null;
              if (absX > absY) {
                  dir = deltaX > 0 ? Direction.RIGHT : Direction.LEFT;
              } else {
                  dir = deltaY > 0 ? Direction.DOWN : Direction.UP;
              }

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
      
      const handleCancel = () => {
          touchStart.current = null;
      };

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
  }, [state.settings.enableSwipe, state.settings.invertSwipe, state.settings.sensitivity, view, showStore, state.gameOver, state.isCascading]);

  // Scroll / Wheel
  const scrollAccumulator = useRef({ x: 0, y: 0 });
  const lastScrollTime = useRef(0);

  useEffect(() => {
      if (!state.settings.enableScroll) return;

      const handleWheel = (e: WheelEvent) => {
          if (view === 'GAME' && !showStore) {
              e.preventDefault(); 
          } else {
              return;
          }

          if (state.isCascading) return;

          const now = Date.now();
          if (now - lastScrollTime.current < 400) return; 

          scrollAccumulator.current.x += e.deltaX;
          scrollAccumulator.current.y += e.deltaY;

          const THRESHOLD = 60 - (state.settings.sensitivity * 3); 

          const absX = Math.abs(scrollAccumulator.current.x);
          const absY = Math.abs(scrollAccumulator.current.y);

          if (absX > THRESHOLD || absY > THRESHOLD) {
              let dir: Direction | null = null;
              if (absX > absY) {
                  dir = scrollAccumulator.current.x > 0 ? Direction.RIGHT : Direction.LEFT;
              } else {
                  dir = scrollAccumulator.current.y > 0 ? Direction.DOWN : Direction.UP;
              }

              if (dir) {
                   if (state.settings.invertScroll) {
                      if (dir === Direction.UP) dir = Direction.DOWN;
                      else if (dir === Direction.DOWN) dir = Direction.UP;
                      else if (dir === Direction.LEFT) dir = Direction.RIGHT;
                      else if (dir === Direction.RIGHT) dir = Direction.LEFT;
                   }
                   dispatch({ type: 'MOVE', direction: dir });
                   lastScrollTime.current = now;
                   scrollAccumulator.current = { x: 0, y: 0 };
              }
          }

          setTimeout(() => {
              if (Date.now() - lastScrollTime.current > 100) {
                 scrollAccumulator.current = { x: 0, y: 0 };
              }
          }, 150);
      };

      window.addEventListener('wheel', handleWheel, { passive: false });
      return () => window.removeEventListener('wheel', handleWheel);
  }, [state.settings.enableScroll, state.settings.invertScroll, state.settings.sensitivity, view, showStore, state.isCascading]);

  // Audio Resume
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

  if (view === 'LEADERBOARD') {
      return <Leaderboard onBack={() => setView('SPLASH')} />;
  }
  
  if (view === 'HELP') {
      return <HelpScreen onBack={() => setView('SPLASH')} />;
  }

  if (view === 'SETTINGS') {
      return <Settings 
        settings={state.settings}
        onUpdateSettings={(s) => dispatch({ type: 'UPDATE_SETTINGS', settings: s })}
        onBack={() => setView('SPLASH')} 
        onClearData={() => {
            dispatch({ type: 'RESTART' });
            setView('SPLASH');
        }}
      />;
  }

  return (
    <div 
        className="min-h-screen w-full flex flex-col items-center justify-center p-2 md:p-4 relative overflow-hidden transition-colors duration-1000 select-none cursor-default touch-none"
        style={{
            backgroundImage: `url('${state.currentStage.backgroundUrl}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            paddingBottom: 'env(safe-area-inset-bottom)'
        }}
    >
      <div className={`absolute inset-0 bg-black/60 ${state.level >= 30 ? 'bg-black/80' : ''}`}></div>
      <div className={`absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80`}></div>
      <div className="scanlines"></div>
      <div className="vignette"></div>

      {/* Cinematic Overlays */}
      {activeOverlay && (
          <div className={`fixed inset-0 z-[80] pointer-events-none flex items-center justify-center
              ${activeOverlay.type === 'BOSS' ? 'animate-boss-pulse bg-red-950/20' : ''}
              ${activeOverlay.type === 'LEVEL_UP' ? 'animate-level-flash' : ''}
              ${activeOverlay.type === 'STAGE' ? 'animate-stage-overlay bg-black/80' : ''}
          `}>
              {activeOverlay.type === 'BOSS' && (
                  <div className="text-center animate-shake">
                      <Skull size={120} className="text-red-500 mx-auto animate-pulse mb-4 drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]" />
                      <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-900 fantasy-font drop-shadow-2xl">
                          WARNING
                      </h1>
                      <p className="text-red-200 text-xl md:text-2xl font-bold tracking-[0.5em] mt-2">BOSS APPROACHING</p>
                  </div>
              )}
              {activeOverlay.type === 'LEVEL_UP' && (
                   <div className="text-center animate-in zoom-in-50 duration-500 flex flex-col items-center">
                        <div className="text-6xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-amber-500 fantasy-font drop-shadow-[0_0_40px_rgba(251,191,36,0.8)]">
                            LEVEL UP!
                        </div>
                        {/* Display unlocked perk text if available */}
                        {activeOverlay.text !== 'LEVEL UP!' && (
                            <div className="mt-4 text-xl md:text-2xl font-bold text-white bg-black/60 px-6 py-2 rounded-full border border-yellow-500/50 animate-in slide-in-from-bottom-4">
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

      {/* Main Game Container */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        
        {/* Tutorial Overlay */}
        {showTutorial && <TutorialOverlay step={tutorialStep} gridSize={state.gridSize} />}

        {/* LOGS / NOTIFICATION SYSTEM */}
        <div className="absolute top-[80px] md:top-24 left-0 right-0 pointer-events-none flex flex-col items-center space-y-2 z-50 h-32">
             {state.logs.map((log, i) => {
                 let type = 'INFO';
                 if (log.includes('ACHIEVEMENT')) type = 'ACHIEVEMENT';
                 if (log.includes('LEVEL UP')) type = 'LEVEL_UP';
                 if (log.includes('BOSS') || log.includes('Curse')) type = 'DANGER';
                 if (log.includes('Loot')) type = 'LOOT';

                 return (
                    <div 
                        key={i} 
                        className={`
                            floating-text text-sm md:text-base font-bold px-4 py-2 rounded-lg border backdrop-blur-md shadow-xl flex items-center gap-2
                            ${type === 'ACHIEVEMENT' ? 'bg-yellow-900/80 border-yellow-400 text-yellow-100 animate-in slide-in-from-top-4' : ''}
                            ${type === 'LEVEL_UP' ? 'bg-indigo-900/80 border-indigo-400 text-indigo-100 animate-in zoom-in-50' : ''}
                            ${type === 'DANGER' ? 'bg-red-900/80 border-red-500 text-red-100 animate-shake' : ''}
                            ${type === 'LOOT' ? 'bg-green-900/60 border-green-500 text-green-100' : ''}
                            ${type === 'INFO' ? 'bg-black/40 border-slate-600/50 text-slate-200 text-xs py-1' : ''}
                        `}
                    >
                        {type === 'ACHIEVEMENT' && <Trophy size={16} className="text-yellow-400" />}
                        {type === 'LEVEL_UP' && <Star size={16} className="text-indigo-400" />}
                        {type === 'DANGER' && <Skull size={16} className="text-red-400" />}
                        {type === 'LOOT' && <Zap size={14} className="text-green-400" />}
                        <span>{log.replace('ACHIEVEMENT UNLOCKED:', '')}</span>
                    </div>
                 );
             })}
        </div>

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
          onOpenStore={() => setShowStore(true)}
          onUseItem={(item) => dispatch({ type: 'USE_ITEM', item })}
          onReroll={() => dispatch({ type: 'REROLL' })}
          onMenu={() => setView('SPLASH')}
        />

        <div className="w-full relative touch-none" style={{ touchAction: 'none' }}>
            <Grid grid={state.grid} size={state.gridSize} />
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
        />
      )}

      {/* Debug Menu Overlay */}
      {showDebug && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-red-500 p-6 rounded-xl w-full max-w-md shadow-2xl">
                <h2 className="text-2xl font-bold text-red-500 mb-4 flex items-center gap-2">
                    <Skull size={24}/> ADMIN CONSOLE
                </h2>
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => {
                            // Instant Level Up 5 times
                            const newState = { ...state, xp: state.xp + 10000 };
                            dispatch({ type: 'LOAD_GAME', state: newState });
                        }}
                        className="p-3 bg-indigo-900 hover:bg-indigo-800 rounded font-mono text-xs"
                    >
                        +10,000 XP
                    </button>
                    <button 
                        onClick={() => {
                            const newState = { ...state, gold: state.gold + 5000 };
                            dispatch({ type: 'LOAD_GAME', state: newState });
                        }}
                        className="p-3 bg-yellow-900 hover:bg-yellow-800 rounded font-mono text-xs"
                    >
                        +5,000 GOLD
                    </button>
                    <button 
                        onClick={() => {
                            // Force Boss Spawn
                            let grid = [...state.grid];
                            // Replace random non-boss
                            const targets = grid.filter(t => t.type === TileType.NORMAL);
                            if (targets.length > 0) {
                                const t = targets[0];
                                t.type = TileType.BOSS;
                                t.value = 0;
                                t.health = 500;
                                t.maxHealth = 500;
                            }
                            dispatch({ type: 'LOAD_GAME', state: { ...state, grid, logs: [...state.logs, "DEBUG: BOSS SPAWNED"] } });
                        }}
                        className="p-3 bg-red-900 hover:bg-red-800 rounded font-mono text-xs"
                    >
                        SPAWN BOSS
                    </button>
                    <button 
                        onClick={() => {
                            // Instant Game Over
                            dispatch({ type: 'LOAD_GAME', state: { ...state, gameOver: true } });
                            setShowDebug(false);
                        }}
                        className="p-3 bg-slate-700 hover:bg-slate-600 rounded font-mono text-xs"
                    >
                        TRIGGER DEFEAT
                    </button>
                    <button 
                        onClick={() => {
                             // Force Cascade Unlock
                             const newState = { ...state, accountLevel: 15 };
                             dispatch({ type: 'LOAD_GAME', state: newState });
                        }}
                        className="p-3 bg-cyan-900 hover:bg-cyan-800 rounded font-mono text-xs"
                    >
                        UNLOCK CASCADES
                    </button>
                    <button 
                        onClick={() => setShowDebug(false)}
                        className="p-3 bg-slate-800 hover:bg-slate-700 rounded font-mono text-xs col-span-2"
                    >
                        CLOSE CONSOLE
                    </button>
                </div>
            </div>
        </div>
      )}

      {state.gameOver && (
          <RunSummary 
            gameState={state} 
            onRestart={() => dispatch({ type: 'RESTART' })} 
            onShowLeaderboard={() => setView('LEADERBOARD')}
            onHome={() => setView('SPLASH')}
          />
      )}
      
      {state.victory && !state.gameWon && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-yellow-900 to-amber-900 p-8 rounded-xl border-2 border-yellow-500 text-center shadow-[0_0_50px_rgba(234,179,8,0.5)] animate-in zoom-in">
             <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-amber-500 fantasy-font mb-4">VICTORY</h2>
             <p className="text-yellow-100 mb-6">You have created the Dragon God tile!</p>
             <button 
                onClick={() => dispatch({ type: 'CONTINUE' })}
                className="px-8 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 hover:scale-105 transition-all shadow-lg"
             >
                CONTINUE RUN
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
