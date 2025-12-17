
import React, { useEffect, useReducer, useRef, useState } from 'react';
import { Grid } from './components/Grid';
import { HUD } from './components/HUD';
import { Store } from './components/Store';
import { SplashScreen } from './components/SplashScreen';
import { Leaderboard } from './components/Leaderboard';
import { Settings } from './components/Settings';
import { RunSummary } from './components/RunSummary';
import { VictoryScreen } from './components/VictoryScreen';
import { TutorialOverlay } from './components/TutorialOverlay';
import { FeedbackLayer } from './components/FeedbackLayer';
import { HelpScreen } from './components/HelpScreen';
import { GameStatsModal } from './components/GameStatsModal';
import { VersusGame } from './components/VersusGame';
import { Grimoire } from './components/Grimoire';
import { AmbientBackground } from './components/AmbientBackground';
import { Direction, GameState, TileType, InventoryItem, CraftingRecipe, View, Achievement, ItemType, InputSettings, HeroClass, GameMode, PlayerProfile, DailyBounty, Difficulty, FeedbackEvent } from './types';
import { initializeGame, moveGrid, spawnTile, isGameOver, useInventoryItem, checkAchievements, executeAutoCascade } from './services/gameLogic';
import { SHOP_ITEMS, getXpThreshold, getStage, getItemDefinition } from './constants';
import { audioService } from './services/audioService';
import { loadCriticalAssets, loadBackgroundAssets } from './services/assetLoader';
import { getPlayerProfile, markHintSeen, completeTutorial } from './services/storageService';
import { Skull, Loader2, CheckCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { rng } from './utils/rng';
import { LootProvider } from './components/LootSystem';

// Actions
type Action = 
  | { type: 'MOVE'; direction: Direction }
  | { type: 'RESTART'; selectedClass?: HeroClass; mode?: GameMode; seed?: number; difficulty?: Difficulty; tileset?: string }
  | { type: 'CONTINUE' }
  | { type: 'LOAD_GAME'; state: GameState }
  | { type: 'BUY_ITEM'; item: typeof SHOP_ITEMS[0] }
  | { type: 'CRAFT_ITEM'; recipe: CraftingRecipe }
  | { type: 'USE_ITEM'; item: InventoryItem }
  | { type: 'REROLL' }
  | { type: 'UPDATE_SETTINGS'; settings: InputSettings }
  | { type: 'CASCADE_STEP'; payload: { grid: any[], rewards: { xp: number, gold: number } } }
  | { type: 'CASCADE_COMPLETE' }
  | { type: 'ACK_LEVEL_UP' };

const reducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'RESTART':
      return initializeGame(true, action.selectedClass || HeroClass.ADVENTURER, action.mode || 'RPG', action.seed, action.difficulty, action.tileset);
      
    case 'MOVE':
        if (state.gameOver || state.isCascading) return state;

        const result = moveGrid(state.grid, action.direction, state.gridSize, state.gameMode, state.effectCounters, state.activeModifiers, state.difficulty);
        
        if (!result.moved) return state;

        let newState = { ...state };
        newState.grid = result.grid;
        newState.score += result.score;
        newState.xp += result.xpGained;
        newState.gold += result.goldGained;
        newState.combo = result.combo;
        newState.lootEvents = result.lootEvents;
        
        // Handle Loot
        if (result.itemsFound.length > 0) {
            newState.inventory = [...newState.inventory, ...result.itemsFound];
            newState.logs = [...newState.logs, ...result.itemsFound.map(i => `Looted: ${i.name}`)];
        }
        
        // Handle Counters
        const newEffectCounters = { ...newState.effectCounters };
        Object.keys(newEffectCounters).forEach(key => {
            if (newEffectCounters[key] > 0) newEffectCounters[key]--;
            if (newEffectCounters[key] <= 0) delete newEffectCounters[key];
        });
        newState.effectCounters = newEffectCounters;

        // Spawn new tile
        let spawnOpts: any = {};
        if ((newState.effectCounters['ASCENDANT_SPAWN'] || 0) > 0) {
            spawnOpts.forcedValue = Math.random() > 0.5 ? 4 : 8; 
        }
        if ((newState.effectCounters['GOLDEN_SPAWN'] || 0) > 0) {
             spawnOpts.type = TileType.GOLDEN;
        }
        spawnOpts.modifiers = state.activeModifiers;
        spawnOpts.difficulty = state.difficulty;

        newState.grid = spawnTile(newState.grid, newState.gridSize, newState.level, { ...spawnOpts, isClassic: newState.gameMode === 'CLASSIC', powerUpChanceBonus: (newState.effectCounters['LUCKY_DICE'] || 0) > 0 ? 0.05 : 0 });

        // Update Stats
        newState.stats = {
            ...newState.stats,
            totalMoves: newState.stats.totalMoves + 1,
            goldCollected: newState.stats.goldCollected + result.goldGained,
            highestCombo: Math.max(newState.stats.highestCombo, result.combo)
        };
        newState.runStats = {
             ...newState.runStats,
             turnCount: newState.runStats.turnCount + 1,
             goldEarned: newState.runStats.goldEarned + result.goldGained
        };

        // Check Victory Condition (2048) - Only trigger once
        if (!newState.gameWon && newState.grid.some(t => t.value >= 2048)) {
            newState.victory = true;
            newState.gameWon = true; 
        }

        // Check Level Up
        const threshold = getXpThreshold(newState.level);
        if (newState.xp >= threshold) {
            newState.level++;
            newState.xp -= threshold;
            newState.justLeveledUp = true;
            
            // Expand Grid logic
            if (newState.level === 5 || newState.level === 10 || newState.level === 20) {
                 if (newState.gridSize < 6) newState.gridSize++; 
            }
            
            // Check Stage Transition
            const newStage = getStage(newState.level);
            if (newStage.name !== newState.currentStage.name) {
                newState.currentStage = newStage;
            }
        }

        // Check Game Over
        if (isGameOver(newState.grid, newState.gridSize)) {
            if ((newState.rerolls > 0 || newState.gold >= 50) && newState.level >= 15 && newState.gameMode === 'RPG') {
                // Reroll available
            } else {
                newState.gameOver = true;
            }
        }
        
        // Cascade Check
        if (newState.accountLevel >= 5 && newState.gameMode === 'RPG') {
             if (result.moved) {
                 newState.isCascading = true;
                 newState.cascadeStep = 0;
             }
        }

        return newState;

    case 'CONTINUE':
        return { ...state, victory: false }; 
    
    case 'LOAD_GAME':
        return action.state;

    case 'BUY_ITEM':
        return {
            ...state,
            gold: state.gold - action.item.price,
            inventory: [...state.inventory, { 
                id: uuidv4(), 
                type: action.item.id as ItemType, 
                name: action.item.name, 
                description: action.item.desc, 
                icon: action.item.icon 
            }],
            shop: {
                ...state.shop,
                items: {
                    ...state.shop.items,
                    [action.item.id]: {
                        stock: (state.shop.items[action.item.id]?.stock || 0) - 1,
                        priceMultiplier: (state.shop.items[action.item.id]?.priceMultiplier || 1.0)
                    }
                }
            }
        };
    
    case 'CRAFT_ITEM':
        {
            let newInv = [...state.inventory];
            action.recipe.ingredients.forEach(ing => {
                for(let i=0; i<ing.count; i++) {
                    const idx = newInv.findIndex(item => item.type === ing.type);
                    if (idx > -1) newInv.splice(idx, 1);
                }
            });
            
            const def = getItemDefinition(action.recipe.resultId);
            newInv.push({
                 id: uuidv4(),
                 type: action.recipe.resultId,
                 name: def.name,
                 description: def.desc,
                 icon: def.icon
            });

            return {
                ...state,
                gold: state.gold - action.recipe.goldCost,
                inventory: newInv,
                runStats: { ...state.runStats, itemsCrafted: state.runStats.itemsCrafted + 1 }
            };
        }

    case 'USE_ITEM':
        {
            const res = useInventoryItem(state, action.item);
            if (!res) return state;
            return { ...state, ...res, runStats: { ...state.runStats, powerUpsUsed: state.runStats.powerUpsUsed + 1 } };
        }

    case 'REROLL':
        if (state.rerolls > 0) {
            return { 
                ...state, 
                rerolls: state.rerolls - 1, 
                grid: spawnTile(spawnTile([], state.gridSize, state.level), state.gridSize, state.level),
                logs: [...state.logs, "Board Rerolled!"]
            };
        } else if (state.gold >= 50) {
             return { 
                ...state, 
                gold: state.gold - 50, 
                grid: spawnTile(spawnTile([], state.gridSize, state.level), state.gridSize, state.level),
                logs: [...state.logs, "Board Rerolled! (-50G)"]
            };
        }
        return state;

    case 'UPDATE_SETTINGS':
        return { ...state, settings: action.settings };

    case 'CASCADE_STEP':
        return {
            ...state,
            grid: action.payload.grid,
            xp: state.xp + action.payload.rewards.xp,
            gold: state.gold + action.payload.rewards.gold,
            cascadeStep: (state.cascadeStep || 0) + 1,
            runStats: { ...state.runStats, cascadesTriggered: state.runStats.cascadesTriggered + 1 }
        };

    case 'CASCADE_COMPLETE':
        return { ...state, isCascading: false, cascadeStep: 0 };
    
    case 'ACK_LEVEL_UP':
        return { ...state, justLeveledUp: false };

    default:
        return state;
  }
};

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, null, () => initializeGame());
  const [view, setView] = useState<View>('SPLASH');
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Feedback Systems
  const [feedbackQueue, setFeedbackQueue] = useState<FeedbackEvent[]>([]);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  
  // HUD/UI State
  const [showStore, setShowStore] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  
  // Bounty State
  const [activeBounties, setActiveBounties] = useState<DailyBounty[]>([]);
  const [completedBountyIds, setCompletedBountyIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<{id: string, text: string, subtext?: string}[]>([]);

  // Refs for logic
  const dragStartRef = useRef<{x: number, y: number} | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLevelRef = useRef(state.level);
  const prevBossesRef = useRef(state.runStats.bossesDefeated);
  const prevGridSizeRef = useRef(state.gridSize);

  useEffect(() => {
     loadCriticalAssets((p) => {
         setLoadingProgress(p);
         if (p >= 100) {
             setTimeout(() => setIsLoading(false), 500);
             loadBackgroundAssets();
         }
     });
     const failsafe = setTimeout(() => setIsLoading(false), 8000);
     const profile = getPlayerProfile();
     setActiveBounties(profile.activeBounties || []);
     setCompletedBountyIds(profile.activeBounties.filter(b => b.isCompleted).map(b => b.id));
     return () => clearTimeout(failsafe);
  }, []);

  useEffect(() => {
      if (!isLoading && view === 'GAME' && state.gameMode !== 'DAILY') {
          localStorage.setItem('2048_rpg_state_v3', JSON.stringify(state));
      }
  }, [state, isLoading, view]);

  // --- GAMEPLAY FEEDBACK MONITORING ---
  useEffect(() => {
      if (view !== 'GAME') return;

      // 1. Level Up Feedback
      if (state.level > prevLevelRef.current) {
          prevLevelRef.current = state.level;
          setFeedbackQueue(prev => [...prev, {
              id: uuidv4(),
              type: 'LEVEL_UP',
              title: `Rank ${state.level}`,
              subtitle: 'Stats Increased'
          }]);
          audioService.playLevelUp();
      }

      // 2. Grid Expand Feedback
      if (state.gridSize > prevGridSizeRef.current) {
          prevGridSizeRef.current = state.gridSize;
          setFeedbackQueue(prev => [...prev, {
              id: uuidv4(),
              type: 'GRID_EXPAND',
              title: 'Grid Expanded',
              subtitle: 'More space, more strategy'
          }]);
      }

      // 3. Boss Kill Feedback
      if (state.runStats.bossesDefeated > prevBossesRef.current) {
          prevBossesRef.current = state.runStats.bossesDefeated;
          setFeedbackQueue(prev => [...prev, {
              id: uuidv4(),
              type: 'BOSS_KILLED',
              title: 'Boss Slain',
              reward: '+500 Gold'
          }]);
      }

      // 4. Tutorial Logic
      const profile = getPlayerProfile();
      if (!profile.tutorialCompleted && state.stats.totalMoves < 5 && !showTutorial && state.gameMode === 'RPG') {
          setShowTutorial(true);
      }

  }, [state.level, state.gridSize, state.runStats.bossesDefeated, state.grid, view]);

  // Bounty Check
  useEffect(() => {
      if (view !== 'GAME' || state.gameMode === 'CLASSIC') return;
      activeBounties.forEach(bounty => {
          if (completedBountyIds.includes(bounty.id)) return;
          let achieved = false;
          if (bounty.description.includes("Score")) {
              if (state.score >= bounty.targetValue) achieved = true;
          } else {
              const runVal = state.runStats[bounty.targetStat] as number;
              if (runVal >= bounty.targetValue) achieved = true;
          }
          if (achieved) {
              setCompletedBountyIds(prev => [...prev, bounty.id]);
              const notifId = uuidv4();
              setNotifications(prev => [...prev, { id: notifId, text: "Bounty Complete!", subtext: bounty.description }]);
              audioService.playLevelUp();
              setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== notifId)), 4000);
          }
      });
  }, [state.score, state.runStats, activeBounties, completedBountyIds, view]);

  // Audio Logic
  useEffect(() => {
      if (view === 'GAME' && !state.gameOver) audioService.playGameplayTheme();
      else if (view === 'VERSUS') audioService.playGameplayTheme(); 
      else if (state.gameOver) audioService.playDeathTheme();
      else if (view === 'SPLASH') audioService.playSplashTheme();
  }, [view, state.gameOver]);

  // Audio Intensity
  useEffect(() => {
      if (view === 'GAME' && !state.gameOver) {
          // Normalize combo: 0-8 -> 0-1
          // Higher combo = sharper audio (higher cutoff)
          const intensity = Math.min(1, state.combo / 8);
          audioService.updateGameplayIntensity(intensity);
      }
  }, [state.combo, view, state.gameOver]);

  // Input Handling
  useEffect(() => {
      if (view !== 'GAME') return;

      const handleStart = (clientX: number, clientY: number) => { dragStartRef.current = { x: clientX, y: clientY }; };
      
      const handleEnd = (clientX: number, clientY: number) => {
          if (!dragStartRef.current || !state.settings.enableSwipe) return;
          const dx = clientX - dragStartRef.current.x;
          const dy = clientY - dragStartRef.current.y;
          const threshold = (state.settings.sensitivity || 5) * 10;
          if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
              if (state.gameOver || state.isCascading || showStore || showStats || showTutorial) {
                  dragStartRef.current = null;
                  return;
              }
              let direction: Direction | null = null;
              if (Math.abs(dx) > Math.abs(dy)) direction = dx > 0 ? Direction.RIGHT : Direction.LEFT;
              else direction = dy > 0 ? Direction.DOWN : Direction.UP;
              if (direction) {
                   if (state.settings.invertSwipe) {
                       if (direction === Direction.UP) direction = Direction.DOWN;
                       else if (direction === Direction.DOWN) direction = Direction.UP;
                       else if (direction === Direction.LEFT) direction = Direction.RIGHT;
                       else if (direction === Direction.RIGHT) direction = Direction.LEFT;
                   }
                   dispatch({ type: 'MOVE', direction });
              }
          }
          dragStartRef.current = null;
      };

      // Wheel Handler for Trackpad
      const handleWheel = (e: WheelEvent) => {
          if (!state.settings.enableScroll) return;
          if (scrollTimeoutRef.current) return; // Debounce
          if (state.gameOver || state.isCascading || showStore || showStats || showTutorial) return;

          // Threshold for wheel
          if (Math.abs(e.deltaX) > 20 || Math.abs(e.deltaY) > 20) {
              let direction: Direction | null = null;
              if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                  direction = e.deltaX > 0 ? Direction.RIGHT : Direction.LEFT;
              } else {
                  direction = e.deltaY > 0 ? Direction.DOWN : Direction.UP;
              }

              if (direction) {
                  if (state.settings.invertScroll) {
                       if (direction === Direction.UP) direction = Direction.DOWN;
                       else if (direction === Direction.DOWN) direction = Direction.UP;
                       else if (direction === Direction.LEFT) direction = Direction.RIGHT;
                       else if (direction === Direction.RIGHT) direction = Direction.LEFT;
                  }
                  dispatch({ type: 'MOVE', direction });
                  scrollTimeoutRef.current = setTimeout(() => { scrollTimeoutRef.current = null; }, 300);
              }
          }
      };

      const onTouchStart = (e: TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY);
      const onTouchEnd = (e: TouchEvent) => handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      const onMouseDown = (e: MouseEvent) => handleStart(e.clientX, e.clientY);
      const onMouseUp = (e: MouseEvent) => handleEnd(e.clientX, e.clientY);
      
      window.addEventListener('touchstart', onTouchStart, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
      window.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('wheel', handleWheel); // Add Wheel Listener

      return () => {
          window.removeEventListener('touchstart', onTouchStart);
          window.removeEventListener('touchend', onTouchEnd);
          window.removeEventListener('mousedown', onMouseDown);
          window.removeEventListener('mouseup', onMouseUp);
          window.removeEventListener('wheel', handleWheel);
      };
  }, [view, state.gameOver, state.isCascading, showStore, showStats, state.settings, showTutorial]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!state.settings.enableKeyboard) return;
        if (e.ctrlKey && e.key === '`') { setShowDebug(prev => !prev); return; }
        if (showTutorial) return; // Block input during tutorial
        if (state.gameOver || view !== 'GAME' || state.isCascading || showStore || showStats) return;
        switch(e.key) {
            case 'ArrowUp': case 'w': case 'W': dispatch({ type: 'MOVE', direction: Direction.UP }); break;
            case 'ArrowDown': case 's': case 'S': dispatch({ type: 'MOVE', direction: Direction.DOWN }); break;
            case 'ArrowLeft': case 'a': case 'A': dispatch({ type: 'MOVE', direction: Direction.LEFT }); break;
            case 'ArrowRight': case 'd': case 'D': dispatch({ type: 'MOVE', direction: Direction.RIGHT }); break;
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.gameOver, view, state.isCascading, showStore, showStats, state.settings, showTutorial]);

  // Cascade Logic
  useEffect(() => {
      if (state.isCascading && view === 'GAME') {
          const timer = setTimeout(() => {
               const res = executeAutoCascade(state.grid, state.gridSize, state.cascadeStep || 0, state.effectCounters);
               if (res.occurred) {
                   dispatch({ type: 'CASCADE_STEP', payload: { grid: res.grid, rewards: res.rewards } });
                   audioService.playCascade(state.cascadeStep || 0);
               } else {
                   dispatch({ type: 'CASCADE_COMPLETE' });
               }
          }, 300); 
          return () => clearTimeout(timer);
      }
  }, [state.isCascading, state.grid, state.cascadeStep, view]);

  const dismissTutorial = () => {
      setShowTutorial(false);
      completeTutorial();
  };

  const removeFeedback = (id: string) => {
      setFeedbackQueue(prev => prev.filter(e => e.id !== id));
  };
  
  // Calculate transient events for the Grid
  const mergeEvents = state.grid.filter(t => t.mergedFrom).map(t => ({
      id: t.id,
      x: t.x,
      y: t.y,
      value: t.value,
      type: t.type
  }));

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

  return (
    <LootProvider>
      <div className={`fixed inset-0 w-full h-[100dvh] overflow-hidden bg-black select-none cursor-default touch-none flex flex-col`}>
        {view === 'SPLASH' && (
           <SplashScreen 
              onStart={(selectedClass, mode, seed, difficulty, tileset) => {
                  audioService.resume(); 
                  if (mode === 'VERSUS') setView('VERSUS');
                  else {
                      dispatch({ type: 'RESTART', selectedClass, mode, seed, difficulty, tileset });
                      setView('GAME');
                  }
              }} 
              onContinue={() => { audioService.resume(); setView('GAME'); }}
              onOpenLeaderboard={() => setView('LEADERBOARD')}
              onOpenSettings={() => setView('SETTINGS')}
              onOpenHelp={() => setView('HELP')}
              onOpenGrimoire={() => setView('GRIMOIRE')}
              hasSave={state.score > 0} 
            />
        )}
        
        {view === 'LEADERBOARD' && <Leaderboard onBack={() => setView('SPLASH')} />}
        {view === 'HELP' && <HelpScreen onBack={() => setView('SPLASH')} />}
        {view === 'VERSUS' && <VersusGame onBack={() => setView('SPLASH')} />}
        {view === 'GRIMOIRE' && (
            <Grimoire 
                profile={getPlayerProfile()} // In a real app we'd likely pass state, but this works for direct storage access
                onBack={() => setView('SPLASH')}
                onSelectTileset={(id) => {
                    // Force re-render of this view or relying on storage sync next mount
                }}
            />
        )}
        {view === 'SETTINGS' && <Settings 
              settings={state.settings}
              onUpdateSettings={(s) => dispatch({ type: 'UPDATE_SETTINGS', settings: s })}
              onBack={() => setView('SPLASH')} 
              onClearData={() => { dispatch({ type: 'RESTART' }); setView('SPLASH'); }}
        />}

        {view === 'GAME' && (
          <>
            {/* Background Layers */}
            <motion.div 
            className="fixed inset-0 z-0 bg-cover bg-center"
            key={state.currentStage.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, scale: 1.1 }}
            transition={{ duration: 1.5 }}
            style={{ backgroundImage: `url('${state.currentStage.backgroundUrl}')` }}
            >
              <div className={`absolute inset-0 bg-black/60 ${state.level >= 30 ? 'bg-black/80' : ''}`}></div>
              <div className={`absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80`}></div>
              {!state.settings.lowPerformanceMode && (
                  <div className="fog-wrapper"><div className="fog-piece"></div><div className="fog-piece"></div></div>
              )}
              {!state.settings.lowPerformanceMode && <div className="scanlines"></div>}
              <div className="vignette"></div>
            </motion.div>

            <AmbientBackground lowPerformanceMode={state.settings.lowPerformanceMode} />
            {!state.settings.lowPerformanceMode && <div className="fog-layer"></div>}

            {/* FEEDBACK OVERLAYS */}
            <FeedbackLayer events={feedbackQueue} onDismiss={removeFeedback} />
            {showTutorial && <TutorialOverlay onDismiss={dismissTutorial} />}

            {/* Notification Toasts */}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[90] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
              <AnimatePresence>
                  {notifications.map(n => (
                      <motion.div
                          key={n.id}
                          initial={{ opacity: 0, y: -20, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="bg-slate-900/90 border border-yellow-500/50 rounded-xl p-3 shadow-2xl flex items-center gap-3 backdrop-blur-md"
                      >
                          <div className="bg-yellow-500/20 p-2 rounded-full text-yellow-400"><CheckCircle size={20} /></div>
                          <div>
                              <div className="text-yellow-400 font-bold text-sm uppercase tracking-wide">{n.text}</div>
                              {n.subtext && <div className="text-slate-300 text-xs">{n.subtext}</div>}
                          </div>
                      </motion.div>
                  ))}
              </AnimatePresence>
            </div>

            {/* MAIN LAYOUT - Fixed Centering & Scaling */}
            <div className={`relative z-10 flex flex-col h-full w-full mx-auto pb-safe
                max-w-md md:max-w-xl lg:max-w-3xl xl:max-w-4xl
                ${shakeIntensity === 1 ? 'animate-shake-sm' : ''}
                ${shakeIntensity === 2 ? 'animate-shake-md' : ''}
                ${shakeIntensity === 3 ? 'animate-shake-lg chromatic-shake' : ''}
            `}>
                {/* Header HUD */}
                <div className="flex-none px-2 pt-2 z-40">
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
                        combo={state.combo}
                        onOpenStore={() => setShowStore(true)}
                        onUseItem={(item) => dispatch({ type: 'USE_ITEM', item })}
                        onReroll={() => dispatch({ type: 'REROLL' })}
                        onMenu={() => setView('SPLASH')}
                        onOpenStats={() => setShowStats(true)}
                    />
                </div>

                {/* Grid Container - Responsive & Centered */}
                <div className="flex-1 flex flex-col items-center justify-center p-2 md:p-4 min-h-0">
                    <div className="aspect-square w-full max-w-full max-h-full relative shadow-2xl rounded-xl">
                        <Grid 
                            grid={state.grid} 
                            size={state.gridSize} 
                            mergeEvents={mergeEvents} 
                            lootEvents={state.lootEvents || []} 
                            slideSpeed={state.settings.slideSpeed || 150}
                            themeId={state.currentStage.themeId}
                            lowPerformanceMode={state.settings.lowPerformanceMode}
                            combo={state.combo}
                            tilesetId={state.tilesetId}
                        />
                    </div>
                </div>
            </div>

            {/* Modal Layers */}
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
                <VictoryScreen 
                    gameState={state} 
                    onContinue={() => dispatch({ type: 'CONTINUE' })}
                    onHome={() => setView('SPLASH')}
                />
            )}
          </>
        )}
      </div>
    </LootProvider>
  );
};

export default App;
