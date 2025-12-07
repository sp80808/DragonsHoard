
import React, { useEffect, useReducer, useRef, useState } from 'react';
import { Grid } from './components/Grid';
import { HUD } from './components/HUD';
import { Store } from './components/Store';
import { SplashScreen } from './components/SplashScreen';
import { Leaderboard } from './components/Leaderboard';
import { Settings } from './components/Settings';
import { Direction, GameState, TileType, InventoryItem, FloatingText, CraftingRecipe, View, Achievement } from './types';
import { initializeGame, moveGrid, spawnTile, isGameOver, checkLoot, useInventoryItem, applyMidasTouch, applyChronosShift, applyVoidSingularity, tryAutoMerge, saveHighscore, checkAchievements, savePersistentAchievements } from './services/gameLogic';
import { SHOP_ITEMS, getXpThreshold, getStage, getStageBackground, getItemDefinition } from './constants';
import { audioService } from './services/audioService';
import { AlertTriangle, Crown, RefreshCw, Trophy } from 'lucide-react';

// Actions
type Action = 
  | { type: 'MOVE'; direction: Direction }
  | { type: 'RESTART' }
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
  | { type: 'UNLOCK_ACHIEVEMENT'; achievement: Achievement };

const reducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'RESTART':
      return initializeGame();
      
    case 'LOAD_GAME':
      return action.state;

    case 'CONTINUE':
      return { ...state, victory: false, gameWon: true };
    
    case 'GAME_OVER_ACK':
        saveHighscore(state);
        return state;

    case 'CLEAR_LOGS':
        return { ...state, logs: [] };

    case 'UNLOCK_ACHIEVEMENT':
        const newAchievements = [...state.achievements, action.achievement.id];
        savePersistentAchievements(newAchievements); // Save to persistent storage
        return {
            ...state,
            achievements: newAchievements,
            gold: state.gold + (action.achievement.reward?.gold || 0),
            xp: state.xp + (action.achievement.reward?.xp || 0),
            logs: [...state.logs, `Achievement: ${action.achievement.name}`]
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
        const newState = { ...state, ...result };
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

        const rerolledGrid = spawnTile(gridWithoutLast, state.gridSize, state.level);
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
      if (state.gameOver || (state.victory && !state.gameWon) || state.powerUpEffect) return state;

      const { grid: movedGrid, score, xpGained, goldGained, moved, mergedIds, powerUpTriggered, combo, comboMultiplier, logs: moveLogs } = moveGrid(state.grid, action.direction, state.gridSize);

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

      const mergedTiles = newGrid.filter(t => mergedIds.includes(t.id));
      mergedTiles.forEach(t => {
          if (t.value === 4) newStats.slimesMerged += 1;
          
          if (t.value === 128) {
              newEffectCounters['DEMON_CURSE'] = 1;
              newLogs.push("Demon Curse! Next spawn dangerous.");
          }
      });

      if (score > 0) audioService.playMerge(score);

      if (newEffectCounters['LUCKY_LOOT'] > 0) {
          newEffectCounters['LUCKY_LOOT']--;
          if (newEffectCounters['LUCKY_LOOT'] === 0) newLogs.push("Lucky Charm expired.");
      }

      // Check for Loot
      const hasLuckyCharm = (newEffectCounters['LUCKY_LOOT'] || 0) > 0;
      const loot = checkLoot(state.level, mergedIds, hasLuckyCharm);
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

      // Handle XP & Level Up & Stage
      let threshold = getXpThreshold(newLevel);
      while (newXp >= threshold) {
        newXp -= threshold;
        newLevel++;
        newLogs.push(`LEVEL UP! You are now level ${newLevel}!`);
        audioService.playLevelUp();
        
        if (newLevel % 5 === 0 && newGridSize < 8) {
           newGridSize++;
           newLogs.push(`Grid Expanded to ${newGridSize}x${newGridSize}!`);
        }
        if (newLevel === 15) newLogs.push("Reroll Unlocked!");

        const stageConfig = getStage(newLevel);
        if (stageConfig.name !== currentStage.name) {
            currentStage = {
                name: stageConfig.name,
                minLevel: stageConfig.minLevel,
                backgroundUrl: getStageBackground(stageConfig.name),
                colorTheme: stageConfig.color
            };
            newLogs.push(`Entering ${currentStage.name}...`);
        }

        threshold = getXpThreshold(newLevel);
      }

      // Spawn new tile logic
      let forcedValue;
      let forcedType;
      
      // Boss Spawning
      const existingBoss = newGrid.find(t => t.type === TileType.BOSS);
      const shouldSpawnBoss = newLevel >= 5 && newLevel % 5 === 0 && !existingBoss && Math.random() < 0.2; 
      // Actually, let's make it deterministic or high chance on level multiples to ensure players see them
      // But avoid spawn camping. Let's say if no boss, and level % 5 == 0, 10% chance per move?
      // Or simplify: logic in spawnTile handles probability?
      // Let's force it here if condition met
      
      if (newLevel > 0 && newLevel % 5 === 0 && !existingBoss && Math.random() < 0.1) {
          forcedType = TileType.BOSS;
          newLogs.push("A BOSS APPEARED!");
      } else if (activeEffects.includes('GOLDEN_SPAWN')) {
          forcedValue = 16;
          newLogs.push("Rune activated! High tier spawn!");
          activeEffects = activeEffects.filter(e => e !== 'GOLDEN_SPAWN');
      } else if ((newEffectCounters['ASCENDANT_SPAWN'] || 0) > 0) {
          forcedValue = 16; 
          newEffectCounters['ASCENDANT_SPAWN']--;
      } else if ((newEffectCounters['DEMON_CURSE'] || 0) > 0) {
          forcedValue = 8; // Cursed spawn (Orc)
          newEffectCounters['DEMON_CURSE']--;
      }

      const gridBeforeSpawn = newGrid;
      newGrid = spawnTile(newGrid, newGridSize, newLevel, { forcedValue, type: forcedType });
      const spawnedTile = newGrid.find(t => !gridBeforeSpawn.includes(t));
      const lastSpawnedTileId = spawnedTile?.id;

      if (newLevel >= 20) {
          const auto = tryAutoMerge(newGrid);
          if (auto.success) {
              newGrid = auto.grid;
              const val = auto.value;
              newScore += val;
              newXp += val * 2 * (newLevel >= 7 ? 1.5 : 1);
              newGold += Math.ceil(val * 0.5);
              newLogs.push("⚡ Auto-Merge triggered!");
              audioService.playMerge(val);
          }
      }

      if (powerUpTriggered) {
          nextPowerUpEffect = powerUpTriggered;
      }

      const has2048 = newGrid.some(t => t.value === 2048);
      const isVic = has2048 && !state.gameWon;
      const isOver = isGameOver(newGrid, newGridSize);

      const newBest = Math.max(state.bestScore, newScore);
      if (newBest > state.bestScore) localStorage.setItem('2048_rpg_highscore', newBest.toString());
      
      const newState = {
        ...state,
        grid: newGrid,
        score: newScore,
        bestScore: newBest,
        xp: Math.floor(newXp),
        gold: newGold,
        level: newLevel,
        gridSize: newGridSize,
        inventory: newInventory,
        activeEffects: activeEffects,
        effectCounters: newEffectCounters,
        logs: newLogs.slice(-3),
        victory: isVic,
        gameOver: isOver,
        currentStage: currentStage,
        powerUpEffect: nextPowerUpEffect,
        lastSpawnedTileId,
        stats: newStats,
        combo: comboMultiplier > 1 ? combo : 0,
        achievements: state.achievements // Persisted in memory, but updated in logic
      };
      
      localStorage.setItem('2048_rpg_state_v3', JSON.stringify(newState));
      return newState;
    }
    default:
      return state;
  }
};

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, null, () => initializeGame(true));
  const [view, setView] = useState<View>('SPLASH');
  const [showStore, setShowStore] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [stageAnnouncement, setStageAnnouncement] = useState<string | null>(null);
  const [achievementToast, setAchievementToast] = useState<Achievement | null>(null);
  
  const prevXp = useRef(state.xp);
  const prevGold = useRef(state.gold);
  const prevStage = useRef(state.currentStage.name);

  // Check Achievements on state change
  useEffect(() => {
      const unlocked = checkAchievements(state);
      if (unlocked.length > 0) {
          unlocked.forEach(ach => {
             dispatch({ type: 'UNLOCK_ACHIEVEMENT', achievement: ach });
             setAchievementToast(ach); // Show last one as toast for now
             setTimeout(() => setAchievementToast(null), 4000);
          });
      }
  }, [state.stats, state.gold, state.xp]); // Trigger on relevant changes

  // Power Up Logic
  useEffect(() => {
    if (state.powerUpEffect) {
        const timer = setTimeout(() => {
            let result: Partial<GameState> = {};
            let logs = [...state.logs];
            
            if (state.powerUpEffect === TileType.RUNE_MIDAS) {
                 const { grid, score } = applyMidasTouch(state.grid);
                 result.grid = grid;
                 result.score = state.score + score;
                 result.xp = state.xp + (score * 2);
                 logs.push("Midas Touch! Massive Gold!");
                 result.gold = state.gold + Math.floor(score / 4);
                 audioService.playLevelUp();
            } else if (state.powerUpEffect === TileType.RUNE_CHRONOS) {
                 result.grid = applyChronosShift(state.grid, state.gridSize);
                 logs.push("Time Shift! Grid Reordered.");
                 audioService.playMove();
            } else if (state.powerUpEffect === TileType.RUNE_VOID) {
                 const { grid, score } = applyVoidSingularity(state.grid, state.gridSize);
                 result.grid = grid;
                 result.score = state.score + score;
                 logs.push("Void Consumed the Board...");
                 audioService.playBomb();
            }
            
            result.logs = logs;
            dispatch({ type: 'APPLY_POWERUP_RESULT', resultState: result });
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [state.powerUpEffect, state.grid, state.score, state.xp, state.gold, state.logs, state.gridSize]);

  useEffect(() => {
    if (state.logs.length > 0) {
        const timer = setTimeout(() => {
            dispatch({ type: 'CLEAR_LOGS' });
        }, 4000);
        return () => clearTimeout(timer);
    }
  }, [state.logs]);

  useEffect(() => {
    const texts: FloatingText[] = [];
    const now = Date.now();

    if (state.xp > prevXp.current && state.level === state.level) { 
        const diff = state.xp - prevXp.current;
        if (diff > 20) texts.push({ id: Math.random().toString(), x: 50, y: 50, text: `+${diff} XP`, color: 'text-cyan-400', createdAt: now });
    }
    prevXp.current = state.xp;

    if (state.gold > prevGold.current) {
        const diff = state.gold - prevGold.current;
        texts.push({ id: Math.random().toString(), x: 80, y: 40, text: `+${diff} G`, color: 'text-yellow-400', createdAt: now });
    }
    prevGold.current = state.gold;

    if (state.currentStage.name !== prevStage.current) {
        setStageAnnouncement(state.currentStage.name);
        setTimeout(() => setStageAnnouncement(null), 3000);
        prevStage.current = state.currentStage.name;
    }

    if (texts.length > 0) {
        setFloatingTexts(prev => [...prev, ...texts]);
        setTimeout(() => {
            setFloatingTexts(prev => prev.filter(t => t.createdAt > now));
        }, 1000);
    }
  }, [state.xp, state.gold, state.currentStage.name, state.level]);

  useEffect(() => {
    const handleInteract = () => {
      audioService.resume();
      window.removeEventListener('keydown', handleInteract);
      window.removeEventListener('touchstart', handleInteract);
      window.removeEventListener('click', handleInteract);
    };
    window.addEventListener('keydown', handleInteract);
    window.addEventListener('touchstart', handleInteract);
    window.addEventListener('click', handleInteract);
    return () => {
        window.removeEventListener('keydown', handleInteract);
        window.removeEventListener('touchstart', handleInteract);
        window.removeEventListener('click', handleInteract);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (view !== 'GAME' || state.gameOver || state.victory || showStore) return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W': e.preventDefault(); dispatch({ type: 'MOVE', direction: Direction.UP }); break;
        case 'ArrowDown':
        case 's':
        case 'S': e.preventDefault(); dispatch({ type: 'MOVE', direction: Direction.DOWN }); break;
        case 'ArrowLeft':
        case 'a':
        case 'A': e.preventDefault(); dispatch({ type: 'MOVE', direction: Direction.LEFT }); break;
        case 'ArrowRight':
        case 'd':
        case 'D': e.preventDefault(); dispatch({ type: 'MOVE', direction: Direction.RIGHT }); break;
        case 'Escape': setView('SETTINGS'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.gameOver, state.victory, showStore, view]);

  const touchStart = useRef<{x: number, y: number} | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current || showStore || view !== 'GAME') return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) > 30) {
      if (absDx > absDy) {
        dispatch({ type: 'MOVE', direction: dx > 0 ? Direction.RIGHT : Direction.LEFT });
      } else {
        dispatch({ type: 'MOVE', direction: dy > 0 ? Direction.DOWN : Direction.UP });
      }
    }
    touchStart.current = null;
  };

  const handleGameStart = () => { dispatch({ type: 'RESTART' }); setView('GAME'); };
  const handleContinue = () => { setView('GAME'); };
  const handleRestart = () => { dispatch({ type: 'RESTART' }); setView('GAME'); };

  return (
    <div 
      className="min-h-screen bg-[#050505] text-slate-200 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
        style={{
            backgroundImage: `url('${state.currentStage.backgroundUrl}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: view === 'GAME' ? 0.3 : 0.1
        }}
      />
      <div className="scanlines"></div>
      <div className="vignette"></div>
      
      {view === 'SPLASH' && (
          <SplashScreen 
            onStart={handleGameStart} 
            onContinue={handleContinue}
            onOpenLeaderboard={() => setView('LEADERBOARD')}
            onOpenSettings={() => setView('SETTINGS')}
            hasSave={!!localStorage.getItem('2048_rpg_state_v3')}
          />
      )}

      {view === 'LEADERBOARD' && <Leaderboard onBack={() => setView('SPLASH')} />}
      {view === 'SETTINGS' && <Settings onBack={() => setView(state.score > 0 ? 'GAME' : 'SPLASH')} onClearData={() => { dispatch({ type: 'RESTART' }); setView('SPLASH'); }} />}

      {view === 'GAME' && (
          <>
            <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
                {floatingTexts.map(ft => (
                    <div 
                        key={ft.id}
                        className={`absolute font-bold text-2xl floating-text ${ft.color}`}
                        style={{ left: `${ft.x}%`, top: `${ft.y}%` }}
                    >
                        {ft.text}
                    </div>
                ))}
            </div>

            {/* Achievement Toast */}
            {achievementToast && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="bg-slate-900/90 border border-yellow-500/50 rounded-lg p-4 shadow-[0_0_20px_rgba(234,179,8,0.2)] flex items-center gap-4 min-w-[300px] backdrop-blur-md">
                        <div className="text-4xl">{achievementToast.icon}</div>
                        <div>
                            <div className="text-yellow-400 font-bold uppercase text-xs tracking-wider">Achievement Unlocked</div>
                            <div className="font-bold text-white text-lg fantasy-font">{achievementToast.name}</div>
                            <div className="text-slate-400 text-xs">{achievementToast.description}</div>
                        </div>
                    </div>
                </div>
            )}

            {state.powerUpEffect === TileType.RUNE_MIDAS && <div className="absolute inset-0 z-40 bg-yellow-500/20 animate-pulse pointer-events-none border-[10px] border-yellow-400/50"></div>}
            {state.powerUpEffect === TileType.RUNE_CHRONOS && <div className="absolute inset-0 z-40 bg-blue-500/20 animate-[shake_0.5s_infinite] pointer-events-none"></div>}
            {state.powerUpEffect === TileType.RUNE_VOID && <div className="absolute inset-0 z-40 bg-purple-900/40 animate-[pulse_0.2s_infinite] pointer-events-none scale-110"></div>}

            {stageAnnouncement && (
                <div className="absolute inset-0 z-50 flex items-center justify-center stage-transition pointer-events-none">
                    <div className="bg-black/80 px-8 py-4 rounded-xl border-y-2 border-yellow-500/50 backdrop-blur-sm">
                        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-500 fantasy-font tracking-widest uppercase text-center">
                            {stageAnnouncement}
                        </h2>
                    </div>
                </div>
            )}

            <div className="relative z-10 w-full max-w-md flex flex-col items-center">
                <HUD 
                    score={state.score} 
                    bestScore={state.bestScore} 
                    level={state.level} 
                    xp={state.xp} 
                    gold={state.gold}
                    inventory={state.inventory}
                    rerolls={state.rerolls}
                    onOpenStore={() => setShowStore(true)}
                    onUseItem={(item) => dispatch({ type: 'USE_ITEM', item })}
                    onReroll={() => dispatch({ type: 'REROLL' })}
                    onMenu={() => setView('SETTINGS')}
                />

                {state.combo > 1 && (
                    <div className="absolute top-[165px] z-20 text-center animate-bounce">
                        <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-red-600 drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
                            {state.combo}x COMBO!
                        </div>
                    </div>
                )}

                <div className="w-full h-8 mb-2 flex items-center justify-center text-xs sm:text-sm text-yellow-400/80 font-mono tracking-wide shadow-black drop-shadow-md">
                    {state.logs.length > 0 ? state.logs[state.logs.length - 1] : "The dungeon awaits..."}
                </div>

                <Grid grid={state.grid} size={state.gridSize} />

                <div className="w-full mt-6 flex justify-between items-center text-slate-400 text-sm font-medium">
                    <div className="flex gap-4">
                        <button onClick={handleRestart} className="hover:text-white transition-colors flex items-center gap-1">
                            <RefreshCw size={14} /> Restart
                        </button>
                    </div>
                    <div className={`hidden sm:block ${state.currentStage.colorTheme} transition-colors duration-500`}>
                        Location: {state.currentStage.name}
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
                />
            )}

            {state.gameOver && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-500">
                    <div className="bg-slate-900/50 p-8 rounded-2xl border border-red-900/50 shadow-2xl text-center max-w-sm w-full backdrop-blur-md">
                        <AlertTriangle className="mx-auto text-red-600 mb-4 animate-bounce" size={48} />
                        <h2 className="text-3xl font-bold text-red-500 mb-2 fantasy-font">DEFEAT</h2>
                        <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-slate-300">
                            <div className="bg-slate-950 p-2 rounded border border-slate-800">Score: {state.score}</div>
                            <div className="bg-slate-950 p-2 rounded border border-slate-800">Lvl: {state.level}</div>
                        </div>
                        <div className="space-y-3">
                            <button 
                                onClick={handleRestart}
                                className="w-full py-3 bg-red-800 hover:bg-red-700 text-white font-bold rounded border border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all"
                            >
                                Rise Again
                            </button>
                            <button 
                                onClick={() => { dispatch({type: 'GAME_OVER_ACK'}); setView('LEADERBOARD'); }}
                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded border border-slate-600 transition-all"
                            >
                                Leaderboard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {state.victory && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-1000">
                    <div className="bg-slate-900/80 p-8 rounded-2xl border border-yellow-500/50 shadow-2xl text-center max-w-sm w-full backdrop-blur-md">
                        <Crown className="mx-auto text-yellow-400 mb-4 animate-pulse" size={64} />
                        <h2 className="text-3xl font-bold text-yellow-400 mb-2 fantasy-font">GOD SLAIN</h2>
                        <p className="text-yellow-200/60 mb-8 font-serif italic">The cycle continues...</p>
                        <div className="space-y-3">
                            <button 
                                onClick={() => dispatch({ type: 'CONTINUE' })}
                                className="w-full py-3 bg-yellow-700 hover:bg-yellow-600 text-white font-bold rounded border border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)]"
                            >
                                Continue Endless
                            </button>
                        </div>
                    </div>
                </div>
            )}
          </>
      )}
    </div>
  );
};

export default App;
