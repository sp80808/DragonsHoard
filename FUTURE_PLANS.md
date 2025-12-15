
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

## The "Grimoire" System
A new personalization menu accessible from the main screen where players can equip unlocked aesthetics.

## Level-Based Unlocks
As the player increases their **Account Level**, new visual themes become permanently available for selection, allowing players to customize the dungeon's atmosphere regardless of the current run's difficulty.

- **Level 5 (Fungal Caverns):** Unlocks the "Bioluminescent" Tile Set and Cave Background. Tiles glow with purple and green neon hues.
- **Level 10 (Molten Depths):** Unlocks the "Infernal" Tile Set. Tiles appear as obsidian and magma, and the background features flowing lava.
- **Level 20 (Crystal Spire):** Unlocks the "Glacial" Tile Set. Tiles look like carved ice and sapphires; the background is a frozen palace.
- **Level 30 (Void Realm):** Unlocks the "Eldritch" Tile Set. Tiles feature cosmic horror art and non-Euclidean geometries.
- **Level 40 (Celestial Citadel):** Unlocks the "Divine" Tile Set. Tiles are gold and marble with angelic motifs.

## Customization Options
Players can mix and match unlocked assets in the Grimoire:
1.  **Background Override:** Choose to play in the "Void Realm" visual environment even while playing early game levels.
2.  **Tile Set Selection:** Equip the "Glacial" monster sprites while playing in the "Infernal" background for unique contrast.
3.  **Card Backs:** Unlock unique border styles for tiles (e.g., Pixel Art border, Gold Leaf border) via Achievements.

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

---

# Future Feature: Daily Dungeons (Challenger Mode)

## Overview
A new competitive mode that resets every 24 hours.

## Mechanics
- **Fixed Seed:** Every player gets the exact same tile spawn sequence.
- **Modifiers:** Each day features a unique twist (e.g., "Explosive Tiles", "Double Boss HP", "No Shop").
- **Leaderboard:** A separate leaderboard resets daily. Top 100 players earn "Glory" points for their profile.
- **Rewards:** Completing the Daily Run grants a large sum of XP towards the main Account Level.

# Future Feature: The Bestiary

## Overview
A collection menu accessed via the main menu ("Codex").

## Features
- **Monster Logs:** Automatically records every monster type the player has merged.
- **Lore Entries:** Clicking on a monster reveals flavor text, stats, and its "Shiny" variant if discovered.
- **Progress Tracking:** "Discover 100% of monsters" is a long-term goal for completionists.
- **Boss Trophies:** Defeating bosses adds their head/artifact to a trophy shelf in the Bestiary.
