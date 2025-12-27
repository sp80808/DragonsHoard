import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { GameState, Direction, HeroClass, GameMode, Difficulty, FeedbackEvent, InventoryItem, LootEvent, Medal, View, AbilityType, InputSettings } from './types';
import { initializeGame, moveGrid, isGameOver, useInventoryItem, executeAutoCascade, checkAchievements, checkLoreUnlocks, spawnTile, executePowerupAction, updateCooldowns, saveHighscore, processPassiveAbilities } from './services/gameLogic';
import { audioService } from './services/audioService';
import { Grid } from './components/Grid';
import { HUD } from './components/HUD';
import { Store } from './components/Store';
import { SplashScreen } from './components/SplashScreen';
import { GameStatsModal } from './components/GameStatsModal';
import { Settings } from './components/Settings';
import { HelpScreen } from './components/HelpScreen';
import { Grimoire } from './components/Grimoire';
import { Leaderboard } from './components/Leaderboard';
import { RunSummary } from './components/RunSummary';
import { TutorialOverlay } from './components/TutorialOverlay';
import { FeedbackLayer } from './components/FeedbackLayer';
import { AmbientBackground } from './components/AmbientBackground';
import { DynamicBackground } from './components/DynamicBackground';
import { VersusGame } from './components/VersusGame';
import { MedalFeed } from './components/MedalFeed';
import { LootProvider, useLootSystem } from './components/LootSystem';
import { VictoryScreen } from './components/VictoryScreen';
import { loadCriticalAssets, loadBackgroundAssets } from './services/assetLoader';
import { getNextLevelXp, awardMedal, markHintSeen, unlockLore, getPlayerProfile, syncPlayerProfile } from './services/storageService';
import { useFullscreen } from './hooks/useFullscreen';
import { facebookService } from './services/facebookService';
import { AnimatePresence, motion } from 'framer-motion';
import { GRID_SIZE_INITIAL, SHOP_ITEMS } from './constants';
import { getStage } from './constants';
import { v4 as uuidv4 } from 'uuid';
import { Lightbulb, Sparkles } from 'lucide-react';

// Define Action Types
type Action = 
  | { type: 'MOVE', direction: Direction }
  | { type: 'START_GAME', heroClass: HeroClass, mode: GameMode, seed?: number, difficulty?: Difficulty, tileset?: string }
  | { type: 'RESTART' }
  | { type: 'USE_ITEM', item: InventoryItem }
  | { type: 'BUY_ITEM', item: any } 
  | { type: 'CRAFT_ITEM', recipe: any }
  | { type: 'TILE_INTERACT', id: string, row?: number }
  | { type: 'REROLL' }
  | { type: 'CASCADE_STEP' }
  | { type: 'UPDATE_SETTINGS', settings: InputSettings }
  | { type: 'RESTORE_STATE', state: GameState }
  | { type: 'PROCESS_PASSIVES' }
  | { type: 'CLAIM_BOUNTY', reward: number };

const gameReducer = (state: GameState, action: Action): GameState => {
    switch(action.type) {
        case 'START_GAME':
            return initializeGame(true, action.heroClass, action.mode, action.seed, action.difficulty, action.tileset);
        case 'RESTORE_STATE':
            // Ensure settings are merged correctly if new fields (like enableHaptics) are missing in saved state
            const restoredState = action.state;
            if (restoredState.settings && restoredState.settings.enableHaptics === undefined) {
                restoredState.settings.enableHaptics = true;
            }
            return restoredState;
        case 'RESTART':
            return initializeGame(true, state.selectedClass, state.gameMode, undefined, state.difficulty, state.tilesetId);
        case 'MOVE': {
            if (state.gameOver || state.gameWon || state.isCascading) return state;
            const res = moveGrid(
                state.grid, 
                action.direction, 
                state.gridSize, 
                state.gameMode, 
                state.effectCounters, 
                state.activeModifiers, 
                state.difficulty,
                state.stats
            );
            if (!res.moved) return state;

            // Trigger Move Audio
            audioService.playMove();
            if (res.score > 0) audioService.playMerge(res.score, res.combo);
            if (res.powerUpTriggered) audioService.playZap(2);

            // Haptics for Merges (Mobile Feel) - CHECK SETTING
            if (state.settings.enableHaptics && res.mergedIds.length > 0 && navigator.vibrate) {
                navigator.vibrate(50);
            }

            let newGrid = spawnTile(res.grid, state.gridSize, state.level, { 
                modifiers: state.activeModifiers,
                difficulty: state.difficulty,
                isClassic: state.gameMode === 'CLASSIC',
                powerUpChanceBonus: (state.effectCounters['LUCKY_DICE'] ? 0.1 : 0)
            });

            // Update Cooldowns (Passives charge up)
            let updatedAbilities = updateCooldowns(state.abilities);

            // Update Stats
            const newStats = { ...state.stats };
            newStats.totalMoves++;
            newStats.totalMerges += res.mergedIds.length;
            newStats.highestCombo = Math.max(newStats.highestCombo, res.combo);
            if (res.bossDefeated) newStats.bossesDefeated++;
            newStats.goldCollected += res.goldGained;

            // Achievements
            const newAchievements = checkAchievements({ ...state, stats: newStats });
            
            // Check Game Over
            const gameOver = isGameOver(newGrid, state.gridSize);
            const gameWon = newStats.highestTile >= 2048 && !state.gameWon;

            return {
                ...state,
                grid: newGrid,
                score: state.score + res.score,
                xp: state.xp + res.xpGained,
                gold: state.gold + res.goldGained,
                inventory: [...state.inventory, ...res.itemsFound],
                gameOver,
                gameWon,
                combo: res.combo,
                stats: newStats,
                lootEvents: res.lootEvents,
                lastTurnMedals: res.medalsEarned,
                abilities: updatedAbilities,
                achievements: [...state.achievements, ...newAchievements],
                logs: [...state.logs, ...res.logs].slice(-5)
            };
        }
        case 'PROCESS_PASSIVES': {
            const res = processPassiveAbilities(state);
            if (res.triggered.length === 0) return state;
            
            audioService.playZap(1); 
            return {
                ...state,
                grid: res.grid,
                abilities: res.abilities
            };
        }
        case 'USE_ITEM': {
            const result = useInventoryItem(state, action.item);
            return result ? { ...state, ...result } : state;
        }
        case 'BUY_ITEM': {
            if (state.gold < action.item.price) return state;
            const item = { 
                id: uuidv4(), 
                type: action.item.id, 
                name: action.item.name, 
                description: action.item.desc, 
                icon: action.item.icon 
            };
            return {
                ...state,
                gold: state.gold - action.item.price,
                inventory: [...state.inventory, item]
            };
        }
        case 'CRAFT_ITEM': {
             const newItem = {
                 id: uuidv4(),
                 type: action.recipe.resultId,
                 name: action.recipe.name,
                 description: action.recipe.description,
                 icon: action.recipe.icon
             };
             let newInv = [...state.inventory];
             action.recipe.ingredients.forEach((ing: any) => {
                 for(let i=0; i<ing.count; i++) {
                     const idx = newInv.findIndex(x => x.type === ing.type);
                     if (idx > -1) newInv.splice(idx, 1);
                 }
             });
             return {
                 ...state,
                 gold: state.gold - action.recipe.goldCost,
                 inventory: [...newInv, newItem]
             };
        }
        case 'TILE_INTERACT': {
            const res = executePowerupAction(state, action.id, action.row);
            return res ? { ...state, ...res } : state;
        }
        case 'REROLL': {
            if (state.rerolls <= 0 && state.gold < 50) return state;
            const cost = state.rerolls > 0 ? 0 : 50;
            const rerolls = Math.max(0, state.rerolls - 1);
            const grid = spawnTile(spawnTile([], state.gridSize, state.level), state.gridSize, state.level);
            return { ...state, grid, rerolls, gold: state.gold - cost };
        }
        case 'CASCADE_STEP': {
            const res = executeAutoCascade(state.grid, state.gridSize, state.cascadeStep || 0, state.effectCounters);
            if (res.occurred) {
                audioService.playCascade(state.cascadeStep || 0);
                return {
                    ...state,
                    grid: res.grid,
                    score: state.score + res.rewards.xp, // Score = XP for simplicity in cascade
                    xp: state.xp + res.rewards.xp,
                    gold: state.gold + res.rewards.gold,
                    cascadeStep: (state.cascadeStep || 0) + 1,
                    // Keep cascading
                };
            } else {
                return { ...state, isCascading: false, cascadeStep: 0 };
            }
        }
        case 'CLAIM_BOUNTY':
            return { ...state, gold: state.gold + action.reward };
        case 'UPDATE_SETTINGS':
            return { ...state, settings: action.settings };
        default:
            return state;
    }
};

const TIPS = [
    "Merges near Bosses deal damage to them.",
    "Save your Gold! It carries over between runs.",
    "Keep your highest value tiles in a corner.",
    "Cascades multiply your gold earnings.",
    "The 'Scorch' ability helps clear weak tiles automatically.",
    "Unlock new classes to change your starting loadout.",
    "Craft powerful items in the Forge tab of the Shop.",
    "Daily Runs offer unique modifiers and rewards.",
    "Check the Codex to track monsters you've discovered.",
    "Bosses don't move, use this to your advantage."
];

const LoadingScreen = ({ progress }: { progress: number }) => {
    const [tipIndex, setTipIndex] = useState(0);
    const [statusText, setStatusText] = useState("Initializing...");

    useEffect(() => {
        const interval = setInterval(() => {
            setTipIndex(prev => (prev + 1) % TIPS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (progress < 20) setStatusText("Forging Tiles...");
        else if (progress < 40) setStatusText("Summoning Monsters...");
        else if (progress < 60) setStatusText("Loading Environments...");
        else if (progress < 80) setStatusText("Compiling Grimoire...");
        else setStatusText("Finalizing Atmosphere...");
    }, [progress]);

    return (
        <div className="fixed inset-0 z-[999] bg-[#050505] flex flex-col items-center justify-center select-none overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a1005_0%,_#000000_100%)] opacity-50"></div>
            
            <div className="w-72 relative flex flex-col items-center z-10">
                {/* Logo or Title */}
                <div className="text-center mb-10 relative">
                    <div className="absolute inset-0 bg-red-600 blur-[60px] opacity-20 animate-pulse"></div>
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-orange-400 to-red-700 fantasy-font tracking-tighter drop-shadow-lg relative z-10">
                        DRAGON'S HOARD
                    </h1>
                </div>
                
                {/* Bar Container */}
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative shadow-2xl">
                    <div 
                        className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 transition-all duration-300 ease-out shadow-[0_0_15px_rgba(234,179,8,0.6)] relative"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute inset-0 bg-white/30 animate-[shimmer_1s_infinite]"></div>
                    </div>
                </div>
                
                {/* Status Text */}
                <div className="w-full flex justify-between mt-3 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                    <span className="text-orange-400/80 animate-pulse">{statusText}</span>
                    <span>{progress}%</span>
                </div>

                {/* Tips Section */}
                <div className="mt-12 w-full max-w-xs h-20 relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={tipIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0 flex flex-col items-center text-center"
                        >
                            <div className="flex items-center gap-2 text-yellow-500/80 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
                                <Lightbulb size={12} /> Tip
                            </div>
                            <p className="text-slate-400 text-xs font-medium leading-relaxed px-4">
                                {TIPS[tipIndex]}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
            
            {/* Version Footer */}
            <div className="absolute bottom-6 text-[9px] text-slate-700 font-mono">v0.9.9 BETA</div>
        </div>
    );
};

const GameContent: React.FC = () => {
  const [state, dispatch] = useReducer(gameReducer, initializeGame());
  const [view, setView] = useState<View>('SPLASH');
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showStore, setShowStore] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [feedbackQueue, setFeedbackQueue] = useState<FeedbackEvent[]>([]);
  const [medalQueue, setMedalQueue] = useState<{id: string, medal: Medal}[]>([]);
  const [itemFeedback, setItemFeedback] = useState<{ slot: number, status: 'SUCCESS' | 'ERROR', id: string } | undefined>(undefined);
  
  // Bounty State
  const [challengeTarget, setChallengeTarget] = useState<{score: number, name: string} | null>(null);
  const [bountyClaimed, setBountyClaimed] = useState(false);
  
  const dragStartRef = useRef<{ x: number, y: number } | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const { spawnLoot } = useLootSystem();

  // Dynamic Audio Intensity
  // We map Score 0 -> 0.0 intensity, Score 15000 -> 1.0 intensity
  useEffect(() => {
      const intensity = Math.min(1, state.score / 15000);
      audioService.updateGameplayIntensity(intensity);
  }, [state.score]);

  // Haptics Trigger for Score Milestones
  const prevScore = useRef(state.score);
  useEffect(() => {
      const scoreDiff = state.score - prevScore.current;
      if (scoreDiff >= 500 && state.settings.enableHaptics && navigator.vibrate) {
          navigator.vibrate(100);
      }
      prevScore.current = state.score;
  }, [state.score, state.settings.enableHaptics]);

  // Bounty Check Logic
  useEffect(() => {
      if (challengeTarget && !bountyClaimed && state.score > challengeTarget.score) {
          setBountyClaimed(true);
          dispatch({ type: 'CLAIM_BOUNTY', reward: 50 });
          setFeedbackQueue(prev => [...prev, {
              id: uuidv4(),
              type: 'UNLOCK',
              title: "BOUNTY CLAIMED",
              subtitle: `You beat ${challengeTarget.name}! +50 Gold`
          }]);
          audioService.playLevelUp();
          if (state.settings.enableHaptics && navigator.vibrate) navigator.vibrate([100, 50, 100]);
      }
  }, [state.score, challengeTarget, bountyClaimed, state.settings.enableHaptics]);

  // Load Assets & Init Facebook
  useEffect(() => {
      const init = async () => {
          // Failsafe: If assets take longer than 8 seconds, force start the game
          // This prevents the game from hanging on 0% or mid-way if a resource 404s
          const failsafeTimer = setTimeout(() => {
              if (loading) {
                  console.warn("Asset loading timed out, forcing start...");
                  setLoading(false);
                  facebookService.startGame();
              }
          }, 8000);

          try {
              await facebookService.initialize();
              
              // Handle Pause Events from FB (e.g. Minimized App)
              facebookService.onPause(() => {
                  audioService.suspend();
              });

              loadCriticalAssets((p) => {
                  setLoadingProgress(p);
                  facebookService.setLoadingProgress(p);
              }).then(async () => {
                  clearTimeout(failsafeTimer); // Cancel failsafe
                  await facebookService.startGame();
                  await syncPlayerProfile();
                  
                  // Check Challenge Context
                  const entry = facebookService.getEntryPointData();
                  if (entry && entry.score) {
                      setChallengeTarget({ score: entry.score, name: entry.challenger || "Challenger" });
                      setFeedbackQueue(prev => [...prev, {
                          id: uuidv4(),
                          type: 'UNLOCK', 
                          title: "BOUNTY ACCEPTED",
                          subtitle: `Beat ${entry.challenger}'s score of ${entry.score}!`
                      }]);
                  }

                  loadBackgroundAssets();
                  audioService.playSplashTheme();
                  
                  // Slight delay to ensure the progress bar looks complete before unmounting
                  setTimeout(() => setLoading(false), 800); 
              }).catch(e => {
                  console.error("Asset load failed", e);
                  clearTimeout(failsafeTimer);
                  // Force start anyway
                  setLoading(false);
                  facebookService.startGame();
              });
          } catch (e) {
              console.error("Critical Init Error:", e);
              clearTimeout(failsafeTimer);
              setLoading(false);
          }
      };
      init();
      
      const saved = localStorage.getItem('2048_rpg_state_v3');
      if (saved) {
          try {
              const parsed = JSON.parse(saved);
              if (parsed && !parsed.gameOver) {
                  dispatch({ type: 'RESTORE_STATE', state: parsed });
              }
          } catch(e) {}
      }
  }, []);

  // Audio & Persistence
  useEffect(() => {
      if (view === 'GAME') {
          audioService.playGameplayTheme();
          localStorage.setItem('2048_rpg_state_v3', JSON.stringify(state));
      } else if (view === 'SPLASH') {
          audioService.playSplashTheme();
      }
  }, [view, state]);

  // Clear Item Feedback after delay
  useEffect(() => {
      if (itemFeedback) {
          const timer = setTimeout(() => setItemFeedback(undefined), 1000);
          return () => clearTimeout(timer);
      }
  }, [itemFeedback]);

  // Handle Passives Check after Move
  useEffect(() => {
      if (!state.gameOver && !state.gameWon && !state.isCascading) {
          dispatch({ type: 'PROCESS_PASSIVES' });
      }
  }, [state.stats.totalMoves]);

  // Handle Cascade
  useEffect(() => {
      if (state.isCascading) {
          const timer = setTimeout(() => {
              dispatch({ type: 'CASCADE_STEP' });
          }, 250);
          return () => clearTimeout(timer);
      }
  }, [state.isCascading]);

  // Handle Input
  useEffect(() => {
      if (view !== 'GAME') return;

      const handleStart = (clientX: number, clientY: number) => { dragStartRef.current = { x: clientX, y: clientY }; };
      
      const handleEnd = (clientX: number, clientY: number) => {
          if (!dragStartRef.current || !state.settings.enableSwipe) return;
          const dx = clientX - dragStartRef.current.x;
          const dy = clientY - dragStartRef.current.y;
          const sensitivity = state.settings.sensitivity || 5;
          const threshold = 80 - (sensitivity * 6);
          const safeThreshold = Math.max(15, threshold); 

          if (Math.abs(dx) > safeThreshold || Math.abs(dy) > safeThreshold) {
              if (state.gameOver || state.isCascading || showStore || showStats || showTutorial || feedbackQueue.length > 0) {
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

      const handleWheel = (e: WheelEvent) => {
          if (!state.settings.enableScroll) return;
          if (scrollTimeoutRef.current) return; 
          if (state.gameOver || state.isCascading || showStore || showStats || showTutorial || feedbackQueue.length > 0) return;

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

      const onTouchStart = (e: TouchEvent) => {
          e.preventDefault(); 
          handleStart(e.touches[0].clientX, e.touches[0].clientY);
      };
      const onTouchEnd = (e: TouchEvent) => {
          e.preventDefault();
          handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      };
      
      const onMouseDown = (e: MouseEvent) => handleStart(e.clientX, e.clientY);
      const onMouseUp = (e: MouseEvent) => handleEnd(e.clientX, e.clientY);
      
      window.addEventListener('touchstart', onTouchStart, { passive: false });
      window.addEventListener('touchend', onTouchEnd, { passive: false });
      window.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('wheel', handleWheel);

      return () => {
          window.removeEventListener('touchstart', onTouchStart);
          window.removeEventListener('touchend', onTouchEnd);
          window.removeEventListener('mousedown', onMouseDown);
          window.removeEventListener('mouseup', onMouseUp);
          window.removeEventListener('wheel', handleWheel);
      };
  }, [view, state.gameOver, state.isCascading, showStore, showStats, state.settings, showTutorial, feedbackQueue.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!state.settings.enableKeyboard) return;
        if (showTutorial) return; 
        if (state.gameOver || view !== 'GAME' || state.isCascading || showStore || showStats || feedbackQueue.length > 0) return;
        
        switch(e.key) {
            case 'ArrowUp': case 'w': case 'W': dispatch({ type: 'MOVE', direction: Direction.UP }); break;
            case 'ArrowDown': case 's': case 'S': dispatch({ type: 'MOVE', direction: Direction.DOWN }); break;
            case 'ArrowLeft': case 'a': case 'A': dispatch({ type: 'MOVE', direction: Direction.LEFT }); break;
            case 'ArrowRight': case 'd': case 'D': dispatch({ type: 'MOVE', direction: Direction.RIGHT }); break;
            case '1': 
                if (state.inventory[0]) {
                    dispatch({ type: 'USE_ITEM', item: state.inventory[0] });
                    setItemFeedback({ slot: 0, status: 'SUCCESS', id: uuidv4() });
                } else {
                    setItemFeedback({ slot: 0, status: 'ERROR', id: uuidv4() });
                }
                break;
            case '2': 
                if (state.inventory[1]) {
                    dispatch({ type: 'USE_ITEM', item: state.inventory[1] });
                    setItemFeedback({ slot: 1, status: 'SUCCESS', id: uuidv4() });
                } else {
                    setItemFeedback({ slot: 1, status: 'ERROR', id: uuidv4() });
                }
                break;
            case '3': 
                if (state.inventory[2]) {
                    dispatch({ type: 'USE_ITEM', item: state.inventory[2] });
                    setItemFeedback({ slot: 2, status: 'SUCCESS', id: uuidv4() });
                } else {
                    setItemFeedback({ slot: 2, status: 'ERROR', id: uuidv4() });
                }
                break;
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.gameOver, view, state.isCascading, showStore, showStats, state.settings, showTutorial, feedbackQueue.length, state.inventory]);

  // Process Medals & Events
  useEffect(() => {
      if (state.lastTurnMedals && state.lastTurnMedals.length > 0) {
          state.lastTurnMedals.forEach(m => {
              setMedalQueue(prev => [...prev, { id: uuidv4(), medal: m }]);
              awardMedal(m.id);
          });
      }
      
      const profile = getPlayerProfile();
      const lore = checkLoreUnlocks(state, profile);
      lore.forEach(l => {
          if (unlockLore(l.id)) {
             setFeedbackQueue(prev => [...prev, { id: uuidv4(), type: 'LORE_UNLOCK', title: l.title }]);
          }
      });
  }, [state.lastTurnMedals, state.stats]);

  // Handle Medal Queue Timer
  useEffect(() => {
      if (medalQueue.length > 0) {
          const timer = setTimeout(() => {
              setMedalQueue(prev => prev.slice(1));
          }, 2000);
          return () => clearTimeout(timer);
      }
  }, [medalQueue]);

  if (loading) {
      return <LoadingScreen progress={loadingProgress} />;
  }

  // View Routing
  const renderView = () => {
      switch(view) {
          case 'SPLASH':
              return (
                <SplashScreen 
                    onStart={(cls, mode, seed, diff, tileset) => {
                        dispatch({ type: 'START_GAME', heroClass: cls, mode, seed, difficulty: diff, tileset });
                        setView('GAME');
                        setShowTutorial(true); 
                        // Start Bounty Check if fresh start
                        setBountyClaimed(false);
                    }}
                    onContinue={() => setView('GAME')}
                    onOpenLeaderboard={() => setView('LEADERBOARD')}
                    onOpenSettings={() => setView('SETTINGS')}
                    onOpenHelp={() => setView('HELP')}
                    onOpenGrimoire={() => setView('GRIMOIRE')}
                    hasSave={!!localStorage.getItem('2048_rpg_state_v3')}
                />
              );
          case 'LEADERBOARD': return <Leaderboard onBack={() => setView('SPLASH')} />;
          case 'SETTINGS': return <Settings settings={state.settings} onUpdateSettings={(s) => dispatch({ type: 'UPDATE_SETTINGS', settings: s })} onBack={() => setView('SPLASH')} onClearData={() => { localStorage.removeItem('2048_rpg_state_v3'); setView('SPLASH'); }} />;
          case 'HELP': return <HelpScreen onBack={() => setView('SPLASH')} />;
          case 'GRIMOIRE': return <Grimoire profile={getPlayerProfile()} onBack={() => setView('SPLASH')} onSelectTileset={(id) => dispatch({ type: 'START_GAME', heroClass: state.selectedClass, mode: state.gameMode, tileset: id })} />;
          case 'VERSUS': return <VersusGame onBack={() => setView('SPLASH')} />;
          case 'GAME':
              return (
                <>
                    {/* Full Screen Dynamic Environmental Background */}
                    <DynamicBackground score={state.score} />
                    
                    {/* Fallback Ambient Layer for Particles */}
                    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                        <AmbientBackground graphicsQuality={state.settings.graphicsQuality} />
                    </div>

                    <div className="relative w-full h-full max-w-lg mx-auto flex flex-col p-2 md:p-4 z-10">
                        <div className="relative z-10 flex flex-col h-full">
                            <HUD 
                                score={state.score}
                                bestScore={Math.max(state.score, state.bestScore)}
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
                                justLeveledUp={state.justLeveledUp}
                                activeModifiers={state.activeModifiers}
                                shopState={state.shop}
                                challengeTarget={!bountyClaimed ? challengeTarget : null}
                                onOpenStore={() => setShowStore(true)}
                                onUseItem={(item) => {
                                    const idx = state.inventory.indexOf(item);
                                    if (idx > -1) setItemFeedback({ slot: idx, status: 'SUCCESS', id: uuidv4() });
                                    dispatch({ type: 'USE_ITEM', item });
                                }}
                                onReroll={() => dispatch({ type: 'REROLL' })}
                                onMenu={() => setView('SPLASH')}
                                onOpenStats={() => setShowStats(true)}
                                itemFeedback={itemFeedback}
                            />
                            
                            <div className="flex-1 flex flex-col justify-center relative">
                                 <Grid 
                                    grid={state.grid} 
                                    size={state.gridSize} 
                                    mergeEvents={[]} 
                                    lootEvents={state.lootEvents}
                                    slideSpeed={state.settings.slideSpeed} 
                                    themeId={state.currentStage.themeId}
                                    graphicsQuality={state.settings.graphicsQuality}
                                    combo={state.combo}
                                    tilesetId={state.tilesetId}
                                    onTileClick={state.targetingMode ? (id, row) => dispatch({ type: 'TILE_INTERACT', id, row }) : undefined}
                                 />
                            </div>
                        </div>
                        
                        {/* Overlays */}
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
                                nextLevelXp={getNextLevelXp(state.accountLevel)} 
                            />
                        )}
                        
                        {showTutorial && <TutorialOverlay onDismiss={() => setShowTutorial(false)} />}
                        <FeedbackLayer events={feedbackQueue} onDismiss={(id) => setFeedbackQueue(q => q.filter(e => e.id !== id))} />
                        <MedalFeed queue={medalQueue} />
                        
                        {(state.gameOver || state.gameWon) && (
                            state.gameWon ? 
                            <VictoryScreen gameState={state} onContinue={() => dispatch({ type: 'RESTORE_STATE', state: { ...state, gameWon: false } })} onHome={() => setView('SPLASH')} /> :
                            <RunSummary gameState={state} onRestart={() => dispatch({ type: 'RESTART' })} onShowLeaderboard={() => setView('LEADERBOARD')} onHome={() => setView('SPLASH')} />
                        )}
                    </div>
                </>
              );
      }
  };

  return <>{renderView()}</>;
};

const App: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-[#050505] text-slate-200 font-sans overflow-hidden select-none">
        <LootProvider>
            <GameContent />
        </LootProvider>
    </div>
  );
};

export default App;