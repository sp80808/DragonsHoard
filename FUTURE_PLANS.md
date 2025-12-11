
# Future Feature: Local Versus Mode (Split-Screen)

## Overview
A competitive local multiplayer mode designed for desktop users, utilizing a single keyboard. Two players battle simultaneously on the same screen to survive the longest or defeat the other by sending "Garbage Tiles".

## Platform Restrictions
- **Target:** Desktop / Laptop / Large Tablets only.
- **Detection:** `window.innerWidth > 1024` and `!('ontouchstart' in window)`.
- **UI:** Hide the "Versus" button on mobile devices.

## Controls
| Action | Player 1 (Left) | Player 2 (Right) |
| :--- | :--- | :--- |
| **Move Up** | `W` | `Arrow Up` |
| **Move Down** | `S` | `Arrow Down` |
| **Move Left** | `A` | `Arrow Left` |
| **Move Right** | `D` | `Arrow Right` |
| **Use Item** | `Q` / `E` | `/` / `.` |

## Gameplay Mechanics

### 1. The garbage System (Attack)
Similar to *Puyo Puyo* or *Tetris Attack*.
- **Trigger:** Merging tiles of Tier 5 (32) or higher generates "Mana".
- **Combos:** Cascades multiply Mana generation.
- **Effect:** Once the Mana bar fills, it sends a **Stone Wall (Value 0)** row to the bottom of the opponent's grid, pushing their tiles up.
- **Defense:** Merging next to a Stone Wall destroys it.

### 2. Win Conditions
1.  **Survival:** The opponent's grid fills up (Game Over).
2.  **Boss Slayer:** The first player to defeat a specialized "Raid Boss" (HP shared or separate race) wins.

## Technical Implementation Plan

1.  **State Management:**
    - Refactor `GameState` to support an array of players: `players: [PlayerState, PlayerState]`.
    - The `reducer` must handle actions with a `playerId` payload (e.g., `{ type: 'MOVE', direction: 'UP', playerId: 0 }`).

2.  **Input Handling:**
    - A single `useEffect` listener captures `keydown`.
    - Map specific KeyCodes to specific Player Dispatchers.

3.  **View Layer:**
    - Create a `SplitScreenLayout` component.
    - Render two smaller `<Grid />` components side-by-side.
    - Central HUD area for timer and "Garbage Queue" visualization.

4.  **Performance:**
    - Strict `React.memo` usage on Grids is required as two updates happen frequently.
    - Disable heavy particle effects in Versus mode to maintain 60fps.

---

# Future Feature: Dynamic Store & Economy

## Overview
To keep the mid-to-late game interesting, the store will evolve. Items will rotate, prices will fluctuate based on demand (inflation), and new high-tier items will unlock.

## Mechanics
1.  **Stock Renewal:**
    - The store refreshes its stock every 5 levels or after a Boss defeat.
    - Stock is limited (e.g., only 2 HP Potions available per cycle).

2.  **Inflation System:**
    - Every time a specific item is bought, its price increases by 10-20% for the rest of the run.
    - Encourages diversity in item usage.

3.  **Black Market:**
    - A rare chance (5%) for a "Black Market" tab to appear, selling "Illegal" items (extremely powerful but with debuffs, e.g., "Gain 5000 Gold but lose 50% max HP").

# Future Feature: Cascade Mastery

## Overview
An upgrade tree dedicated specifically to the Auto-Cascade mechanic, allowing players to lean into a "Chain Reaction" playstyle.

## Upgrades
- **Reaction Speed:** Cascades trigger faster (Visual).
- **Gold Transmutation:** Every cascade step generates +5 Gold per tile.
- **Mana Syphon:** Cascades restore a small amount of Player HP (if HP mechanic is added) or charge an "Ultimate Ability" bar.
- **Deep Impact:** Cascade merges at Depth > 3 explode, clearing adjacent low-tier tiles.

# Future Feature: Visual Customization & Unlockables

## Unlockable Grid Skins
- **Classic:** The default dark aesthetic.
- **Retro:** Pixel art borders and 8-bit fonts.
- **Neon:** Cyberpunk aesthetic with glowing grid lines.
- **Glass:** Frosted glass effect for tiles.

## Custom Themes
Allow players to mix and match discovered biomes.
- *Example:* Use the "Molten Depths" background with "Celestial" tile sprites.

## Implementation
- Add a "Cosmetics" tab to the Inventory/Settings.
- Store unlocked skins in `PlayerProfile`.

---

# Future Feature: Visual Polish & Juice

## Dynamic Lighting
- **Shader Implementation:** Use custom WebGL shaders for the background to create true dynamic lighting that reacts to tile merges (e.g., a "burst" of light illuminating the dungeon walls on big combos).
- **Tile Emission:** High-tier tiles should act as light sources in the scene.

## Advanced Particles
- **Physics-based Debris:** When tiles break or merge, generate debris that respects pseudo-gravity and collision with the bottom of the grid.
- **Liquid Effects:** For "Slime" or "Magma" themes, use metaballs for fluid-like merging animations.

## Camera Work
- **Screen Shake 2.0:** Implement per-axis translational shake and rotational trauma for heavier impacts.
- **Zoom/Dolly:** Subtle camera zoom-in during "Boss" encounters or "God Tile" creation moments to heighten tension.
