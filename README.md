# 🐉 Dragon's Hoard

**Dragon's Hoard** is a stylized, dark fantasy RPG twist on the classic 2048 puzzle game. Merge tiles to slay beasts, earn XP, level up, collect loot, and craft powerful artifacts in your quest to defeat the Dragon God.

Built with **React**, **Vite**, **TailwindCSS**, and infused with **Google Gemini AI** for dynamic storytelling.

![Game Preview](https://image.pollinations.ai/prompt/mysterious%20dark%20fantasy%20dungeon%20entrance%20environment%20art%20no%20text%20scenery?width=1024&height=512&nologo=true&seed=99)

## ✨ Features

-   **Core Gameplay**: Classic 2048 merging mechanics infused with RPG combat logic.
-   **RPG Progression**:
    -   **Classes**: Unlock specialized classes like Warrior, Rogue, Mage, Paladin, and Dragon Slayer.
    -   **Leveling**: Earn XP to increase your Account Level, unlocking perks and features.
    -   **Skill Tree**: Invest Skill Points in the Astral Mastery tree for passive buffs.
-   **Economy & Crafting**:
    -   **Loot**: Discover gold and items (Potions, Scrolls) during gameplay.
    -   **Shop & Forge**: Buy survival supplies or craft legendary artifacts using recipes.
-   **Immersive Audio-Visuals**:
    -   **Dynamic Themes**: Unlock visual tilesets (Undead, Infernal, Celestial, Cyberpunk, etc.).
    -   **Atmosphere**: Particle effects, screen shake, and procedural ambient animations.
-   **AI Integration**:
    -   **Gemini API**: Generates unique, somber obituaries and story snippets based on your run stats.
-   **Social & Competitive**:
    -   **Leaderboards**: Global and Friend rankings (integrated with FB Instant Games).
    -   **Versus Mode**: Local split-screen multiplayer for desktop users.

## 🛠️ Tech Stack

-   **Frontend**: React 18, TypeScript, Vite
-   **Styling**: TailwindCSS, Framer Motion
-   **State Management**: React Context & Reducers
-   **Backend / Persistence**:
    -   Supabase (Auth, Realtime Multiplayer infrastructure)
    -   Facebook Instant Games SDK (Social graph, Cloud Storage)
    -   Local Storage (Offline fallback)
-   **AI**: Google GenAI SDK (Gemini 2.5/3 models)

## 🚀 Getting Started

### Prerequisites

-   Node.js (v16+)
-   A Google Cloud Project with the Gemini API enabled.
-   (Optional) A Supabase project for multiplayer features.

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/dragons-hoard.git
    cd dragons-hoard
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure Environment Variables:
    Create a `.env` file in the root directory:
    ```env
    API_KEY=your_google_genai_api_key
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
    ```

4.  Start the development server:
    ```bash
    npm run dev
    ```

5.  Open `http://localhost:3000` in your browser.

## 🎮 Controls

-   **Movement**: `Arrow Keys` or `WASD` / `Swipe` on mobile.
-   **Inventory**: Keys `1`, `2`, `3` to use items in respective slots.
-   **UI**: `Esc` to close menus or pause.

## 🗺️ Roadmap

See [PROGRESS.md](./PROGRESS.md) for a detailed development status report.

-   [ ] **Daily Dungeons**: Seeded runs with unique modifiers resetting every 24h.
-   [ ] **Live Multiplayer**: Real-time PvP races via Supabase channels.
-   [ ] **Localization**: Multi-language support (ES, FR, JP).
-   [ ] **Accessibility**: High contrast mode and reduced motion toggles.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.