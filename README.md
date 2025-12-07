<div align="center">

# 🐉 Dragon's Hoard

**A Dark Fantasy RPG Twist on 2048**

*Merge tiles to slay beasts, earn XP, level up, and collect loot in your quest to defeat the Dragon God.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.2-blue)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.2-purple)](https://vitejs.dev)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Game Mechanics](#game-mechanics)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Guide](#development-guide)
- [Game Systems](#game-systems)
- [Contributing](#contributing)
- [License](#license)

---

## 🎮 Overview

**Dragon's Hoard** is an innovative blend of the classic 2048 puzzle game and RPG mechanics. Instead of just merging numbers, you're merging creatures and collecting loot. Progress through multiple stages from dungeons to the heavens, unlock powerful items and perks, and face off against increasingly difficult bosses.

The game features a comprehensive progression system, strategic item crafting, achievements, and leaderboards—all with a dark fantasy aesthetic powered by AI-generated artwork.

---

## ✨ Features

### Core Gameplay
- 🔄 **Merge-Based Combat**: Combine identical tiles to progress and defeat enemies
- 🏆 **Progressive Difficulty**: Grid expands as you level up (4x4 → 8x8)
- 💰 **Loot & Crafting**: Collect items, craft powerful upgrades, and manage inventory
- ⚔️ **Boss Encounters**: Face unique challenges at milestone levels
- 🎯 **Multiple Win Conditions**: Reach specific tile values or defeat the ultimate Dragon God

### Progression Systems
- 📈 **Level-based XP System**: Exponential thresholds that scale with progression
- 🎁 **Perk Unlocks**: Gain special bonuses at key levels (4x chance spawns, auto-merge, etc.)
- 🎨 **Dynamic Stages**: Visit 5 unique environments from The Crypt to Elysium
- 🌟 **Achievements**: Track progress with 20+ achievements including secret unlocks

### Features & Polish
- 💾 **Save/Load System**: Persist game progress to localStorage
- 🏅 **Leaderboard**: Track personal high scores
- 🔊 **Dynamic Audio**: Sound effects for merges, level-ups, and boss defeats
- 📱 **Responsive Design**: Playable on desktop and mobile
- 🎨 **AI-Generated Artwork**: Beautiful fantasy creature sprites and environment backdrops

---

## 🎯 Game Mechanics

### How to Play

1. **Merge Tiles**: Move tiles with arrow keys (or swipe on mobile) to combine identical creatures
2. **Earn XP**: Each merge grants XP toward the next level
3. **Level Up**: Unlock perks and increase grid size at certain level thresholds
4. **Collect Loot**: Drops from merges include Gold and consumable items
5. **Craft Items**: Combine inventory items to create more powerful versions
6. **Use Power-ups**: Deploy tactical items in battle (bombs clear areas, potions grant XP, etc.)

### Creature Progression

The merge path evolves your creatures through increasingly powerful forms:

```
Slime (2) → Goblin (4) → Orc (8) → Troll (16) → Drake (32) → Wyvern (64) 
→ Demon (128) → Elder (256) → Legend (512) → Ancient (1024) → God (2048)
```

### Special Tile Types

| Type | Effect | Spawn Rate |
|------|--------|-----------|
| **NORMAL** | Standard creature | Most common |
| **BOSS** | High health enemy | Every 5 levels starting at level 5 |
| **BOMB** | Clears 3x3 area | Rare drop |
| **GOLDEN** | Worth 2x value | Item bonus |
| **RUNE_MIDAS** | 2x gold gain | Special power-up |
| **RUNE_CHRONOS** | Extra turn | Special power-up |
| **RUNE_VOID** | Remove tiles | Special power-up |

### Perk System

Unlock special bonuses at key levels:

- **Level 3**: 5% chance for 4-spawn
- **Level 5**: Grid expands to 5x5 + Bosses appear
- **Level 7**: +50% XP from merges
- **Level 10**: Loot mode + Grid expands to 6x6
- **Level 15**: Reroll token + Grid expands to 7x7
- **Level 20**: Auto-merge + Grid expands to 8x8

### Crafting System

Combine lower-tier items to create powerful upgrades:

- **Greater Elixir**: 2× XP Potion + 100 Gold → +2500 XP
- **Cataclysm Scroll**: 2× Bomb Scroll + 200 Gold → Destroys 50% of tiles
- **Ascendant Rune**: 2× Golden Rune + 300 Gold → Guaranteed high-tier spawn

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 16+ and npm
- A modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sp80808/DragonsHoard.git
   cd DragonsHoard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   The game will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview  # Preview the production build locally
```

The compiled game will be in the `dist/` directory, ready to deploy.

---

## 📁 Project Structure

```
DragonsHoard/
├── App.tsx                 # Main game component & state management
├── index.tsx              # React entry point
├── types.ts               # TypeScript type definitions & enums
├── constants.ts           # Game configuration & tile/stage data
├── metadata.json          # Project metadata
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite build configuration
├── index.html             # HTML entry point
│
├── components/            # React components
│   ├── Grid.tsx          # Game board renderer
│   ├── TileComponent.tsx  # Individual tile UI
│   ├── HUD.tsx           # Game stats & info display
│   ├── Store.tsx         # Shop interface for items
│   ├── Leaderboard.tsx   # High score display
│   ├── Settings.tsx      # Game options
│   ├── SplashScreen.tsx  # Intro & new game screen
│   └── Leaderboard.tsx   # Leaderboard view
│
└── services/              # Business logic
    ├── gameLogic.ts       # Core game rules, merging, spawning
    └── audioService.ts    # Sound effect management
```

### Key Files Explained

- **`App.tsx`**: The heart of the game - contains the game state reducer, handles all game actions, and coordinates components
- **`gameLogic.ts`**: Pure functions for game mechanics (merging tiles, spawning creatures, checking win conditions, etc.)
- **`types.ts`**: TypeScript interfaces and enums (Tile, GameState, ItemType, Achievement, etc.)
- **`constants.ts`**: Game configuration (tile definitions, stages, shop items, recipes, perks, achievements)

---

## 🛠️ Development Guide

### Key Concepts

#### Game State Structure
```typescript
interface GameState {
  grid: Tile[];           // Current board state
  score: number;          // Total points earned
  level: number;          // Current level (1+)
  xp: number;             // XP toward next level
  gold: number;           // Currency for shop
  gridSize: number;       // Board dimensions (4-8)
  inventory: InventoryItem[];  // Owned items
  stats: GameStats;       // Historical statistics
  achievements: string[]; // Unlocked achievement IDs
  // ... and more
}
```

#### Game Actions
The reducer accepts several action types:
- `MOVE` - Slide tiles in a direction
- `RESTART` - Reset to new game
- `BUY_ITEM` - Purchase from shop
- `CRAFT_ITEM` - Combine items
- `USE_ITEM` - Deploy consumable
- `UNLOCK_ACHIEVEMENT` - Grant achievement

#### Adding New Features

To add a new tile type:
1. Add enum value to `TileType` in `types.ts`
2. Add styling to `TILE_STYLES` in `constants.ts`
3. Add spawn logic to `spawnTile()` in `gameLogic.ts`
4. Update rendering in `TileComponent.tsx`

To add a new item:
1. Add `ItemType` enum value
2. Add to `SHOP_ITEMS` or `RECIPES` in `constants.ts`
3. Add use effect logic in `useInventoryItem()` in `gameLogic.ts`
4. Update `Store.tsx` to display

### Testing & Debugging

Enable debug logs by checking browser DevTools:
```bash
npm run dev  # Start with source maps enabled
```

Check localStorage for saved games:
- `dragon_hoard_game` - Current game state
- `dragon_hoard_leaderboard` - High scores
- `dragon_hoard_unlocked_achievements` - Unlocked achievements

---

## 🎮 Game Systems

### XP & Leveling

XP requirements scale exponentially:
```
threshold = 1000 × level^1.5
```

This ensures early levels progress quickly while late-game provides meaningful challenge.

### Loot System

Merging tiles has a chance to drop loot:
- **Gold**: Currency for shop and crafting
- **Items**: Random consumables scaled by tile value
- **Boss Drops**: Guaranteed loot from defeated bosses

Loot rarity is influenced by:
- Tile value (higher = better)
- Level progress (later levels have better loot)
- Lucky Charm item (3-turn buff)

### Boss System

Bosses appear every 5 levels starting at level 5:
- Unique visual styling
- Double XP reward
- Guaranteed premium loot
- Cannot be moved off-board until defeated

### Achievement System

Track 20+ achievements including:
- Progress milestones (reach level 10, 20, etc.)
- Gameplay feats (merge 100 tiles, defeat 5 bosses, etc.)
- Secret achievements (hidden conditions)
- Rewards for unlocking (gold, items, XP)

---

## 🤝 Contributing

We welcome contributions! Here's how to help:

1. **Fork** the repository
2. **Create a branch** for your feature (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open a Pull Request** with a clear description

### Development Tips

- Follow the existing code style (TypeScript, functional components)
- Add types for new features
- Test changes in both desktop and mobile viewports
- Update documentation if adding new systems

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🎨 Art & Assets

Game artwork is dynamically generated using [Pollinations.ai](https://pollinations.ai) API, enabling infinite visual variety while keeping the game lightweight.

---

## 📞 Support & Feedback

Have questions or found a bug? Please open an issue on GitHub!

---

**Made with ❤️ by sp80808**

