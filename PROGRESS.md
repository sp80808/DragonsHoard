# Dragon's Hoard - Development Progress

## 🟢 Completed Features
- **Core Gameplay**: 2048 Logic, Merging, Moving, Cascade Logic.
- **RPG Elements**: XP, Account Levels, Boss HP, Loot Drops.
- **Inventory & Shop**: Consumables, Crafting Recipes, Dynamic Stock.
- **Visuals**: 
    - Particle Systems (Loot, Merges, Boss Spawns).
    - Dynamic Backgrounds based on Score.
    - Multiple Tilesets (Undead, Infernal, etc.).
- **Audio**: Sound Effects engine, procedural music/ambience hooks.
- **Game Modes**: 
    - **Adventure (RPG)**: Standard progression.
    - **Classic**: Pure 2048.
    - **Local Versus**: Split-screen multiplayer.
- **Meta-Progression**: 
    - **Skill Tree**: Astral Mastery with unlockable nodes.
    - **Codex**: Bestiary and Item Log.
    - **Grimoire**: Theme selection and Medals tracker.
- **Social**: Leaderboards (Global/Friends), Daily Login Rewards.
- **AI**: Obituary generation via Gemini API.

## 🟡 In Progress / Polishing
- **Multiplayer Architecture**: 
    - Supabase integration is set up (`src/utils/supabase.ts`).
    - Database schema for `players`, `leaderboards`, and `gifts` defined.
    - *Next*: Implementing Realtime channels for Live PvP.
- **Daily Dungeons**: 
    - Modifiers logic exists (`DAILY_MODIFIERS`).
    - *Next*: Server-side seeding to ensure all players get the same board daily.

## 🔴 Roadmap (Next Steps)

### Phase 1: Live Services (Supabase)
1.  **Ghost Mode PvP**: Implement `room:race_<id>` channel to broadcast grid state to opponent.
2.  **Co-op Raids**: Allow two players to contribute damage to a shared Boss HP bar.
3.  **Tribute System**: "Steal" gold from inactive friends on the leaderboard.

### Phase 2: Content Expansion
1.  **More Classes**: Necromancer (summons minions), Alchemist (transmutes tiles).
2.  **Advanced Biomes**: 
    - **Void Realm**: Tiles periodically disappear.
    - **Time Warp**: Moves are delayed or reversed.
3.  **Localization**: JSON-based translation system.

### Phase 3: Accessibility & Polish
1.  **Settings**: Add High Contrast mode and Reduced Motion toggle.
2.  **Input**: Gamepad support for Desktop/TV play.
3.  **Performance**: WebGL renderer for particles (currently Canvas 2D).

## 🐛 Known Issues
-   **Audio**: Web Audio API requires user interaction to initialize (handled, but sometimes delays SFX on first load).
-   **Mobile Safari**: Address bar can obscure bottom HUD in some landscape orientations.