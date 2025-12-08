# Game Design Document - Dragon's Hoard

## Overview

Dragon's Hoard is a dark fantasy RPG interpretation of the 2048 puzzle game. Players merge creatures to progress through levels, collect loot, unlock perks, and ultimately defeat the Dragon God.

**Core Loop**: Merge → Level Up → Unlock Perks → Face Challenges → Repeat

---

## Design Pillars

1. **Progression**: Clear advancement through levels, perks, and unlocks
2. **Replayability**: Randomized loot, procedural stages, multiple paths to victory
3. **Emergent Gameplay**: Strategic item use and board management create varied playstyles
4. **Accessibility**: Intuitive controls, clear feedback, flexible pacing
5. **Polish**: Cohesive fantasy theme with consistent visual/audio feedback

---

## Game Modes

### Primary Game Mode
- **Single continuous session** from level 1 to victory
- Progress tracked in localStorage for persistence
- Multiple win conditions: reach 2048 tile OR defeat Dragon God at level 50

---

## Progression System

### Experience & Leveling

**Formula**: `XP Needed = 1000 × Level^1.5`

| Level | XP Required | Cumulative |
|-------|------------|-----------|
| 1→2 | 1,414 | 1,414 |
| 5→6 | 8,385 | ~40,000 |
| 10→11 | 31,622 | ~200,000 |
| 20→21 | 178,885 | ~1.6M |
| 50→51 | 7,071,067 | ~500M+ |

**Design Rationale**:
- Early levels progress quickly (10-20 merges to level up)
- Mid-game provides steady progression (50-100 merges per level)
- Late-game is extended endgame content (thousands of merges)

### Level-Based Unlocks (Perks)

```
Level 1:  Game begins with 4×4 grid
Level 3:  Luck of the Goblin (5% chance for 4-spawn)
Level 5:  Grid → 5×5 + Bosses appear every 5 levels
Level 7:  Veteran (XP +50%)
Level 10: Loot Mode active + Grid → 6×6
Level 15: Reroll Token (1 free reroll/level) + Grid → 7×7
Level 20: Auto-Merge + Grid → 8×8
Level 30: ??? (Secret unlock)
Level 50: Dragon God appears (final boss)
```

**Design Notes**:
- Grid expansion gates strategy (forces harder decisions)
- Boss introduction scales difficulty
- XP boost at level 7 smooths progression curve
- Late-game unlocks remain mysterious for discovery

---

## Creature Progression Path

Creatures evolve through 11 tiers:

```
2   (Slime)     → 4  (Goblin)      → 8  (Orc)         → 16 (Troll)
32  (Drake)     → 64 (Wyvern)      → 128 (Demon)      → 256 (Elder)
512 (Legend)    → 1024 (Ancient)   → 2048 (Dragon God)
```

**Visual Design**:
- Each tier has unique color gradient, icon, and AI-generated sprite
- Creature gets progressively more powerful/mystical
- Final form (2048) is the Dragon God (ultimate boss form)

**Gameplay Rationale**:
- 11 tiers supports meaningful progression
- 2048 as ultimate goal maintains 2048-game legacy
- Creature names create fantasy atmosphere

---

## Tile System

### Standard Tiles (TileType.NORMAL)
- Basic creatures with no special properties
- Merge rules: Two identical values combine into next value
- Spawn rate: ~80% of all spawns

### Boss Tiles (TileType.BOSS)
- Appear every 5 levels starting at level 5
- Cannot be moved until defeated (health depletes with merges)
- Guaranteed premium loot
- Unique visual (skull theme, red glow)
- XP: 2× normal rewards

### Special Rune Tiles
**RUNE_MIDAS**: 
- Effect: Next 3 merges yield +2× gold
- Spawn: 5% chance from merges
- Strategic use: Save for high-value tile merges

**RUNE_CHRONOS**:
- Effect: One extra turn (undo-like mechanic)
- Spawn: 5% chance from merges
- Strategic use: Escape bad board states

**RUNE_VOID**:
- Effect: Select and remove any tile
- Spawn: 5% chance from merges
- Strategic use: Clear blockages

### Bomb Tiles (TileType.BOMB)
- Clears all tiles in 3×3 area
- Obtained via: Shop (Purge Scroll) or loot drops
- Used via inventory system

### Golden Tiles (TileType.GOLDEN)
- Worth 2× normal merge value
- Obtained via: Golden Rune item from shop
- Creates higher-value creatures faster

---

## Loot & Economy

### Gold System

Gold is earned from:
1. **Merges**: Base amount scales with tile value
2. **Bosses**: Double normal amount
3. **Items**: Certain items grant gold directly
4. **Lucky Charm**: 3-turn +50% gold boost

Gold spent on:
1. **Shop items**: XP potions, scrolls, reroll tokens, runes
2. **Crafting**: Combine items for upgrades
3. **Upgrades**: Future game systems (planned)

### Item Economy

**Shops Items** (purchasable with gold):
- XP Elixir (50g): +1000 XP instantly
- Purge Scroll (100g): Destroy 3 lowest value tiles
- Reroll Token (75g): Full board reset once
- Golden Rune (750g): Next spawn is high-tier
- Lucky Charm (150g): +50% loot for 3 turns

**Crafting System** (combine items + gold):
- Greater Elixir: 2× XP Potion + 100g → +2500 XP
- Cataclysm Scroll: 2× Purge Scroll + 200g → Destroy 50% of board
- Ascendant Rune: 2× Golden Rune + 300g → Guaranteed exceptional spawn

**Design Rationale**:
- Items provide tactical options (not just power)
- Crafting rewards collection and planning
- Economy scales with game progression
- Prevents "save forever" mentality with high-cost items

---

## Achievement System

### Categories

**Progress Milestones** (5):
- Reach Level 10, 20, 30, 40, 50
- Reward: Gold/XP

**Gameplay Feats** (8):
- Merge 100 tiles, defeat 5 bosses, create 5 boss tiles
- Create 10-tile combo, earn 1M gold, use 20 items
- Unlock all perks
- Reward: Varies by achievement

**Secret Achievements** (7):
- Hidden conditions (e.g., win without buying items)
- Defeat dragon in X turns, reach level 50 in X time
- Unlock all shop items
- Reward: Special items or cosmetics (future)

**Total**: 20 achievements

### Implementation

Achievements stored in localStorage with unlocked IDs.
Conditions checked after every significant action.
Rewards applied immediately upon unlock.

---

## Stage System

Five progressive environments:

| Stage | Level Range | Theme | Color |
|-------|-------------|-------|-------|
| The Crypt | 1-9 | Medieval dungeon | Gray |
| Fungal Caverns | 10-19 | Bioluminescent fungi | Purple |
| Magma Core | 20-29 | Volcanic lava | Orange |
| The Void | 30-39 | Cosmic space | Indigo |
| Elysium | 40+ | Heavenly realm | Gold |

**Design Notes**:
- Background images AI-generated via Pollinations.ai
- Theme provides visual progression
- Color palette guides mood (darker → brighter)
- Seamless transitions as player levels up

---

## Difficulty Curve

### Early Game (Levels 1-5)
- **Pacing**: Fast progression (5-10 min to level 5)
- **Challenge**: Minimal, tutorial-like
- **Board**: 4×4 grid (manageable)
- **Mechanics Introduced**: Basic merging, XP, levels

### Mid Game (Levels 6-15)
- **Pacing**: Steady (20-30 min per level)
- **Challenge**: Bosses appear, grid management
- **Board**: Grid expands (5×5 → 7×7)
- **Mechanics Introduced**: Loot, items, crafting, reroll

### Late Game (Levels 16+)
- **Pacing**: Slow (1+ hours per level)
- **Challenge**: Board near-full, complex decisions
- **Board**: 8×8 grid (crowded)
- **Mechanics Introduced**: Auto-merge, secret perks

### Endgame (Levels 40+)
- **Pacing**: Extended (session-long challenges)
- **Challenge**: Extreme XP requirements
- **Goal**: Reach level 50 for Dragon God encounter

**Design Rationale**:
- Difficulty curve prevents early frustration
- Late game supports extended play sessions
- Multiple difficulty tiers for different players

---

## Balance Considerations

### Spawn Rates
- Normal tiles: 80%
- Rune tiles: 5% each (3 types)
- Bomb tiles: 1% (can also be purchased)
- Boss tiles: 1-2% (level-gated)
- Golden tiles: 0.5% (requires item)

### Perk Timing
- Perks unlock at levels that maintain playability
- Each perk meaningfully changes strategy
- Grid expansion creates new challenges
- No perk trivializes the game

### Economy Balance
- Early gold is scarce (no shop affordability)
- Mid-game gold becomes meaningful (can afford 1-2 items per level)
- Late-game gold is abundant (crafting becomes viable)
- High-cost items (750g) remain aspirational

### Boss Difficulty
- Boss health increases with level
- Boss frequency (every 5 levels) provides pacing
- Multiple strategies to defeat bosses (merge, items, wait)
- Rewards justify difficulty

---

## Player Engagement Strategies

### Replayability Hooks
1. **Randomized Loot**: Every run yields different items
2. **Achievement Hunting**: 20 achievements to unlock
3. **High Score Tracking**: Leaderboard competition
4. **Multiple Paths**: Item builds vs. pure merging strategies
5. **Procedural Backgrounds**: AI-generated unique visuals

### Retention Mechanics
1. **Save/Load**: Can quit anytime and resume
2. **Progression Visibility**: Clear level/XP/gold display
3. **Unlocks**: Regular new perks/features as you level
4. **Streaks**: Consecutive daily plays (future feature)

### Feedback Systems
1. **Visual**: Tile animations, glow effects, particle effects
2. **Audio**: Level-up chimes, merge sounds, victory fanfare
3. **Text**: Floating damage numbers, achievement popups
4. **Stats**: Detailed game statistics tracking

---

## Future Expansion Ideas

### Tier 2 Content
- Daily challenges (limited moves, special rules)
- Multiplayer leaderboards (cross-device sync)
- Cosmetics (tile skins, backgrounds, creatures)
- New tile types (frozen, poisoned, blessed)

### Tier 3 Content
- Boss AI patterns (learn and counter)
- Roguelike mode (permadeath, escalating challenges)
- Trading system (items between runs)
- Story/lore progression

### Tier 4 Content
- PvP mode (competitive merging)
- Co-op dungeons (shared boards)
- Seasonal events (limited-time challenges)
- Cross-platform progression (cloud save)

---

## Technical Architecture

### State Management
React reducer pattern for deterministic state updates
localStorage for persistence
Immutable state updates

### Component Hierarchy
```
App (state, reducer)
├── SplashScreen
├── Grid (board rendering)
│   └── TileComponent (individual tiles)
├── HUD (stats display)
├── Store (shop interface)
├── Leaderboard
├── Settings
└── Achievements (future)
```

### Service Layer
- `gameLogic.ts`: Pure functions for game rules
- `audioService.ts`: Sound effect management

### Styling
Tailwind CSS for responsive design
Dynamic gradients for creature colors
Glassmorphism UI elements

---

## Conclusion

Dragon's Hoard combines puzzle mechanics with RPG progression to create an engaging, replayable experience. The design emphasizes player agency, clear progression, and meaningful choices while maintaining the strategic depth of the original 2048 game.
