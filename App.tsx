
import React, { useEffect, useReducer, useRef, useState } from 'react';
import { Grid } from './components/Grid';
import { HUD } from './components/HUD';
import { Store } from './components/Store';
import { Direction, GameState, TileType, InventoryItem, FloatingText } from './types';
import { initializeGame, moveGrid, spawnTile, getEmptyCells, isGameOver, checkLoot, useInventoryItem } from './services/gameLogic';
import { SHOP_ITEMS, getXpThreshold, getStage, getStageBackground } from './constants';
import { audioService } from './services/audioService';
import { Volume2, VolumeX, AlertTriangle, Crown, RefreshCw } from 'lucide-react';

// Actions
type Action = 
  | { type: 'MOVE'; direction: Direction }
  | { type: 'RESTART' }
  | { type: 'CONTINUE' }
  | { type: 'LOAD_GAME'; state: GameState }
  | { type: 'BUY_ITEM'; item: typeof SHOP_ITEMS[0] }
  | { type: 'USE_ITEM'; item: InventoryItem }
  | { type: 'CLEAR_LOGS' };

const reducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'RESTART':
      return initializeGame();
      
    case 'LOAD_GAME':
      return action.state;

    case 'CONTINUE':
      return { ...state, victory: false, gameWon: true };
    
    case 'CLEAR_LOGS':
        return { ...state, logs: [] };

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
      
      localStorage.setItem('2048_rpg_state_v2', JSON.stringify(newState));
      return newState;
    }

    case 'USE_ITEM': {
        const result = useInventoryItem(state, action.item);
        if (!result) return state;
        const newState = { ...state, ...result };
        localStorage.setItem('2048_rpg_state_v2', JSON.stringify(newState));
        return newState as GameState;
    }

    case 'MOVE': {
      if (state.gameOver || (state.victory && !state.gameWon)) return state;

      const { grid: movedGrid, score, xpGained, goldGained, moved, mergedIds } = moveGrid(state.grid, action.direction, state.gridSize);

      if (!moved) return state;

      audioService.playMove();

      let newGrid = movedGrid;
      let newScore = state.score + score;
      let newXp = state.xp + (xpGained * (state.level >= 7 ? 1.5 : 1));
      let newGold = state.gold + goldGained;
      let newLevel = state.level;
      let newLogs = [...state.logs];
      let newGridSize = state.gridSize;
      let newInventory = [...state.inventory];
      let currentStage = state.currentStage;
      
      if (score > 0) audioService.playMerge(score);

      // Check for Loot
      const loot = checkLoot(state.level, mergedIds);
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
        
        // Expansion Check
        if (newLevel % 5 === 0 && newGridSize < 8) {
           newGridSize++;
           newLogs.push(`Grid Expanded to ${newGridSize}x${newGridSize}!`);
        }

        // Stage Check
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
      let activeEffects = state.activeEffects || [];
      
      if (activeEffects.includes('GOLDEN_SPAWN')) {
          forcedValue = 16;
          newLogs.push("Rune activated! High tier spawn!");
          activeEffects = activeEffects.filter(e => e !== 'GOLDEN_SPAWN');
      }

      newGrid = spawnTile(newGrid, newGridSize, newLevel, forcedValue);

      // Check Victory/Loss
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
        logs: newLogs.slice(-3),
        victory: isVic,
        gameOver: isOver,
        currentStage: currentStage
      };
      
      localStorage.setItem('2048_rpg_state_v2', JSON.stringify(newState));
      return newState;
    }
    default:
      return state;
  }
};

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, null, () => initializeGame(true));
  const [muted, setMuted] = React.useState(false);
  const [showStore, setShowStore] = React.useState(false);
  
  // Visual Effects State
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [stageAnnouncement, setStageAnnouncement] = useState<string | null>(null);
  
  // Refs for tracking changes to trigger effects
  const prevXp = useRef(state.xp);
  const prevGold = useRef(state.gold);
  const prevStage = useRef(state.currentStage.name);

  // Auto-clear logs
  useEffect(() => {
    if (state.logs.length > 0) {
        const timer = setTimeout(() => {
            dispatch({ type: 'CLEAR_LOGS' });
        }, 4000);
        return () => clearTimeout(timer);
    }
  }, [state.logs]);

  // Trigger Effects on State Change
  useEffect(() => {
    const texts: FloatingText[] = [];
    const now = Date.now();

    // XP Gains
    if (state.xp > prevXp.current && state.level === state.level) { 
        const diff = state.xp - prevXp.current;
        if (diff > 0) texts.push({ id: Math.random().toString(), x: 50, y: 50, text: `+${diff} XP`, color: 'text-cyan-400', createdAt: now });
    }
    prevXp.current = state.xp;

    // Gold Gains
    if (state.gold > prevGold.current) {
        const diff = state.gold - prevGold.current;
        texts.push({ id: Math.random().toString(), x: 80, y: 40, text: `+${diff} G`, color: 'text-yellow-400', createdAt: now });
    }
    prevGold.current = state.gold;

    // Stage Change Announcement
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
    };
    window.addEventListener('keydown', handleInteract);
    window.addEventListener('touchstart', handleInteract);
    return () => {
        window.removeEventListener('keydown', handleInteract);
        window.removeEventListener('touchstart', handleInteract);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.gameOver || state.victory || showStore) return;
      
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.gameOver, state.victory, showStore]);

  const touchStart = useRef<{x: number, y: number} | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current || showStore) return;
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

  const toggleMute = () => {
    const isEnabled = audioService.toggleMute();
    setMuted(!isEnabled);
  };

  return (
    <div 
      className="min-h-screen bg-[#050505] text-slate-200 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dynamic Background */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
        style={{
            backgroundImage: `url('${state.currentStage.backgroundUrl}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.3
        }}
      />
      <div className="scanlines"></div>
      <div className="vignette"></div>
      
      {/* Floating Combat Text Container */}
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

      {/* Stage Announcement Overlay */}
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
          onRestart={() => dispatch({ type: 'RESTART' })}
          onOpenStore={() => setShowStore(true)}
          onUseItem={(item) => dispatch({ type: 'USE_ITEM', item })}
        />

        <div className="w-full h-8 mb-2 flex items-center justify-center text-xs sm:text-sm text-yellow-400/80 font-mono tracking-wide shadow-black drop-shadow-md">
          {state.logs.length > 0 ? state.logs[state.logs.length - 1] : "The dungeon awaits..."}
        </div>

        <Grid grid={state.grid} size={state.gridSize} />

        <div className="w-full mt-6 flex justify-between items-center text-slate-400 text-sm font-medium">
          <div className="flex gap-4">
            <button onClick={() => dispatch({ type: 'RESTART' })} className="hover:text-white transition-colors flex items-center gap-1">
              <RefreshCw size={14} /> Restart
            </button>
            <button onClick={toggleMute} className="hover:text-white transition-colors flex items-center gap-1">
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />} Sound
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
          onClose={() => setShowStore(false)} 
          onBuy={(item) => dispatch({ type: 'BUY_ITEM', item })} 
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
            <button 
              onClick={() => dispatch({ type: 'RESTART' })}
              className="w-full py-3 bg-red-800 hover:bg-red-700 text-white font-bold rounded border border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all"
            >
              Rise Again
            </button>
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
    </div>
  );
};

export default App;
