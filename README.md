<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# 🐲 Dragon's Hoard

**A dark fantasy RPG twist on the classic 2048 puzzle game**

[![Play on AI Studio](https://img.shields.io/badge/Play%20on-AI%20Studio-blue)](https://ai.studio/apps/drive/1C6HQVYxPtGY3YgJ_HKmI1nvRgdzHykk5)
[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-purple.svg)](https://vitejs.dev/)

</div>

---

## 🎮 About

Dragon's Hoard combines the addictive sliding-tile mechanics of 2048 with deep RPG progression and dark fantasy aesthetics. Merge tiles to slay monsters, earn XP, level up your character, collect powerful loot, and ultimately face the legendary Dragon God!

### ✨ Key Features

- **🎯 2048-Style Gameplay** - Slide and merge tiles with smooth animations and satisfying feedback
- **⚔️ RPG Progression System** - Level up to unlock perks, expand your grid, and increase your power
- **👹 Monster Evolution** - From lowly Slimes to mighty Dragons - each merge advances your foes
- **🏆 Boss Battles** - Face challenging boss monsters every 5 levels with health bars and epic encounters
- **💎 Loot & Economy** - Collect gold from merges and discover rare items to aid your quest
- **🛒 Item Shop & Crafting** - Purchase consumables and combine them into more powerful artifacts
- **🏅 Achievement System** - Complete challenges to earn rewards and track your progress
- **🌍 Dynamic Stages** - Journey through 5 distinct environments: The Crypt, Fungal Caverns, Magma Core, The Void, and Elysium
- **🎨 AI-Generated Art** - Unique monster and environment art powered by Pollinations.ai
- **🔊 Atmospheric Audio** - Immersive sound effects enhance the dark fantasy experience
- **💾 Auto-Save** - Never lose your progress with automatic save states
- **📊 Leaderboard** - Track your best runs with local high scores

### 🎲 Game Mechanics

- **Grid Expansion**: Start with 4x4, grow to 8x8 as you level up
- **XP & Leveling**: Gain XP from merges with combo multipliers
- **Gold Economy**: Earn gold to purchase items and craft powerful artifacts
- **Combo System**: Chain merges for bonus rewards
- **Power-ups & Items**: 
  - 🧪 XP Potions for instant experience
  - 📜 Scrolls to clear tiles
  - 🍀 Lucky Charms for better loot
  - 🌟 Special runes for upgraded spawns
- **Boss Encounters**: Tougher enemies with health bars that require strategic play
- **Reroll System**: Shuffle the board when stuck (unlocked at level 15)
- **Auto-Merge**: Rare automatic combinations at higher levels

## 🎯 How to Play

1. **Swipe or use arrow keys** to move tiles in any direction
2. **Merge matching tiles** to create higher-value monsters (2 → 4 → 8 → 16...)
3. **Earn XP and Gold** from successful merges
4. **Level up** to unlock perks, expand your grid, and face stronger foes
5. **Defeat bosses** at levels 5, 10, 15, 20... to progress
6. **Shop for items** to help overcome challenges
7. **Reach 2048** to face the Dragon God and win!

## 🚀 Run Locally

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**

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

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` (or the URL shown in your terminal)

### Build for Production

```bash
npm run build
npm run preview
```

## 🛠️ Technologies Used

- **Frontend Framework**: [React 19.2](https://reactjs.org/) with Hooks
- **Language**: [TypeScript 5.8](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6.2](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (via CDN)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Fonts**: [Google Fonts](https://fonts.google.com/) (Cinzel + Lato)
- **AI Art**: [Pollinations.ai](https://pollinations.ai/) for dynamic asset generation

## 📁 Project Structure

```
DragonsHoard/
├── components/          # React components
│   ├── Grid.tsx        # Game grid display
│   ├── HUD.tsx         # Heads-up display (stats, XP, level)
│   ├── Store.tsx       # Shop and crafting interface
│   ├── Leaderboard.tsx # High score tracking
│   ├── Settings.tsx    # Game settings
│   ├── SplashScreen.tsx # Main menu
│   └── TileComponent.tsx # Individual tile rendering
├── services/           # Game logic & services
│   ├── gameLogic.ts   # Core game mechanics
│   └── audioService.ts # Sound effects
├── App.tsx            # Main app component
├── types.ts           # TypeScript type definitions
├── constants.ts       # Game constants & configuration
├── index.tsx          # Entry point
└── index.html         # HTML template
```

## 🎨 Visual Design

Dragon's Hoard features a dark fantasy aesthetic with:
- **Atmospheric backgrounds** that change with each stage
- **Particle effects** and animations for merges and special events
- **CRT scanline effect** for retro ambiance
- **Dynamic lighting** with glows and shadows
- **Smooth transitions** between game states
- **Responsive design** that works on desktop and mobile

## 🎵 Audio

The game includes immersive sound effects for:
- Tile movements and merges
- Combat and boss battles
- Item usage and shop purchases
- Level ups and achievements
- Victory and defeat

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Share your high scores!

## 📄 License

This project is available for personal and educational use.

## 🙏 Credits

- **Game Design & Development**: sp80808
- **AI Art Generation**: [Pollinations.ai](https://pollinations.ai/)
- **Inspiration**: Classic 2048 game + Dark Souls aesthetic

---

<div align="center">

**Play now on [AI Studio](https://ai.studio/apps/drive/1C6HQVYxPtGY3YgJ_HKmI1nvRgdzHykk5)!**

Made with ❤️ and ⚔️

</div>
