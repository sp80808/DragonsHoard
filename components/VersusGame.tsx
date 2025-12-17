import React, { useReducer, useEffect, useState } from 'react';
import { Grid } from './Grid';
import { Direction, Tile, TileType } from '../types';
import { moveGrid, spawnTile, isGameOver } from '../services/gameLogic';
import { audioService } from '../services/audioService';
import { Swords, ArrowLeft, Zap, Skull, Crown, Flame, Shield, Gauge, Settings, Play } from 'lucide-react';

interface VersusGameProps {
  onBack: () => void;
}

type VersusPowerup = 'ATTACK' | 'DEFENSE' | 'SPEED';
type WinCondition = 'SURVIVAL' | 'SCORE';

interface PlayerState {
  id: number;
  grid: Tile[];
  score: number;
  mana: number; // 0-100
  gameOver: boolean;
  gridSize: number;
  mergeEvents: any[];
  pendingAttacks: number;
  inventory: VersusPowerup[]; // Max 2
  activeBuffs: { type: 'MANA_SURGE'; duration: number }[]; // duration in moves
  lastActionText?: string;
  combo: number;
}

interface VersusState {
  p1: PlayerState;
  p2: PlayerState;
  winner: number | null;
  countDown: number | null;
  gameActive: boolean;
  winCondition: WinCondition;
  targetScore: number;
}

const INITIAL_GRID_SIZE = 4;
const MANA_TO_ATTACK = 100;

const POWERUPS: Record<VersusPowerup, { name: string, icon: React.ReactNode, color: string }> = {
    ATTACK: { name: "Pyroblast", icon: <Flame size={16} />, color: "text-red-500" },
    DEFENSE: { name: "Purify", icon: <Shield size={16} />, color: "text-blue-400" },
    SPEED: { name: "Mana Surge", icon: <Gauge size={16} />, color: "text-yellow-400" }
};

const initPlayer = (id: number): PlayerState => {
    let grid = spawnTile([], INITIAL_GRID_SIZE, 1, { isClassic: true });
    grid = spawnTile(grid, INITIAL_GRID_SIZE, 1, { isClassic: true });
    return {
        id,
        grid,
        score: 0,
        mana: 0,
        gameOver: false,
        gridSize: INITIAL_GRID_SIZE,
        mergeEvents: [],
        pendingAttacks: 0,
        inventory: [],
        activeBuffs: [],
        combo: 0
    };
};

const versusReducer = (state: VersusState, action: any): VersusState => {
    switch (action.type) {
        case 'INIT_GAME': {
            return {
                ...state,
                p1: initPlayer(1),
                p2: initPlayer(2),
                winner: null,
                countDown: 3,
                gameActive: true,
                winCondition: action.condition,
                targetScore: action.target
            };
        }

        case 'USE_POWERUP': {
            const { player, slot } = action;
            const isP1 = player === 1;
            const p = isP1 ? state.p1 : state.p2;
            const opponent = isP1 ? state.p2 : state.p1;
            
            if (p.inventory.length <= slot) return state;

            const powerup = p.inventory[slot];
            const newInventory = [...p.inventory];
            newInventory.splice(slot, 1);

            let newP = { ...p, inventory: newInventory };
            let newOpponent = { ...opponent };

            // Apply Effect
            if (powerup === 'ATTACK') {
                newOpponent.pendingAttacks += 3;
                newP.lastActionText = "PYROBLAST!";
                audioService.playBomb();
            } else if (powerup === 'DEFENSE') {
                newP.grid = newP.grid.filter(t => t.type !== TileType.STONE);
                newP.lastActionText = "PURIFIED!";
                audioService.playLevelUp();
            } else if (powerup === 'SPEED') {
                newP.activeBuffs = [...newP.activeBuffs, { type: 'MANA_SURGE', duration: 20 }];
                newP.lastActionText = "MANA SURGE!";
                audioService.playZap(3);
            }

            return {
                ...state,
                p1: isP1 ? newP : newOpponent,
                p2: isP1 ? newOpponent : newP
            };
        }

        case 'MOVE': {
            if (state.winner || !state.gameActive) return state;
            const { player, dir } = action;
            const isP1 = player === 1;
            const currentPlayer = isP1 ? state.p1 : state.p2;
            const opponent = isP1 ? state.p2 : state.p1;

            if (currentPlayer.gameOver) return state;

            const res = moveGrid(currentPlayer.grid, dir, currentPlayer.gridSize, 'CLASSIC', {});
            if (!res.moved) return state;

            audioService.playMove();
            if (res.score > 0) audioService.playMerge(res.score, 0);

            let manaMultiplier = 1;
            const nextBuffs = currentPlayer.activeBuffs
                .map(b => ({ ...b, duration: b.duration - 1 }))
                .filter(b => {
                    if (b.type === 'MANA_SURGE') manaMultiplier = 2;
                    return b.duration > 0;
                });

            const manaGain = Math.floor(res.score * 0.25 * manaMultiplier);
            let newMana = currentPlayer.mana + manaGain;
            let attacksToSend = 0;
            let itemGranted: VersusPowerup | null = null;

            while (newMana >= MANA_TO_ATTACK) {
                newMana -= MANA_TO_ATTACK;
                attacksToSend++;
                
                if (currentPlayer.inventory.length < 2) {
                    const roll = Math.random();
                    if (roll < 0.4) itemGranted = 'ATTACK';
                    else if (roll < 0.7) itemGranted = 'SPEED';
                    else itemGranted = 'DEFENSE';
                }
            }

            let nextGrid = spawnTile(res.grid, currentPlayer.gridSize, 1, { isClassic: true });

            if (currentPlayer.pendingAttacks > 0) {
                const pending = currentPlayer.pendingAttacks;
                for (let i = 0; i < pending; i++) {
                    const gridBeforeStone = nextGrid;
                    nextGrid = spawnTile(nextGrid, currentPlayer.gridSize, 1, { type: TileType.STONE, forcedValue: 0 });
                    if (gridBeforeStone === nextGrid) break; 
                }
                currentPlayer.pendingAttacks = 0; 
                audioService.playBossSpawn(); 
            }

            if (res.mergedIds.length > 0) {
                const mergedTiles = nextGrid.filter(t => res.mergedIds.includes(t.id));
                const stones = nextGrid.filter(t => t.type === TileType.STONE);
                let stonesDestroyed = false;

                const survivors = stones.filter(stone => {
                    const isAdjacent = mergedTiles.some(m => Math.abs(m.x - stone.x) + Math.abs(m.y - stone.y) === 1);
                    if (isAdjacent) {
                        stonesDestroyed = true;
                        return false; 
                    }
                    return true;
                });

                if (stonesDestroyed) {
                    nextGrid = nextGrid.filter(t => t.type !== TileType.STONE || survivors.includes(t));
                    audioService.playCrunch();
                }
            }

            const gameOver = isGameOver(nextGrid, currentPlayer.gridSize);
            
            const nextP: PlayerState = {
                ...currentPlayer,
                grid: nextGrid,
                score: currentPlayer.score + res.score,
                mana: newMana,
                gameOver,
                mergeEvents: res.mergedIds.length > 0 ? res.grid.filter(t => res.mergedIds.includes(t.id)).map(t => ({ id: t.id, x: t.x, y: t.y, value: t.value, type: t.type })) : [],
                inventory: itemGranted ? [...currentPlayer.inventory, itemGranted] : currentPlayer.inventory,
                activeBuffs: nextBuffs,
                lastActionText: itemGranted ? `Got ${POWERUPS[itemGranted].name}!` : (res.combo > 1 ? `Combo x${res.combo}` : undefined),
                combo: res.combo
            };

            const nextOpponent = {
                ...opponent,
                pendingAttacks: opponent.pendingAttacks + attacksToSend
            };

            const newState = {
                ...state,
                p1: isP1 ? nextP : nextOpponent,
                p2: isP1 ? nextOpponent : nextP
            };

            // Check Win Conditions
            let winner = null;
            
            // 1. Survival Check
            if (gameOver) {
                winner = isP1 ? 2 : 1; 
            }
            
            // 2. Score Check (if enabled)
            if (state.winCondition === 'SCORE') {
                if (nextP.score >= state.targetScore) winner = player;
            }

            if (winner) {
                newState.winner = winner;
                newState.gameActive = false;
                audioService.playDeathTheme();
            }

            return newState;
        }
        case 'RESET_TO_SETUP': return { ...state, gameActive: false, winner: null, p1: initPlayer(1), p2: initPlayer(2) };
        case 'TICK_COUNTDOWN': return { ...state, countDown: (state.countDown || 0) - 1 };
        default: return state;
    }
};

const PlayerPanel = ({ player, isActive, showKeys, isWinner, isLeader }: { player: PlayerState, isActive: boolean, showKeys: string[], isWinner: boolean, isLeader: boolean }) => {
    const manaPercent = Math.min(100, player.mana);
    const hasManaSurge = player.activeBuffs.some(b => b.type === 'MANA_SURGE');

    return (
        <div className={`flex-1 flex flex-col relative overflow-hidden transition-colors duration-500
            ${player.gameOver ? 'grayscale opacity-50' : ''}
            ${player.id === 1 ? 'border-r-2 border-slate-800' : 'border-l-2 border-slate-800'}
            bg-slate-950
        `}>
            {/* Background Ambient */}
            <div className={`absolute inset-0 opacity-10 pointer-events-none 
                ${player.id === 1 ? 'bg-gradient-to-br from-cyan-600 to-transparent' : 'bg-gradient-to-bl from-red-600 to-transparent'}
            `}></div>

            {/* Header Stats */}
            <div className="p-4 flex justify-between items-start relative z-10">
                <div>
                    <div className={`text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2 ${player.id === 1 ? 'text-cyan-400' : 'text-red-400'}`}>
                        Player {player.id}
                        {isLeader && <Crown size={14} className="text-yellow-400 animate-bounce" fill="currentColor" />}
                    </div>
                    <div className="text-4xl font-mono font-black text-white leading-none">
                        {player.score.toLocaleString()}
                    </div>
                </div>
                
                {/* Inventory Slots */}
                <div className="flex gap-2">
                    {[0, 1].map(slot => {
                        const item = player.inventory[slot];
                        const hotkey = showKeys[slot];
                        return (
                            <div key={slot} className="w-12 h-12 bg-slate-900 border border-slate-700 rounded-lg relative flex items-center justify-center">
                                <div className="absolute -top-2 -right-2 bg-slate-800 text-[9px] font-bold px-1.5 py-0.5 rounded text-slate-400 border border-slate-600">
                                    {hotkey}
                                </div>
                                {item ? (
                                    <div className={`animate-in zoom-in ${POWERUPS[item].color}`}>
                                        {POWERUPS[item].icon}
                                    </div>
                                ) : (
                                    <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Notifications Area */}
            <div className="h-8 flex items-center justify-center relative z-20">
                {player.pendingAttacks > 0 && (
                    <div className="flex items-center gap-2 bg-red-900/80 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse border border-red-500">
                        <Skull size={12} /> INCOMING: {player.pendingAttacks}
                    </div>
                )}
                {player.lastActionText && player.pendingAttacks === 0 && (
                    <div key={player.lastActionText} className="text-yellow-400 font-bold text-sm animate-[floatUp_0.8s_ease-out_forwards]">
                        {player.lastActionText}
                    </div>
                )}
            </div>

            {/* Grid Area */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div className={`relative aspect-square w-full max-w-[380px] shadow-2xl rounded-xl ring-4 transition-all duration-300
                    ${player.pendingAttacks > 0 ? 'ring-red-500/50 animate-shake-sm' : (player.id === 1 ? 'ring-cyan-900/50' : 'ring-red-900/50')}
                `}>
                    <Grid 
                        grid={player.grid} 
                        size={player.gridSize} 
                        mergeEvents={player.mergeEvents} 
                        lootEvents={[]} 
                        slideSpeed={100}
                        themeId={player.id === 1 ? "CRYSTAL" : "MAGMA"}
                        lowPerformanceMode={false}
                        combo={player.combo}
                    />
                    
                    {/* Game Over Overlay */}
                    {player.gameOver && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-xl z-20">
                            <h3 className="text-3xl font-black text-red-600 -rotate-12 border-4 border-red-600 p-2 rounded">DEFEATED</h3>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Mana Bar */}
            <div className="p-4 relative z-10">
                <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-2">
                        <Zap size={16} className={manaPercent >= 100 ? "text-yellow-400 animate-pulse" : "text-slate-500"} fill={manaPercent >= 100 ? "currentColor" : "none"} />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Mana {hasManaSurge && <span className="text-yellow-400 animate-pulse">(2x SURGE)</span>}
                        </span>
                    </div>
                    <span className="text-xs font-mono text-slate-500">{Math.floor(player.mana)} / {MANA_TO_ATTACK}</span>
                </div>
                <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700 relative">
                    <div 
                        className={`h-full transition-all duration-200 ${player.id === 1 ? 'bg-cyan-500' : 'bg-red-500'} ${hasManaSurge ? 'brightness-150 shadow-[0_0_10px_white]' : ''}`} 
                        style={{ width: `${manaPercent}%` }}
                    ></div>
                    {/* Threshold Lines */}
                    <div className="absolute top-0 bottom-0 left-1/4 w-px bg-black/20"></div>
                    <div className="absolute top-0 bottom-0 left-2/4 w-px bg-black/20"></div>
                    <div className="absolute top-0 bottom-0 left-3/4 w-px bg-black/20"></div>
                </div>
                <div className="mt-2 text-[10px] text-slate-600 text-center">
                    Fill Mana to Attack • Collect Powerups
                </div>
            </div>
        </div>
    );
}

// Setup Screen Component
const VersusSetup = ({ onStart, onBack }: { onStart: (mode: WinCondition, target: number) => void, onBack: () => void }) => {
    const [mode, setMode] = useState<WinCondition>('SURVIVAL');
    const [target, setTarget] = useState<number>(10000);

    return (
        <div className="flex flex-col items-center justify-center h-full w-full max-w-md mx-auto p-6 animate-in fade-in zoom-in duration-500">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-red-500 fantasy-font mb-8 drop-shadow-sm">
                VERSUS SETUP
            </h1>

            <div className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl p-6 space-y-6 backdrop-blur-md shadow-2xl">
                
                {/* Mode Select */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Victory Condition</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => setMode('SURVIVAL')}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all
                                ${mode === 'SURVIVAL' ? 'bg-red-900/40 border-red-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}
                            `}
                        >
                            <Skull size={24} />
                            <span className="font-bold text-sm">SURVIVAL</span>
                        </button>
                        <button 
                            onClick={() => setMode('SCORE')}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all
                                ${mode === 'SCORE' ? 'bg-yellow-900/40 border-yellow-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}
                            `}
                        >
                            <Crown size={24} />
                            <span className="font-bold text-sm">SCORE RACE</span>
                        </button>
                    </div>
                </div>

                {/* Score Target (Conditional) */}
                {mode === 'SCORE' && (
                    <div className="space-y-3 animate-in slide-in-from-top-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Target Score</label>
                        <div className="flex justify-between bg-slate-800 rounded-lg p-1">
                            {[5000, 10000, 25000].map(val => (
                                <button
                                    key={val}
                                    onClick={() => setTarget(val)}
                                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all
                                        ${target === val ? 'bg-yellow-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}
                                    `}
                                >
                                    {val.toLocaleString()}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="pt-4 space-y-3">
                    <button 
                        onClick={() => onStart(mode, target)}
                        className="w-full py-4 bg-gradient-to-r from-red-600 to-cyan-600 hover:from-red-500 hover:to-cyan-500 text-white font-black text-lg rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        <Play fill="currentColor" /> START BATTLE
                    </button>
                    <button onClick={onBack} className="w-full py-3 text-slate-500 hover:text-white font-bold text-sm">
                        CANCEL
                    </button>
                </div>
            </div>
        </div>
    );
};

export const VersusGame: React.FC<VersusGameProps> = ({ onBack }) => {
    const [state, dispatch] = useReducer(versusReducer, { 
        p1: initPlayer(1), 
        p2: initPlayer(2), 
        winner: null, 
        countDown: 3,
        gameActive: false,
        winCondition: 'SURVIVAL',
        targetScore: 10000
    });

    useEffect(() => {
        if (state.countDown !== null && state.countDown > 0 && state.gameActive) {
            const timer = setTimeout(() => dispatch({ type: 'TICK_COUNTDOWN' }), 1000);
            return () => clearTimeout(timer);
        } else if (state.countDown === 0) {
             const timer = setTimeout(() => dispatch({ type: 'TICK_COUNTDOWN' }), 500); 
             return () => clearTimeout(timer);
        }
    }, [state.countDown, state.gameActive]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!state.gameActive || (state.countDown !== null && state.countDown >= 0)) return;
            
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }

            switch(e.key) {
                // Player 1 (WASD + Q/E)
                case 'w': case 'W': dispatch({ type: 'MOVE', player: 1, dir: Direction.UP }); break;
                case 's': case 'S': dispatch({ type: 'MOVE', player: 1, dir: Direction.DOWN }); break;
                case 'a': case 'A': dispatch({ type: 'MOVE', player: 1, dir: Direction.LEFT }); break;
                case 'd': case 'D': dispatch({ type: 'MOVE', player: 1, dir: Direction.RIGHT }); break;
                case 'q': case 'Q': dispatch({ type: 'USE_POWERUP', player: 1, slot: 0 }); break;
                case 'e': case 'E': dispatch({ type: 'USE_POWERUP', player: 1, slot: 1 }); break;
                
                // Player 2 (Arrows + / .)
                case 'ArrowUp': dispatch({ type: 'MOVE', player: 2, dir: Direction.UP }); break;
                case 'ArrowDown': dispatch({ type: 'MOVE', player: 2, dir: Direction.DOWN }); break;
                case 'ArrowLeft': dispatch({ type: 'MOVE', player: 2, dir: Direction.LEFT }); break;
                case 'ArrowRight': dispatch({ type: 'MOVE', player: 2, dir: Direction.RIGHT }); break;
                case '/': case '?': dispatch({ type: 'USE_POWERUP', player: 2, slot: 0 }); break;
                case '.': case '>': dispatch({ type: 'USE_POWERUP', player: 2, slot: 1 }); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [state.countDown, state.winner, state.gameActive]);

    useEffect(() => {
        if (state.p1.mergeEvents.length > 0) setTimeout(() => { state.p1.mergeEvents = []; }, 200);
        if (state.p2.mergeEvents.length > 0) setTimeout(() => { state.p2.mergeEvents = []; }, 200);
    });

    if (!state.gameActive && !state.winner) {
        return <VersusSetup onStart={(c, t) => dispatch({ type: 'INIT_GAME', condition: c, target: t })} onBack={onBack} />;
    }

    return (
        <div className="fixed inset-0 w-full h-full bg-[#050505] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 relative z-40">
                <button onClick={() => dispatch({ type: 'RESET_TO_SETUP' })} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
                    <Settings size={16} /> Setup
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 opacity-50">
                    <Swords size={20} className="text-white" />
                    <span className="text-xs font-bold text-slate-400 tracking-[0.2em]">
                        {state.winCondition === 'SURVIVAL' ? 'SURVIVAL MODE' : `RACE TO ${state.targetScore.toLocaleString()}`}
                    </span>
                </div>
                <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
                    <ArrowLeft size={16} /> Exit
                </button>
            </div>

            {/* Game Area */}
            <div className="flex-1 flex relative">
                
                {/* VS Divider */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-800 z-30 flex flex-col items-center justify-center">
                    <div className="bg-slate-900 border border-slate-700 p-2 rounded-full">
                        <span className="text-slate-500 font-black text-xs">VS</span>
                    </div>
                </div>

                <PlayerPanel 
                    player={state.p1} 
                    isActive={true} 
                    showKeys={['Q', 'E']} 
                    isWinner={state.winner === 1}
                    isLeader={state.p1.score > state.p2.score}
                />
                
                <PlayerPanel 
                    player={state.p2} 
                    isActive={true} 
                    showKeys={['/', '.']} 
                    isWinner={state.winner === 2}
                    isLeader={state.p2.score > state.p1.score}
                />
            </div>

            {/* Countdown Overlay */}
            {state.countDown !== null && state.countDown >= 0 && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="text-9xl font-black text-white fantasy-font animate-bounce drop-shadow-[0_0_50px_rgba(255,255,255,0.5)]">
                        {state.countDown === 0 ? "FIGHT!" : state.countDown}
                    </div>
                </div>
            )}

            {/* Winner Overlay */}
            {state.winner && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in zoom-in">
                    <div className="mb-8 relative text-center">
                        <Crown size={80} className={`mx-auto mb-4 animate-bounce ${state.winner === 1 ? 'text-cyan-400' : 'text-red-500'}`} fill="currentColor" />
                        <h2 className={`text-6xl md:text-8xl font-black fantasy-font tracking-tighter ${state.winner === 1 ? 'text-cyan-400' : 'text-red-500'} drop-shadow-[0_0_30px_currentColor]`}>
                            PLAYER {state.winner} WINS
                        </h2>
                        <p className="text-slate-400 mt-4 text-xl font-bold uppercase tracking-widest">
                            {state.winCondition === 'SURVIVAL' ? 'Last Hero Standing' : `Target Score Reached`}
                        </p>
                    </div>
                    
                    <div className="flex gap-4">
                        <button 
                            onClick={() => dispatch({ type: 'INIT_GAME', condition: state.winCondition, target: state.targetScore })} 
                            className="px-8 py-4 bg-white text-black font-black text-lg rounded-xl hover:bg-gray-200 hover:scale-105 transition-all shadow-xl flex items-center gap-2"
                        >
                            <Swords size={20} /> REMATCH
                        </button>
                        <button 
                            onClick={() => dispatch({ type: 'RESET_TO_SETUP' })}
                            className="px-8 py-4 bg-slate-800 text-white font-bold text-lg rounded-xl hover:bg-slate-700 transition-all flex items-center gap-2"
                        >
                            <Settings size={20} /> SETTINGS
                        </button>
                        <button 
                            onClick={onBack}
                            className="px-8 py-4 bg-transparent border-2 border-white/20 text-white font-bold text-lg rounded-xl hover:bg-white/10 hover:border-white transition-all"
                        >
                            MENU
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};