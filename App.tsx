
import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { GameState, Direction, HeroClass, GameMode, Difficulty, FeedbackEvent, InventoryItem, LootEvent, Medal, View, AbilityType, InputSettings, TileType } from './types';
import { initializeGame, moveGrid, isGameOver, useInventoryItem, executeAutoCascade, checkAchievements, checkLoreUnlocks, spawnTile, executePowerupAction, updateCooldowns, saveHighscore, processPassiveAbilities, createId, processClassAbilities } from './services/gameLogic';
import { audioService } from './services/audioService';
import { Grid } from './components/Grid';
import { HUD, HUDHeader, HUDControls, BuffDisplay } from './components/HUD';
import { Store } from './components/Store';
import { SplashScreen } from './components/SplashScreen';
import { GameStatsModal } from './components/GameStatsModal';
import { Settings } from './components/Settings';
import { HelpScreen } from './components/HelpScreen';
import { Grimoire } from './components/Grimoire';
import { SkillTree } from './components/SkillTree';
import { Leaderboard } from './components/Leaderboard';
import { RunSummary } from './components/RunSummary';
import { TutorialOverlay } from './components/TutorialOverlay';
import { FeedbackLayer } from './components/FeedbackLayer';
import { AmbientBackground } from './components/AmbientBackground';
import { DynamicBackground } from './components/DynamicBackground';
import { VersusGame } from './components/VersusGame';
import { MedalFeed } from './components/MedalFeed';
import { ComboMeter } from './components/ComboMeter';
import { LootProvider, useLootSystem } from './components/LootSystem';
import { VictoryScreen } from './components/VictoryScreen';
import { DailyLoginModal } from './components/DailyLoginModal';
import { CascadeTutorial } from './components/CascadeTutorial'; 
import { GauntletMap } from './components/GauntletMap'; 
import { unlockNextLayer, getRandomArtifact } from './services/gauntletService'; 
import { loadCriticalAssets, loadBackgroundAssets } from './services/assetLoader';
import { getNextLevelXp, awardMedal, markHintSeen, unlockLore, getPlayerProfile, syncPlayerProfile, checkDailyLoginStatus, claimDailyReward, completeTutorial } from './services/storageService';
import { useFullscreen } from './hooks/useFullscreen';
import { useOrientation } from './hooks/useOrientation';
import { facebookService } from './services/facebookService';
import { AnimatePresence, motion } from 'framer-motion';
import { GRID_SIZE_INITIAL, SHOP_ITEMS } from './constants';
import { getStage } from './constants';
import { Lightbulb, Sparkles } from 'lucide-react';
import { supabase } from './src/utils/supabase';

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
  | { type: 'SELECT_GAUNTLET_NODE', nodeId: string } 
  | { type: 'COMPLETE_GAUNTLET_LEVEL' } 
  | { type: 'CLAIM_BOUNTY', reward: number }
  | { type: 'INVALID_MOVE' }
  | { type: 'CLEAR_INVALID_MOVE' }
  | { type: 'CLAIM_DAILY_LOGIN' }
  | { type: 'CLEAR_LOOT_EVENTS' }
  | { type: 'CLEAR_MERGE_EVENTS' }
  | { type: 'COMPLETE_TUTORIAL_REWARD' }; 

const TURN_BASED_EFFECTS = ['MIDAS_POTION', 'CHAIN_CATALYST', 'VOID_STONE', 'RADIANT_AURA', 'FLOW_STATE', 'HARMONIC_RESONANCE', 'LUCKY_LOOT', 'LUCKY_DICE'];

const gameReducer = (state: GameState, action: Action): GameState => {
    switch(action.type) {
        case 'START_GAME':
            return initializeGame(true, action.heroClass, action.mode, action.seed, action.difficulty, action.tileset);
        case 'RESTORE_STATE':
            const restoredState = action.state;
            if (restoredState.settings && restoredState.settings.enableHaptics === undefined) {
                restoredState.settings.enableHaptics = true;
            }
            if (restoredState.baselineAccountXp === undefined) {
                const profile = getPlayerProfile();
                restoredState.baselineAccountXp = profile.totalAccountXp;
            }
            if (!restoredState.mergeEvents) restoredState.mergeEvents = [];
            return restoredState;
        case 'RESTART':
            return initializeGame(true, state.selectedClass, state.gameMode, undefined, state.difficulty, state.tilesetId);
        
        case 'SELECT_GAUNTLET_NODE': {
            if (!state.gauntlet) return state;
            const node = state.gauntlet.map.find(n => n.id === action.nodeId);
            if (!node || node.status !== 'AVAILABLE') return state;

            let newGrid = spawnTile([], state.gridSize, 1, { isClassic: true });
            newGrid = spawnTile(newGrid, state.gridSize, 1, { isClassic: true });
            
            if (node.type === 'TREASURE') {
                const artifact = getRandomArtifact();
                return {
                    ...state,
                    gauntlet: {
                        ...state.gauntlet,
                        artifacts: [...state.gauntlet.artifacts, artifact]
                    }
                };
            }

            return {
                ...state,
                grid: newGrid
            };
        }

        case 'COMPLETE_GAUNTLET_LEVEL': {
            if (!state.gauntlet) return state;
            const currentTierNodes = state.gauntlet.map.filter(n => n.tier === state.gauntlet!.currentTier && n.status === 'AVAILABLE');
            const activeNode = currentTierNodes[0]; 

            if (activeNode) {
                const nextGauntlet = unlockNextLayer(state.gauntlet, activeNode.id);
                return {
                    ...state,
                    gauntlet: nextGauntlet,
                    grid: [], 
                    gameWon: false 
                };
            }
            return state;
        }

        case 'MOVE': {
            if (state.gameOver || state.gameWon) return state;
            
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
            if (!res.moved) {
                return { ...state, isInvalidMove: true };
            }

            audioService.playMove();
            if (res.score > 0) audioService.playMerge(res.score, res.combo, res.mergedIds.length > 0 ? Math.max(...res.grid.filter(t => res.mergedIds.includes(t.id)).map(t => t.value)) : 0);
            if (res.powerUpTriggered) audioService.playZap(2);

            if (state.settings.enableHaptics && res.mergedIds.length > 0 && navigator.vibrate) {
                navigator.vibrate(50);
            }

            const nextEffectCounters = { ...state.effectCounters };
            TURN_BASED_EFFECTS.forEach(key => {
                if (nextEffectCounters[key] > 0) {
                    nextEffectCounters[key]--;
                }
            });
            
            // Reduce Class Ability Cooldown
            const nextAbilities = { ...state.abilities };
            Object.keys(nextAbilities).forEach(key => {
                const k = key as AbilityType;
                if (nextAbilities[k].currentCooldown > 0) {
                    nextAbilities[k].currentCooldown--;
                }
            });

            let newGrid = spawnTile(res.grid, state.gridSize, state.level, { 
                modifiers: state.activeModifiers,
                difficulty: state.difficulty,
                isClassic: state.gameMode === 'CLASSIC',
                powerUpChanceBonus: (nextEffectCounters['LUCKY_DICE'] ? 0.1 : 0)
            });

            const bossSpawned = newGrid.some(t => t.type === TileType.BOSS && t.isNew);
            if (bossSpawned) {
                audioService.playBossSpawn();
                if (state.settings.enableHaptics && navigator.vibrate) {
                    navigator.vibrate([100, 50, 100, 50, 200]);
                }
            }

            const newStats = { ...state.stats };
            newStats.totalMoves++;
            newStats.totalMerges += res.mergedIds.length;
            newStats.highestCombo = Math.max(newStats.highestCombo, res.combo);
            if (res.bossDefeated) newStats.bossesDefeated++;
            newStats.goldCollected += res.goldGained;

            const newAchievements = checkAchievements({ ...state, stats: newStats });
            
            const gameOver = isGameOver(newGrid, state.gridSize);
            const gameWon = newStats.highestTile >= 2048 && !state.gameWon;

            let gauntletWin = false;
            if (state.gameMode === 'GAUNTLET') {
                if (newStats.highestTile >= 512) gauntletWin = true;
            }

            const nextXp = state.xp + res.xpGained;
            const currentTotalXp = (state.baselineAccountXp || 0) + nextXp;
            let nextAccountLevel = state.accountLevel;
            let leveledUp = false;
            
            while (currentTotalXp >= getNextLevelXp(nextAccountLevel)) {
                nextAccountLevel++;
                leveledUp = true;
            }
            
            if (leveledUp) {
                audioService.playLevelUp();
            }

            let shouldCascade = false;
            if (state.accountLevel >= 3 || (state.effectCounters['CHAIN_CATALYST'] || 0) > 0) {
                 shouldCascade = true;
            }

            const newMergeEvents = res.mergedIds.length > 0 
                ? res.grid.filter(t => res.mergedIds.includes(t.id)).map(t => ({
                    id: t.id,
                    x: t.x,
                    y: t.y,
                    value: t.value,
                    type: t.type,
                    isCascade: false
                })) 
                : [];

            let finalState: GameState & { currentHitstop: number } = {
                ...state,
                grid: newGrid,
                score: state.score + res.score,
                xp: nextXp,
                gold: state.gold + res.goldGained,
                accountLevel: nextAccountLevel,
                inventory: [...state.inventory, ...res.itemsFound],
                gameOver,
                gameWon: state.gameMode === 'GAUNTLET' ? gauntletWin : gameWon,
                combo: res.combo,
                stats: newStats,
                lootEvents: res.lootEvents,
                mergeEvents: newMergeEvents,
                lastTurnMedals: res.medalsEarned,
                abilities: nextAbilities,
                achievements: [...state.achievements, ...newAchievements],
                logs: [...state.logs, ...res.logs].slice(-5),
                isInvalidMove: false,
                effectCounters: nextEffectCounters,
                isCascading: shouldCascade, 
                cascadeStep: shouldCascade ? 0 : 0,
                currentHitstop: res.hitstopDuration 
            };

            // AUTO-TRIGGER CLASS ABILITY CHECK
            const abilityUpdates = processClassAbilities(finalState);
            if (abilityUpdates.grid) {
                finalState.grid = abilityUpdates.grid;
                audioService.playZap(2); // Feedback for auto-trigger
            }
            if (abilityUpdates.logs) {
                finalState.logs = [...finalState.logs, ...abilityUpdates.logs].slice(-5);
            }
            if (abilityUpdates.lootEvents) {
                finalState.lootEvents = [...finalState.lootEvents, ...abilityUpdates.lootEvents];
            }
            if (abilityUpdates.abilities) {
                finalState.abilities = abilityUpdates.abilities;
            }

            return finalState;
        }
        case 'INVALID_MOVE':
            return { ...state, isInvalidMove: true };
        case 'CLEAR_INVALID_MOVE':
            return { ...state, isInvalidMove: false };
        case 'CLEAR_LOOT_EVENTS': 
            return { ...state, lootEvents: [] };
        case 'CLEAR_MERGE_EVENTS':
            return { ...state, mergeEvents: [] };
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
                id: createId(), 
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
                 id: createId(), 
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
            const step = state.cascadeStep || 0;
            if (step > 20) {
                return { ...state, isCascading: false, cascadeStep: 0, cascadeDelay: 0 };
            }

            const res = executeAutoCascade(state.grid, state.gridSize, step, state.effectCounters);
            
            if (res.occurred) {
                let delay = 100;
                if (res.type === 'MERGE') {
                    audioService.playCascade(step);
                    delay = 400; 
                } else if (res.type === 'SPAWN') {
                    delay = 150;
                }

                const nextStep = res.type === 'MERGE' ? step + 1 : step;

                return {
                    ...state,
                    grid: res.grid,
                    score: state.score + res.rewards.xp,
                    xp: state.xp + res.rewards.xp,
                    gold: state.gold + res.rewards.gold,
                    cascadeStep: nextStep,
                    lootEvents: [...state.lootEvents, ...res.lootEvents],
                    mergeEvents: res.mergeEvents || [],
                    cascadeDelay: delay
                };
            } else {
                return { ...state, isCascading: false, cascadeStep: 0, cascadeDelay: 0 };
            }
        }
        case 'CLAIM_BOUNTY':
            return { ...state, gold: state.gold + action.reward };
        case 'CLAIM_DAILY_LOGIN': 
            return { ...state, ...claimDailyReward(state) };
        case 'COMPLETE_TUTORIAL_REWARD':
            return { ...state, xp: state.xp + 200 };
        case 'UPDATE_SETTINGS':
            return { ...state, settings: action.settings };
        default:
            return state;
    }
};

const LoadingScreen = ({ progress }: { progress: number }) => (
    <div className="fixed inset-0 z-[999] bg-[#050505] flex flex-col items-center justify-center select-none overflow-hidden">
        <div className="w-72 relative flex flex-col items-center z-10">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-orange-400 to-red-700 fantasy-font tracking-tighter drop-shadow-lg mb-10">
                DRAGON'S HOARD
            </h1>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative shadow-2xl">
                <div className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="mt-4 text-slate-500 font-mono text-xs tracking-widest animate-pulse">
                INITIALIZING... {progress}%
            </p>
        </div>
    </div>
);

const GameContent: React.FC = () => {
  const [state, dispatch] = useReducer(gameReducer, initializeGame());
  const [view, setView] = useState<View>('SPLASH');
  const [isReady, setIsReady] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showStore, setShowStore] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showCascadeTutorial, setShowCascadeTutorial] = useState(false); 
  const [feedbackQueue, setFeedbackQueue] = useState<FeedbackEvent[]>([]);
  const [medalQueue, setMedalQueue] = useState<{id: string, medal: Medal}[]>([]);
  const [itemFeedback, setItemFeedback] = useState<{ slot: number, status: 'SUCCESS' | 'ERROR', id: string } | undefined>(undefined);
  const [globalShake, setGlobalShake] = useState(false);
  const [cascadeShake, setCascadeShake] = useState(false); 
  const [showDailyLogin, setShowDailyLogin] = useState(false);
  const [showDailyTribute, setShowDailyTribute] = useState(false);
  
  const [isProcessingMove, setIsProcessingMove] = useState(false);
  const [isHitstopping, setIsHitstopping] = useState(false); 
  const [challengeTarget, setChallengeTarget] = useState<{score: number, name: string} | null>(null);
  const [bountyClaimed, setBountyClaimed] = useState(false);
  
  const dragStartRef = useRef<{ x: number, y: number } | null>(null);
  const { spawnLoot } = useLootSystem();

  const isLandscape = useOrientation(state.settings.orientation);

  useEffect(() => {
      const boot = async () => {
          try {
              await facebookService.initializeAsync();
              await loadCriticalAssets((p) => {
                  setLoadingProgress(p);
                  facebookService.setLoadingProgress(p);
              });
              await facebookService.startGameAsync();
              
              const profile = await syncPlayerProfile();
              const { canClaim } = checkDailyLoginStatus(profile);
              if (canClaim) setShowDailyLogin(true);

              const entry = facebookService.getEntryPointData();
              if (entry && entry.score) {
                  setChallengeTarget({ score: entry.score, name: entry.challenger || "Challenger" });
              }

              try {
                  const { data: tribute } = await supabase
                      .from('daily_tributes')
                      .select('*')
                      .eq('fb_user_id', facebookService.getPlayerID())
                      .single();
                  
                  if (tribute && !tribute.protected) {
                      setShowDailyTribute(true);
                  }
              } catch (err) {
                  console.warn("Tribute check skipped due to connection error.");
              }

              loadBackgroundAssets();
              audioService.playSplashTheme();
              setIsReady(true);

          } catch (e) {
              console.error("Boot Error:", e);
              setIsReady(true); 
          }
      };
      boot();

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

  // GLOBAL CHECK FOR UNSEEN TUTORIALS WHENEVER VIEW CHANGES
  useEffect(() => {
      if (view === 'SPLASH') {
          const profile = getPlayerProfile();
          if (profile.accountLevel >= 3 && !profile.cascadeTutorialSeen) {
              // Immediately show tutorial if unlocked and unseen
              setShowCascadeTutorial(true);
          }
      }
  }, [view]);

  // HITSTOP LOGIC (Fixed Dependency Race Condition)
  useEffect(() => {
      const duration = (state as any).currentHitstop;
      if (duration && duration > 0) {
          setIsHitstopping(true);
          const t = setTimeout(() => {
              setIsHitstopping(false);
              setGlobalShake(true);
              const shakeT = setTimeout(() => setGlobalShake(false), 300);
              return () => clearTimeout(shakeT);
          }, duration);
          return () => clearTimeout(t);
      }
  }, [state.stats.totalMoves]); // Only re-run when a new move actually happens

  // Failsafe to unlock board
  useEffect(() => {
      if (isHitstopping || isProcessingMove) {
          const t = setTimeout(() => {
              setIsHitstopping(false);
              setIsProcessingMove(false);
          }, 2000);
          return () => clearTimeout(t);
      }
  }, [isHitstopping, isProcessingMove]);

  useEffect(() => {
      if (state.isInvalidMove) {
          const t = setTimeout(() => {
              dispatch({ type: 'CLEAR_INVALID_MOVE' });
          }, 400);
          return () => clearTimeout(t);
      }
  }, [state.isInvalidMove]);

  useEffect(() => {
      if (state.lootEvents.length > 0) {
          const t = setTimeout(() => dispatch({ type: 'CLEAR_LOOT_EVENTS' }), 1000);
          return () => clearTimeout(t);
      }
  }, [state.lootEvents]);

  // Clean up merge events after a tick to ensure animation fires once
  useEffect(() => {
      if (state.mergeEvents && state.mergeEvents.length > 0) {
          const t = setTimeout(() => dispatch({ type: 'CLEAR_MERGE_EVENTS' }), 100);
          return () => clearTimeout(t);
      }
  }, [state.mergeEvents]);

  useEffect(() => {
      const intensity = Math.min(1, state.score / 15000);
      audioService.updateGameplayIntensity(intensity);
  }, [state.score]);

  useEffect(() => {
      const bossSpawned = state.grid.some(t => t.type === TileType.BOSS && t.isNew);
      if (bossSpawned && state.settings.enableScreenShake) {
          setGlobalShake(true);
          const t = setTimeout(() => setGlobalShake(false), 500);
          return () => clearTimeout(t);
      }
  }, [state.grid, state.settings.enableScreenShake]);

  useEffect(() => {
      if (view === 'GAME') {
          audioService.playGameplayTheme();
          localStorage.setItem('2048_rpg_state_v3', JSON.stringify(state));
      }
  }, [view, state]);

  useEffect(() => {
      if (itemFeedback) {
          const timer = setTimeout(() => setItemFeedback(undefined), 1000);
          return () => clearTimeout(timer);
      }
  }, [itemFeedback]);

  useEffect(() => {
      if (!state.gameOver && !state.gameWon && !state.isCascading) {
          dispatch({ type: 'PROCESS_PASSIVES' });
      }
  }, [state.stats.totalMoves]);

  // CASCADE LOGIC: Ensure timer resets on moves
  useEffect(() => {
      if (state.isCascading) {
          const delay = state.cascadeDelay || 250;
          const timer = setTimeout(() => {
              dispatch({ type: 'CASCADE_STEP' });
          }, delay);
          return () => clearTimeout(timer);
      }
  }, [state.isCascading, state.cascadeDelay, state.stats.totalMoves]); // Added totalMoves dependency to reset on input

  const prevCascadeStep = useRef(0);
  useEffect(() => {
      if (state.cascadeStep && state.cascadeStep > prevCascadeStep.current) {
          if (state.settings.enableScreenShake) {
              setCascadeShake(true);
              const t = setTimeout(() => setCascadeShake(false), 200);
              return () => clearTimeout(t);
          }
      }
      prevCascadeStep.current = state.cascadeStep || 0;
  }, [state.cascadeStep, state.settings.enableScreenShake]);

  const handleMove = useCallback((direction: Direction) => {
      // Allow input even if cascading to prioritize responsiveness
      if (isProcessingMove || isHitstopping || showCascadeTutorial) return; 
      
      setIsProcessingMove(true);
      dispatch({ type: 'MOVE', direction });
      setTimeout(() => setIsProcessingMove(false), state.settings.slideSpeed * 0.7); 
  }, [isProcessingMove, state.settings.slideSpeed, isHitstopping, showCascadeTutorial]);

  useEffect(() => {
      if (view !== 'GAME') return;
      const handleStart = (clientX: number, clientY: number) => { dragStartRef.current = { x: clientX, y: clientY }; };
      const handleEnd = (clientX: number, clientY: number) => {
          if (!dragStartRef.current || !state.settings.enableSwipe) return;
          const dx = clientX - dragStartRef.current.x;
          const dy = clientY - dragStartRef.current.y;
          const threshold = 50; 
          if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
              // Block swipe only for critical UI states, not cascade
              if (state.gameOver || showStore || showStats || showTutorial || showDailyLogin || showCascadeTutorial) {
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
                   handleMove(direction);
              }
          }
          dragStartRef.current = null;
      };

      const onTouchStart = (e: TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY);
      const onTouchEnd = (e: TouchEvent) => handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      const onMouseDown = (e: MouseEvent) => handleStart(e.clientX, e.clientY);
      const onMouseUp = (e: MouseEvent) => handleEnd(e.clientX, e.clientY);
      
      window.addEventListener('touchstart', onTouchStart, { passive: false });
      window.addEventListener('touchend', onTouchEnd, { passive: false });
      window.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);

      return () => {
          window.removeEventListener('touchstart', onTouchStart);
          window.removeEventListener('touchend', onTouchEnd);
          window.removeEventListener('mousedown', onMouseDown);
          window.removeEventListener('mouseup', onMouseUp);
      };
  }, [view, state.gameOver, showStore, showStats, state.settings, showTutorial, showDailyLogin, showCascadeTutorial, handleMove]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (showStore) setShowStore(false);
            else if (showStats) setShowStats(false);
            else if (view === 'GAME') setView('SPLASH');
            else if (view === 'MAP') setView('SPLASH');
            return;
        }

        if (!state.settings.enableKeyboard || showTutorial || state.gameOver || view !== 'GAME' || showStore || showStats || showCascadeTutorial || showDailyLogin) return;
        switch(e.key) {
            case 'ArrowUp': case 'w': case 'W': handleMove(Direction.UP); break;
            case 'ArrowDown': case 's': case 'S': handleMove(Direction.DOWN); break;
            case 'ArrowLeft': case 'a': case 'A': handleMove(Direction.LEFT); break;
            case 'ArrowRight': case 'd': case 'D': handleMove(Direction.RIGHT); break;
            case '1': if (state.inventory[0]) { dispatch({ type: 'USE_ITEM', item: state.inventory[0] }); setItemFeedback({ slot: 0, status: 'SUCCESS', id: createId() }); } break;
            case '2': if (state.inventory[1]) { dispatch({ type: 'USE_ITEM', item: state.inventory[1] }); setItemFeedback({ slot: 1, status: 'SUCCESS', id: createId() }); } break;
            case '3': if (state.inventory[2]) { dispatch({ type: 'USE_ITEM', item: state.inventory[2] }); setItemFeedback({ slot: 2, status: 'SUCCESS', id: createId() }); } break;
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.gameOver, view, showStore, showStats, state.settings, showTutorial, state.inventory, showCascadeTutorial, handleMove, showDailyLogin, state.gameMode]);

  // Handle Gauntlet Mode View Switch
  useEffect(() => {
      if (state.gameMode === 'GAUNTLET' && view === 'GAME' && state.grid.length === 0 && !state.gameOver) {
          // If in Gauntlet mode but grid is empty (not started level), show Map
          setView('MAP');
      }
  }, [state.gameMode, state.grid.length, state.gameOver, view]);

  if (!isReady) return <LoadingScreen progress={loadingProgress} />;

  const commonHUDProps = {
        score: state.score,
        bestScore: Math.max(state.score, state.bestScore),
        level: state.level,
        xp: state.xp,
        gold: state.gold,
        inventory: state.inventory,
        effectCounters: state.effectCounters,
        currentStage: state.currentStage,
        gameMode: state.gameMode,
        accountLevel: state.accountLevel,
        settings: state.settings,
        combo: state.combo,
        justLeveledUp: state.justLeveledUp,
        activeModifiers: state.activeModifiers,
        shopState: state.shop,
        challengeTarget: !bountyClaimed ? challengeTarget : null,
        selectedClass: state.selectedClass,
        onOpenStore: () => setShowStore(true),
        onUseItem: (item: InventoryItem) => {
            const idx = state.inventory.indexOf(item);
            if (idx > -1) setItemFeedback({ slot: idx, status: 'SUCCESS', id: createId() });
            dispatch({ type: 'USE_ITEM', item });
        },
        onMenu: () => setView('SPLASH'),
        onOpenStats: () => setView('SKILLS'),
        itemFeedback: itemFeedback,
        isLandscape: isLandscape,
        showBuffs: !isLandscape
  };

  const renderView = () => {
      switch(view) {
          case 'SPLASH':
              return (
                <>
                    <SplashScreen 
                        onStart={(cls, mode, seed, diff, tileset) => {
                            dispatch({ type: 'START_GAME', heroClass: cls, mode, seed, difficulty: diff, tileset });
                            if (mode === 'GAUNTLET') {
                                setView('MAP');
                            } else {
                                setView('GAME');
                            }
                            const p = getPlayerProfile();
                            if (!p.tutorialCompleted && mode === 'RPG') {
                                setShowTutorial(true);
                            }
                            setBountyClaimed(false);
                        }}
                        onContinue={() => setView('GAME')} // Logic might need adjustment for Gauntlet continue
                        onOpenLeaderboard={() => setView('LEADERBOARD')}
                        onOpenSettings={() => setView('SETTINGS')}
                        onOpenHelp={() => setView('HELP')}
                        onOpenGrimoire={() => setView('GRIMOIRE')}
                        onOpenVersus={() => setView('VERSUS')}
                        hasSave={!!localStorage.getItem('2048_rpg_state_v3')}
                    />
                    {showDailyTribute && (
                         <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4">
                             <div className="bg-slate-900 border border-red-600 p-6 rounded-xl text-center max-w-sm">
                                 <h2 className="text-2xl text-red-500 font-bold mb-2">TRIBUTE AT RISK!</h2>
                                 <p className="text-slate-300 mb-4">100 Gold is unprotected. Complete 1 run to secure it, or it will be stolen by goblins tonight!</p>
                                 <button 
                                    onClick={() => setShowDailyTribute(false)}
                                    className="w-full py-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg"
                                 >
                                     PROTECT MY GOLD
                                 </button>
                             </div>
                         </div>
                    )}
                    
                    {showCascadeTutorial && (
                        <CascadeTutorial 
                            onComplete={() => {
                                setShowCascadeTutorial(false);
                                dispatch({ type: 'COMPLETE_TUTORIAL_REWARD' });
                                setFeedbackQueue(prev => [...prev, { id: createId(), type: 'UNLOCK', title: 'FEATURE UNLOCKED', subtitle: 'Natural Cascades Enabled' }]);
                            }}
                        />
                    )}
                </>
              );
          case 'LEADERBOARD': return <Leaderboard onBack={() => setView('SPLASH')} />;
          case 'SETTINGS': return <Settings settings={state.settings} onUpdateSettings={(s) => dispatch({ type: 'UPDATE_SETTINGS', settings: s })} onBack={() => setView('SPLASH')} onClearData={() => { localStorage.removeItem('2048_rpg_state_v3'); setView('SPLASH'); }} />;
          case 'HELP': return <HelpScreen onBack={() => setView('SPLASH')} />;
          case 'GRIMOIRE': return <Grimoire profile={getPlayerProfile()} onBack={() => setView('SPLASH')} onSelectTileset={(id) => dispatch({ type: 'START_GAME', heroClass: state.selectedClass, mode: state.gameMode, tileset: id })} />;
          case 'VERSUS': return <VersusGame onBack={() => setView('SPLASH')} />;
          case 'SKILLS': return <SkillTree onBack={() => setView('GAME')} />;
          case 'MAP': return state.gauntlet ? (
              <GauntletMap 
                  state={state.gauntlet} 
                  onSelectNode={(id) => {
                      dispatch({ type: 'SELECT_GAUNTLET_NODE', nodeId: id });
                      setView('GAME');
                  }} 
              />
          ) : <div onClick={() => setView('SPLASH')}>Error: No Gauntlet State</div>;
          
          case 'GAME':
              return (
                <>
                    <DynamicBackground score={state.score} />
                    
                    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                        <AmbientBackground graphicsQuality={state.settings.graphicsQuality} />
                    </div>

                    <div className={`relative w-full h-full max-h-[100dvh] mx-auto flex flex-col z-10 transition-all duration-200 
                        ${state.isCascading ? 'saturate-[1.05]' : ''} 
                        ${globalShake ? 'animate-shake-lg' : ''} 
                        ${cascadeShake ? 'animate-shake-sm' : ''} 
                        ${state.isInvalidMove ? 'animate-shake-horizontal' : ''} 
                        justify-center overflow-hidden`}
                    >
                        
                        <div className="landscape:hidden shrink-0 z-30 p-2 md:p-4 pb-0 w-full max-w-xl mx-auto">
                             <HUDHeader {...commonHUDProps} />
                        </div>

                        <div className="relative z-10 flex flex-col landscape:flex-row h-full gap-4 landscape:gap-2 landscape:items-center landscape:justify-center flex-1 min-h-0">
                            
                            <div className="hidden landscape:flex landscape:w-[320px] lg:landscape:w-[400px] xl:landscape:w-[480px] landscape:h-full landscape:shrink-0 landscape:flex-col landscape:justify-center landscape:pr-2 landscape:pl-6 landscape:py-6">
                                <HUD {...commonHUDProps} />
                            </div>
                            
                            <div className="flex-1 flex flex-col items-center justify-center relative min-h-0 min-w-0 w-full h-full p-2">
                                 
                                 <div className="hidden landscape:flex w-full justify-center items-center h-16 min-h-[4rem] z-20 gap-8 mb-2 relative">
                                     <AnimatePresence>
                                        {state.combo >= 2 && <ComboMeter combo={state.combo} />}
                                     </AnimatePresence>
                                     <MedalFeed queue={medalQueue} inline={true} />
                                     
                                     <div className="absolute top-0 right-0">
                                         <BuffDisplay effectCounters={state.effectCounters} className="justify-end" />
                                     </div>
                                 </div>

                                 <div className="flex-1 w-full h-full flex items-center justify-center min-h-0">
                                     <Grid 
                                        grid={state.grid} 
                                        size={state.gridSize} 
                                        mergeEvents={state.mergeEvents || []} 
                                        lootEvents={state.lootEvents}
                                        slideSpeed={state.settings.slideSpeed} 
                                        themeId={state.currentStage.themeId}
                                        graphicsQuality={state.settings.graphicsQuality}
                                        combo={state.combo}
                                        tilesetId={state.tilesetId}
                                        onTileClick={state.targetingMode ? (id, row) => dispatch({ type: 'TILE_INTERACT', id, row }) : undefined}
                                        isHitstopping={isHitstopping}
                                     />
                                 </div>
                                 
                                 <div className="landscape:hidden absolute top-2 right-2 md:top-4 md:right-4 z-50 pointer-events-none">
                                     <AnimatePresence>
                                        {state.combo >= 2 && <ComboMeter combo={state.combo} />}
                                     </AnimatePresence>
                                 </div>
                                 <div className="landscape:hidden">
                                     <MedalFeed queue={medalQueue} />
                                 </div>
                            </div>
                        </div>

                        <div className="landscape:hidden shrink-0 z-30 p-2 pb-4 w-full max-w-xl mx-auto">
                             <div className="bg-gradient-to-t from-black/80 to-transparent pt-4 pb-1 rounded-t-2xl backdrop-blur-[2px]">
                                <HUDControls {...commonHUDProps} />
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
                                nextLevelXp={getNextLevelXp(state.accountLevel)} 
                            />
                        )}
                        
                        {showTutorial && <TutorialOverlay onDismiss={() => {
                            setShowTutorial(false);
                            completeTutorial();
                        }} />}
                        <FeedbackLayer events={feedbackQueue} onDismiss={(id) => setFeedbackQueue(q => q.filter(e => e.id !== id))} />
                        
                        {showDailyLogin && (
                            <DailyLoginModal 
                                profile={getPlayerProfile()} 
                                onClaim={() => {
                                    dispatch({ type: 'CLAIM_DAILY_LOGIN' });
                                    setShowDailyLogin(false);
                                    audioService.playLevelUp();
                                    setFeedbackQueue(prev => [...prev, { id: createId(), type: 'UNLOCK', title: 'REWARD CLAIMED', subtitle: 'Come back tomorrow!' }]);
                                }} 
                            />
                        )}
                        
                        {(state.gameOver || state.gameWon) && (
                            state.gameWon ? 
                            <VictoryScreen gameState={state} onContinue={() => {
                                if (state.gameMode === 'GAUNTLET') {
                                    dispatch({ type: 'COMPLETE_GAUNTLET_LEVEL' });
                                    setView('MAP');
                                } else {
                                    dispatch({ type: 'RESTORE_STATE', state: { ...state, gameWon: false } });
                                }
                            }} onHome={() => setView('SPLASH')} /> :
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
        <LootProvider>
            <GameContent />
        </LootProvider>
    );
};

export default App;
