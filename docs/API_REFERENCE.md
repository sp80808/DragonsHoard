# API Reference & Code Documentation

Quick reference for key functions, types, and modules in Dragon's Hoard.

## Table of Contents
- [Game Logic API](#game-logic-api)
- [Type Definitions](#type-definitions)
- [Constants](#constants)
- [Audio Service](#audio-service)
- [React Components](#react-components)

---

## Game Logic API

**File**: `services/gameLogic.ts`

### Game Initialization

```typescript
export const initializeGame = (): GameState
```
Creates a new game state with default values.

**Returns**: Fresh `GameState` with empty 4×4 grid, level 1, 0 score

**Example**:
```typescript
const newGame = initializeGame();
dispatch({ type: 'RESTART' });
```

---

### Movement & Merging

```typescript
export const moveGrid = (
  grid: Tile[],
  direction: Direction,
  size: number
): MoveResult
```

Handles tile movement and merging in specified direction.

**Parameters**:
- `grid`: Current board tiles
- `direction`: Direction.UP | DOWN | LEFT | RIGHT
- `size`: Current grid size (4-8)

**Returns**:
```typescript
interface MoveResult {
  grid: Tile[];    // Updated grid after move
  points: number;  // Points earned from merges
}
```

**Example**:
```typescript
const result = moveGrid(state.grid, Direction.UP, state.gridSize);
// result.grid contains moved/merged tiles
// result.points contains XP gained
```

---

### Tile Spawning

```typescript
export const spawnTile = (
  grid: Tile[],
  size: number,
  level: number,
  options?: SpawnOptions
): Tile[]
```

Spawns a new random tile on the board.

**Parameters**:
- `grid`: Current board
- `size`: Grid size
- `level`: Current level (affects spawn rates)
- `options` (optional): Force specific spawn
  ```typescript
  interface SpawnOptions {
    forcedValue?: number;        // Force specific value (2, 4, 8, etc.)
    type?: TileType;             // Force tile type
    bossLevel?: number;          // Boss level if BOSS type
  }
  ```

**Returns**: Updated grid with new tile added

**Example**:
```typescript
// Random spawn
let grid = spawnTile(state.grid, state.gridSize, state.level);

// Force specific spawn
grid = spawnTile(grid, 4, 5, { forcedValue: 2048 });

// Force boss spawn
grid = spawnTile(grid, 4, 20, { type: TileType.BOSS, bossLevel: 20 });
```

---

### Game Over Detection

```typescript
export const isGameOver = (grid: Tile[], size: number): boolean
```

Checks if no more valid moves exist.

**Returns**: `true` if game is over, `false` if moves available

**Example**:
```typescript
if (isGameOver(state.grid, state.gridSize)) {
  dispatch({ type: 'GAME_OVER' });
}
```

---

### Loot System

```typescript
export const checkLoot = (
  mergedTile: Tile,
  level: number,
  inventory: InventoryItem[],
  gold: number
): LootResult
```

Determines loot from a merge.

**Returns**:
```typescript
interface LootResult {
  type: 'gold' | 'item';
  gold: number;
  item: InventoryItem | null;
}
```

**Example**:
```typescript
const loot = checkLoot(mergedTile, state.level, state.inventory, state.gold);
if (loot) {
  state.gold += loot.gold;
  if (loot.item) state.inventory.push(loot.item);
}
```

---

### Item Usage

```typescript
export const useInventoryItem = (
  state: GameState,
  item: InventoryItem
): Partial<GameState>
```

Applies item effect and returns state changes.

**Supported Items**:
- `XP_POTION`: +1000 XP
- `BOMB_SCROLL`: Remove 3 lowest tiles
- `GOLDEN_RUNE`: Next spawn is high-tier
- `REROLL_TOKEN`: Reset board
- `LUCKY_CHARM`: +50% loot for 3 min

**Returns**: Partial state to merge with current state

**Example**:
```typescript
const itemEffect = useInventoryItem(state, xpPotion);
const newState = { ...state, ...itemEffect };
```

---

### XP & Leveling

```typescript
export const getXpThreshold = (level: number): number
```

Calculates XP needed for next level.

**Formula**: `1000 × level^1.5`

**Returns**: XP needed to reach `level + 1`

**Example**:
```typescript
const nextLevel = state.level + 1;
const xpNeeded = getXpThreshold(nextLevel);
const progress = (state.xp / xpNeeded) * 100; // Percentage
```

---

### Achievement System

```typescript
export const checkAchievements = (
  state: GameState,
  unlockedBefore: string[]
): Achievement[]
```

Checks which achievements were newly unlocked.

**Returns**: Array of newly unlocked achievements

**Example**:
```typescript
const newAchievements = checkAchievements(state, state.achievements);
newAchievements.forEach(ach => {
  dispatch({ type: 'UNLOCK_ACHIEVEMENT', achievement: ach });
});
```

---

### Leaderboard

```typescript
export const saveHighscore = (state: GameState): void
export const loadLeaderboard = (): LeaderboardEntry[]
```

Manage high score persistence.

**Example**:
```typescript
// On game over
saveHighscore(state);

// Load scores
const leaderboard = loadLeaderboard();
const topScores = leaderboard.slice(0, 10);
```

---

## Type Definitions

**File**: `types.ts`

### Core Types

```typescript
enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

enum TileType {
  NORMAL = 'NORMAL',
  BOSS = 'BOSS',
  BOMB = 'BOMB',
  GOLDEN = 'GOLDEN',
  RUNE_MIDAS = 'RUNE_MIDAS',
  RUNE_CHRONOS = 'RUNE_CHRONOS',
  RUNE_VOID = 'RUNE_VOID',
}

enum ItemType {
  XP_POTION = 'XP_POTION',
  BOMB_SCROLL = 'BOMB_SCROLL',
  GOLDEN_RUNE = 'GOLDEN_RUNE',
  REROLL_TOKEN = 'REROLL_TOKEN',
  LUCKY_CHARM = 'LUCKY_CHARM',
  GREATER_XP_POTION = 'GREATER_XP_POTION',
  CATACLYSM_SCROLL = 'CATACLYSM_SCROLL',
  ASCENDANT_RUNE = 'ASCENDANT_RUNE',
}
```

### Tile

```typescript
interface Tile {
  id: string;              // Unique identifier
  x: number;               // Column (0 to gridSize-1)
  y: number;               // Row (0 to gridSize-1)
  value: number;           // Creature value (2, 4, 8, ...)
  type: TileType;          // Special type if any
  mergedFrom?: string[];   // IDs of tiles that merged
  isNew?: boolean;         // True if just spawned
  health?: number;         // Boss health
  maxHealth?: number;      // Boss max health
}
```

### Game State

```typescript
interface GameState {
  grid: Tile[];
  score: number;
  level: number;
  xp: number;
  gold: number;
  gridSize: number;
  inventory: InventoryItem[];
  stats: GameStats;
  achievements: string[];
  gameOver: boolean;
  gameWon: boolean;
  victory: boolean;
  stage: string;
  logs: GameLog[];
  floatingTexts: FloatingText[];
  // ... and more
}
```

### Inventory Item

```typescript
interface InventoryItem {
  id: string;
  type: ItemType;
  name: string;
  description: string;
  icon: string;
  expiresAt?: number;      // For timed buffs
}
```

---

## Constants

**File**: `constants.ts`

### Grid Configuration

```typescript
export const GRID_SIZE_INITIAL = 4;      // Starting grid is 4×4
export const WINNING_VALUE = 2048;       // Win by reaching 2048
```

### Tile Styles

```typescript
export const TILE_STYLES: Record<number, {
  label: string;
  color: string;           // Tailwind gradient
  icon: string;            // Emoji
  glow: string;            // Shadow class
  imageUrl: string;        // AI-generated image
}>
```

**Example**:
```typescript
const slimeStyle = TILE_STYLES[2];
// { label: 'Slime', color: 'from-green-900 to-green-700', ... }
```

### Stages

```typescript
export const STAGES: Stage[] = [
  { name: "The Crypt", minLevel: 1, prompt: "...", color: "..." },
  { name: "Fungal Caverns", minLevel: 10, ... },
  { name: "Magma Core", minLevel: 20, ... },
  { name: "The Void", minLevel: 30, ... },
  { name: "Elysium", minLevel: 40, ... },
];

export const getStage = (level: number): Stage
export const getStageBackground = (stageName: string): string
```

### Shop Items

```typescript
export const SHOP_ITEMS = [
  { 
    id: ItemType.XP_POTION,
    name: "XP Elixir",
    price: 50,
    icon: "🧪",
    desc: "+1000 XP instantly"
  },
  // ... more items
];
```

### Crafting Recipes

```typescript
export const RECIPES: CraftingRecipe[] = [
  {
    id: 'craft_greater_xp',
    resultId: ItemType.GREATER_XP_POTION,
    name: "Greater Elixir",
    description: "Grants +2500 XP instantly.",
    icon: "⚗️",
    goldCost: 100,
    ingredients: [{ type: ItemType.XP_POTION, count: 2 }]
  },
  // ... more recipes
];
```

### Perks

```typescript
export const PERKS = [
  { level: 3, desc: "Luck of the Goblin: 5% chance for 4-spawn" },
  { level: 5, desc: "Expansion: Grid size increased to 5x5!" },
  // ... more perks
];
```

### Achievements

```typescript
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_merge',
    name: 'First Merge',
    description: 'Combine two tiles',
    icon: '✨',
    condition: (stats) => stats.totalMerges >= 1,
    reward: { gold: 100 }
  },
  // ... more achievements
];
```

---

## Audio Service

**File**: `services/audioService.ts`

```typescript
export const audioService = {
  // Play various sounds
  play: (sound: 'merge' | 'levelup' | 'boss' | 'victory' | 'gameover') => void,
  
  // Control volume
  setVolume: (volume: number) => void,     // 0.0 - 1.0
  
  // Mute/unmute
  toggle: () => void,
  isMuted: () => boolean,
};
```

**Example**:
```typescript
audioService.play('merge');
audioService.setVolume(0.5);
```

---

## React Components

### App Component

**Location**: `App.tsx`

Root component managing game state and loop.

**Props**: None (root component)

**State**: Uses `useReducer` with game reducer

**Key Methods**:
- `handleMove(direction)`: Dispatch move action
- `handleRestart()`: Reset to new game
- `handleBuyItem(item)`: Purchase from shop

---

### Grid Component

**Location**: `components/Grid.tsx`

Renders the game board.

**Props**:
```typescript
interface GridProps {
  grid: Tile[];
  gridSize: number;
  stage: string;
  onMove: (direction: Direction) => void;
}
```

**Features**:
- CSS grid layout
- Touch support (swipe controls)
- Keyboard controls
- Tile animations

---

### TileComponent

**Location**: `components/TileComponent.tsx`

Individual tile rendering.

**Props**:
```typescript
interface TileComponentProps {
  tile: Tile;
  isNew?: boolean;
}
```

**Renders**:
- Color gradient based on value
- Creature image (lazy-loaded)
- Health bar (if boss)
- Merge animation

---

### Store Component

**Location**: `components/Store.tsx`

Shop interface for items and crafting.

**Props**:
```typescript
interface StoreProps {
  gold: number;
  inventory: InventoryItem[];
  onBuyItem: (item: ShopItem) => void;
  onCraftItem: (recipe: CraftingRecipe) => void;
  onUseItem: (item: InventoryItem) => void;
}
```

---

### HUD Component

**Location**: `components/HUD.tsx`

Game statistics display.

**Shows**:
- Current level
- XP progress bar
- Gold amount
- Current stage name
- Active buffs

---

### Leaderboard Component

**Location**: `components/Leaderboard.tsx`

High score display.

**Props**:
```typescript
interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentScore?: number;
}
```

---

## Common Patterns

### Dispatching Actions

```typescript
// Move tile
dispatch({ type: 'MOVE', direction: Direction.UP });

// Buy item
dispatch({ type: 'BUY_ITEM', item: shopItem });

// Use inventory item
dispatch({ type: 'USE_ITEM', item: inventoryItem });

// Unlock achievement
dispatch({ type: 'UNLOCK_ACHIEVEMENT', achievement });
```

### Checking Game State

```typescript
// Is game over?
if (isGameOver(state.grid, state.gridSize)) {
  // Handle game over
}

// Can afford item?
if (state.gold >= item.price) {
  // Allow purchase
}

// Check inventory for item type
const hasPotion = state.inventory.some(i => i.type === ItemType.XP_POTION);
```

### Working with Tiles

```typescript
// Find tile at position
const tile = state.grid.find(t => t.x === 2 && t.y === 3);

// Find highest value tile
const highest = state.grid.reduce((max, t) => t.value > max.value ? t : max);

// Count creatures of type
const goblins = state.grid.filter(t => t.value === 4).length;

// Total grid value
const totalValue = state.grid.reduce((sum, t) => sum + t.value, 0);
```

---

## Advanced Usage

### Extending Game Logic

To add new item type:

1. Add to `ItemType` enum in `types.ts`
2. Add shop item or recipe in `constants.ts`
3. Implement effect in `useInventoryItem()` function
4. Update UI to display item

### Adding New Achievement

1. Define achievement in `ACHIEVEMENTS` array
2. Add condition function that checks `GameStats`
3. Set optional reward
4. Achievement auto-checks after each action

### Creating Custom Stage

1. Add to `STAGES` array in `constants.ts`
2. Set name, minLevel, background prompt, color
3. Background auto-generates via Pollinations.ai
4. Stage transitions automatically at level threshold

---

## Debugging

### Enable Logging

Add to browser console:
```javascript
localStorage.setItem('debug', 'dragons:*');
location.reload();
```

### Inspect Game State

```javascript
// In browser console
JSON.parse(localStorage.getItem('dragon_hoard_game'));
```

### Force Game State

```javascript
// Create new save state
const newState = {...};
localStorage.setItem('dragon_hoard_game', JSON.stringify(newState));
location.reload();
```

---

## Performance Tips

1. **Memoize expensive calculations**: Use `useMemo()` for complex computations
2. **Avoid re-renders**: Use React.memo for tile components
3. **Lazy load images**: Pollinations API caches by seed
4. **Debounce input**: Prevents move spam

---

## Further Reading

- See `ARCHITECTURE.md` for system design
- See `GAME_DESIGN.md` for mechanics details
- See `CONTRIBUTING.md` for coding guidelines

---

**API Reference Last Updated**: December 2025
