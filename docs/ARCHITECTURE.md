# Architecture & Technical Documentation

## System Overview

Dragon's Hoard is built with **React + TypeScript + Vite**, using a reducer-based state management pattern for deterministic game logic.

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **UI Framework** | React | 19.2 |
| **Language** | TypeScript | 5.8 |
| **Build Tool** | Vite | 6.2 |
| **Styling** | Tailwind CSS | (included) |
| **Icons** | lucide-react | 0.556 |
| **Package Manager** | npm | - |

---

## State Management Architecture

### Game State Structure

```typescript
interface GameState {
  // Board state
  grid: Tile[];                    // Array of tiles on board
  gridSize: number;                // Current board dimensions (4-8)
  
  // Progression
  level: number;                   // Current level (1+)
  xp: number;                      // Current XP toward next level
  score: number;                   // Total points earned
  
  // Resources
  gold: number;                    // Currency
  inventory: InventoryItem[];      // Owned consumables
  
  // Game status
  gameOver: boolean;               // Game ended state
  gameWon: boolean;                // Victory achieved
  victory: boolean;                // Display victory screen
  
  // Progression tracking
  stage: string;                   // Current stage name
  stats: GameStats;                // Historical statistics
  achievements: string[];          // Unlocked achievement IDs
  
  // UI state
  logs: GameLog[];                 // Recent actions
  floatingTexts: FloatingText[];   // Temporary on-screen text
}
```

### State Mutation Pattern

All state updates follow the **reducer pattern** for predictability:

```typescript
const reducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'MOVE':
      // Calculate new grid state
      const result = moveGrid(state.grid, action.direction, state.gridSize);
      return {
        ...state,
        grid: result.grid,
        score: state.score + result.points,
        // ... other updates
      };
    
    case 'BUY_ITEM':
      if (state.gold < action.item.price) return state; // Guard
      return {
        ...state,
        gold: state.gold - action.item.price,
        inventory: [...state.inventory, newItem],
      };
    
    default:
      return state;
  }
};

const [gameState, dispatch] = useReducer(reducer, initializeGame());
```

**Benefits**:
- Deterministic updates (same action → same result)
- Easy to test (pure functions)
- Easy to debug (action history)
- Simple undo/redo implementation

---

## Core Game Logic

### Tile Merging System

**File**: `services/gameLogic.ts`

#### Move Algorithm

```typescript
export const moveGrid = (
  grid: Tile[], 
  direction: Direction, 
  size: number
): MoveResult => {
  // 1. Rotate grid if needed (convert LEFT/RIGHT to UP/DOWN)
  let rotated = rotateForDirection(grid, direction, size);
  
  // 2. Compress tiles upward (remove gaps)
  rotated = compressTiles(rotated, size);
  
  // 3. Merge adjacent identical tiles
  const { grid: merged, points: mergePoints } = mergeTiles(rotated, size);
  
  // 4. Compress again (merge creates gaps)
  rotated = compressTiles(merged, size);
  
  // 5. Rotate back to original orientation
  const final = rotateBackFromDirection(rotated, direction, size);
  
  return { grid: final, points: mergePoints };
};
```

**Merge Rules**:
- Only tiles with identical values merge
- Merged tile has value = 2 × original
- Each tile can only merge once per move
- Merging grants XP and potential loot

#### Merge Detection

```typescript
const mergeTiles = (grid: Tile[], size: number) => {
  const merged = new Set<string>(); // Track merged tile IDs
  let points = 0;
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size - 1; col++) {
      const tile1 = getTile(grid, row, col, size);
      const tile2 = getTile(grid, row, col + 1, size);
      
      // Can merge if: same value, neither already merged this turn
      if (tile1.value === tile2.value && 
          !merged.has(tile1.id) && 
          !merged.has(tile2.id)) {
        
        // Create new merged tile
        const merged = {
          ...tile1,
          value: tile1.value * 2,
          mergedFrom: [tile1.id, tile2.id],
          isNew: true,
        };
        
        merged.add(merged.id);
        points += merged.value;
        // ... update grid
      }
    }
  }
  
  return { grid, points };
};
```

### Spawning System

New tiles spawn after each move. Spawn mechanics:

```typescript
export const spawnTile = (
  grid: Tile[], 
  size: number, 
  level: number,
  options?: SpawnOptions
): Tile[] => {
  // 1. Find empty cells
  const empty = getEmptyCells(grid, size);
  if (empty.length === 0) return grid; // Board full
  
  // 2. Pick random empty cell
  const { x, y } = empty[Math.floor(Math.random() * empty.length)];
  
  // 3. Determine spawn value
  let value = 2; // Default
  if (Math.random() < 0.1) value = 4; // 10% chance of 4
  if (level >= 3 && Math.random() < 0.05) value = 4; // +5% at level 3
  
  // 4. Determine tile type
  let type = TileType.NORMAL;
  if (shouldSpawnBoss(level)) type = TileType.BOSS;
  if (shouldSpawnRune()) type = randomRune();
  
  // 5. Create tile
  const tile: Tile = {
    id: createId(),
    x, y,
    value,
    type,
    isNew: true,
  };
  
  return [...grid, tile];
};
```

**Spawn Probability Table**:
| Spawn Type | Base Rate | Modifiers |
|-----------|-----------|-----------|
| Value 2 | 80% | - |
| Value 4 | 10% | +5% at level 3+ |
| Rune (each) | 5% | - |
| Bomb | 1% | Only if not in shop |
| Boss | 1% | +1% per 5 levels |

### Boss System

Bosses are special tiles with health:

```typescript
interface BossTile extends Tile {
  type: TileType.BOSS;
  health: number;
  maxHealth: number;
}

// Health scales with level
const bossHealth = 10 + (level * 2); // Level 5 = 20 health, Level 20 = 50 health

// Merging adjacent to boss damages it
const mergeBoss = (state: GameState, mergePoints: number) => {
  const boss = state.grid.find(t => t.type === TileType.BOSS) as BossTile;
  if (!boss) return state;
  
  const damageDealt = Math.floor(mergePoints / 100);
  boss.health -= damageDealt;
  
  if (boss.health <= 0) {
    // Boss defeated
    return {
      ...state,
      grid: state.grid.filter(t => t.id !== boss.id),
      gold: state.gold + (boss.value * 2), // Boss loot bonus
      // ... achievements, stats
    };
  }
  
  return state;
};
```

### Game Over Detection

```typescript
export const isGameOver = (grid: Tile[], size: number): boolean => {
  // No empty cells AND no valid moves
  if (getEmptyCells(grid, size).length > 0) return false;
  
  // Check each direction for possible moves
  for (const direction of Object.values(Direction)) {
    const result = moveGrid(grid, direction, size);
    if (!gridEqual(result.grid, grid)) return false; // Move changed board
  }
  
  return true; // No valid moves remain
};
```

---

## Loot & Economy System

### Loot Drop Calculation

```typescript
export const checkLoot = (
  grid: Tile[],
  lastMergeValue: number,
  level: number,
  items: InventoryItem[]
): LootResult => {
  const baseLootChance = (lastMergeValue / 2048); // Higher tiles = better loot
  
  // Luck modifiers
  const luckyCharmActive = items.some(i => i.type === ItemType.LUCKY_CHARM);
  const lootChance = luckyCharmActive ? baseLootChance * 1.5 : baseLootChance;
  
  if (Math.random() > lootChance) return null;
  
  // Determine loot type (gold vs item)
  const goldAmount = Math.floor(lastMergeValue * (1 + level * 0.1));
  const itemChance = 0.3 + (level * 0.02); // More items at high level
  
  if (Math.random() < itemChance) {
    return { type: 'item', gold: 0, item: randomItem(level) };
  } else {
    return { type: 'gold', gold: goldAmount, item: null };
  }
};
```

### Item Usage

```typescript
export const useInventoryItem = (
  state: GameState,
  item: InventoryItem
): Partial<GameState> => {
  switch (item.type) {
    case ItemType.XP_POTION:
      return { xp: state.xp + 1000 };
    
    case ItemType.BOMB_SCROLL:
      // Remove 3 lowest-value tiles
      const sorted = [...state.grid].sort((a, b) => a.value - b.value);
      const toRemove = sorted.slice(0, 3).map(t => t.id);
      return {
        grid: state.grid.filter(t => !toRemove.includes(t.id)),
      };
    
    case ItemType.GOLDEN_RUNE:
      return {
        nextSpawnGolden: true,
        nextSpawnValue: 2048, // Guaranteed high-tier
      };
    
    case ItemType.LUCKY_CHARM:
      return {
        inventory: [
          ...state.inventory,
          { ...item, expiresAt: Date.now() + 180000 }, // 3-minute buff
        ],
      };
    
    default:
      return {};
  }
};
```

---

## Component Architecture

### Component Tree

```
App (state, dispatch, main loop)
├── SplashScreen (game intro)
├── Main Game Container
│   ├── Grid (board)
│   │   └── TileComponent[] (individual tiles)
│   ├── HUD (stats sidebar)
│   │   ├── Level/XP bar
│   │   ├── Gold display
│   │   └── Stage info
│   ├── Store (shop interface)
│   ├── Leaderboard
│   ├── Settings
│   └── FloatingText[] (on-screen notifications)
└── GameOver Screen
```

### Key Components

#### App.tsx
- **Purpose**: Root component, state management, game loop
- **Responsibilities**:
  - Maintain game state with useReducer
  - Handle keyboard input
  - Trigger spawn on every move
  - Check win/lose conditions
  - Manage audio playback
- **Hooks**: `useReducer`, `useEffect`, `useRef`, `useState`

#### Grid.tsx
- **Purpose**: Render game board
- **Responsibilities**:
  - Display tiles in CSS grid
  - Handle touch input on mobile
  - Show animations
  - Render grid background

#### TileComponent.tsx
- **Purpose**: Individual tile rendering
- **Responsibilities**:
  - Apply correct styling (color, gradient, icon)
  - Show animations (spawn, merge, slide)
  - Load AI-generated creature image
  - Display health bars for bosses

#### HUD.tsx
- **Purpose**: Game statistics and info
- **Responsibilities**:
  - Display current level, XP progress
  - Show gold amount
  - Display stage name
  - Show perk notifications

#### Store.tsx
- **Purpose**: Shop interface
- **Responsibilities**:
  - List shop items
  - Display prices and effects
  - Handle purchase logic
  - Show inventory
  - Support crafting

---

## Data Persistence

### localStorage Keys

```typescript
const GAME_STATE_KEY = 'dragon_hoard_game';
const LEADERBOARD_KEY = 'dragon_hoard_leaderboard';
const ACHIEVEMENTS_KEY = 'dragon_hoard_unlocked_achievements';

// Save game state
const saveGame = (state: GameState) => {
  localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
};

// Load game state
const loadGame = (): GameState | null => {
  const saved = localStorage.getItem(GAME_STATE_KEY);
  return saved ? JSON.parse(saved) : null;
};

// Track high score
interface LeaderboardEntry {
  score: number;
  level: number;
  date: string;
}

const saveHighscore = (state: GameState) => {
  const entries: LeaderboardEntry[] = JSON.parse(
    localStorage.getItem(LEADERBOARD_KEY) || '[]'
  );
  entries.push({
    score: state.score,
    level: state.level,
    date: new Date().toISOString(),
  });
  entries.sort((a, b) => b.score - a.score).slice(0, 10); // Top 10
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
};
```

**Persistence Strategy**:
- Game state auto-saved after each action
- Leaderboard saved on game over
- Achievements saved when unlocked
- No server communication (client-only)

---

## Performance Optimization

### Rendering Optimizations

1. **Memoization**: Components wrapped with `React.memo()`
2. **Key Management**: Unique keys on tile arrays prevent re-renders
3. **CSS Classes**: Use Tailwind for static classes (no style recalculation)
4. **Image Lazy Loading**: Creature sprites load via Pollinations API

### Game Logic Optimizations

1. **Pure Functions**: `moveGrid()`, `spawnTile()` have no side effects
2. **Early Exits**: Game over check exits early if valid moves exist
3. **Set-based Tracking**: `Set<string>` for O(1) merge tracking
4. **Minimal Re-renders**: Only update changed parts of state

### Asset Loading

```typescript
// Images lazy-load on demand via Pollinations.ai
const genUrl = (prompt: string, seed: number) =>
  `https://image.pollinations.ai/prompt/...?seed=${seed}`;

// Caching via browser (same seed = same image URL)
// No local image files = smaller bundle
```

---

## Error Handling

### Game Logic Guards

```typescript
// All game functions validate input
export const moveGrid = (grid: Tile[], direction: Direction, size: number) => {
  if (!grid || grid.length === 0) return { grid: [], points: 0 };
  if (size < 4 || size > 8) return { grid, points: 0 };
  if (!Object.values(Direction).includes(direction)) return { grid, points: 0 };
  
  // ... proceed with merge logic
};
```

### UI Error Boundaries

```typescript
// Try/catch in critical sections
try {
  const newState = reducer(gameState, action);
  dispatch(action);
} catch (error) {
  console.error('Game error:', error);
  // Reset to last save or main menu
}
```

---

## Testing Strategy (Future)

### Unit Tests
```bash
npm run test
```

Test coverage for:
- `moveGrid()` merging logic
- `spawnTile()` probability distributions
- `checkLoot()` drop rates
- `isGameOver()` detection

### Integration Tests
- Full game loop (spawn → merge → level up)
- Achievement unlock conditions
- Item crafting recipes
- Save/load persistence

### E2E Tests
- Play full game session
- Complete achievements
- Reach end-game content

---

## Build & Deployment

### Development Build

```bash
npm run dev
# Starts Vite dev server at http://localhost:5173
# Hot Module Replacement (HMR) enabled
# Source maps included
```

### Production Build

```bash
npm run build
# Creates optimized bundle in dist/
# Tree-shaking removes unused code
# Assets minified and gzipped
# Source maps excluded (smaller size)
```

### Deployment

The `dist/` folder contains a static web app:

```bash
# Serve locally
npm run preview

# Deploy to any static host:
# - Vercel: push to main, auto-deploys
# - GitHub Pages: push dist/ to gh-pages branch
# - Netlify: connect repo, build command = "npm run build"
```

---

## Future Architecture Improvements

1. **State Machine**: Formalize game states (menu → playing → game-over)
2. **Event Bus**: Decouple systems with pub/sub (sound, analytics, etc.)
3. **Worker Thread**: Move heavy game logic to Web Worker
4. **Service Worker**: Offline support and PWA capabilities
5. **Database**: Cloud save for cross-device progression
6. **Telemetry**: Track player behavior (opt-in)

---

## Conclusion

Dragon's Hoard uses a clean, functional architecture with deterministic state management. Pure functions in game logic make it easy to test, debug, and extend. React components handle presentation, while services manage game rules. This separation enables rapid iteration and maintains code quality as the project grows.
