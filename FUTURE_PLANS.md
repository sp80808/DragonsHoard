
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

# Future Feature: Cascade Mastery & Extension

## Overview
An upgrade tree dedicated specifically to the Auto-Cascade mechanic, allowing players to lean into a "Chain Reaction" playstyle.

## Upgrades
- **Reaction Speed:** Cascades trigger faster (Visual).
- **Gold Transmutation:** Every cascade step generates +5 Gold per tile.
- **Mana Syphon:** Cascades restore a small amount of Player HP (if HP mechanic is added) or charge an "Ultimate Ability" bar.
- **Deep Impact:** Cascade merges at Depth > 3 explode, clearing adjacent low-tier tiles.

## New Item Ideas
- **Prism of Echoes:** When a cascade occurs, it has a 50% chance to duplicate the merged tile into an empty slot.
- **Gravity Anchor:** Pulls all tiles downwards after a cascade, potentially triggering *another* set of merges (Tetris-style gravity).

---

# Future Feature: Juicy XP Feedback

To make gaining XP feel more rewarding, we need better visual and auditory feedback.

## Visual Improvements
1.  **Floating XP Numbers:** When a merge happens, spawn a small floating text `+50 XP` near the tile, drifting towards the XP bar.
2.  **Bar Physics:** When a large chunk of XP is gained (e.g., Boss Kill), the XP bar should fill up rapidly, glow white, and shake the UI slightly.
3.  **Level Up Moment:** Freeze frame for 0.5s, darken the background, and have the "LEVEL UP" text slam onto the screen with a shockwave.

## Audio Improvements
1.  **Pitch Shifting:** Consecutive merges (combos) should play the XP gain sound at progressively higher pitches (do-re-mi-fa-so...).
2.  **Liquid Fill Sound:** A subtle liquid pouring sound while the XP bar fills up.

---

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

# Future Feature: Visual Polish & Eye Candy (Non-Destructive)

A plan to introduce high-fidelity visual flair that enhances the "game feel" without affecting game logic or overwhelming the DOM.

## 1. Dynamic Lighting (The "Torch" Effect)
Instead of static vignettes, we implement a dynamic CSS radial gradient that tracks the user's cursor or touch position.
- **Implementation:** Update CSS variables `--mouse-x` and `--mouse-y` on container `mousemove`.
- **Effect:** A subtle warm glow follows the player's input, illuminating the borders of the tiles near the cursor, simulating a torch in a dark dungeon.
- **Performance:** CSS-only transform/gradient update. Zero React render cycle cost.

## 2. "Living" Tiles (Internal Animation)
High-tier tiles (512+) should feel volatile and alive, not just static images.
- **Implementation:** Use `mask-image` on the tile container combined with a scrolling background noise texture.
- **Effect:** The interior of a "Void" tile seems to swirl, or the "Magma" tile seems to flow.
- **Target:** Only active on tiles > Value 512 to save GPU resources.

## 3. Hitstop (Time Dilation)
To give weight to massive impacts (Boss Kills or 1024+ Merges).
- **Implementation:** When a specific event triggers, freeze the main game loop and CSS animations for 50-100ms.
- **Effect:** The game momentarily "pauses" on impact, emphasizing the power of the move, before resuming with a screen shake.

## 4. Biome-Specific Weather (Canvas Overlay)
Expand the `AmbientBackground` component to support distinct weather modes based on the current Stage.
- **Fungal Caverns:** Floating spores (slow upward drift, pulse opacity).
- **Molten Depths:** Rising embers and ash (fast upward drift, orange/red).
- **Crystal Spire:** Diamond dust / Snow (diagonal downward drift, sparkle).
- **Void Realm:** Digital glitch artifacts or reverse-gravity particles.

## 5. UI Juice: "Odometer" Numbers
When the score or gold increases significantly, the numbers should not just swap.
- **Implementation:** Use a sliding number reel effect (using `framer-motion` layout projection or a dedicated counter component).
- **Effect:** Makes earning Gold feel like a slot machine payout.

## 6. Shockwave Distortion (WebGL)
*Optional High-End Feature*
- **Implementation:** A transparent WebGL canvas layer on top of the grid.
- **Effect:** When a bomb explodes or a boss dies, a refractive "ripple" distorts the grid behind it, expanding outward.

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
