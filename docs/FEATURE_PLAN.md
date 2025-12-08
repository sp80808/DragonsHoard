# Dragon's Hoard - Feature Plan & Roadmap

**Last Updated:** December 8, 2025  
**Current Version:** 1.0.0  
**Status:** Active Development

---

## Table of Contents

1. [Current Features](#current-features)
2. [Planned Features](#planned-features)
3. [Implementation Roadmap](#implementation-roadmap)
4. [Technical Debt & Improvements](#technical-debt--improvements)
5. [Community & Feedback](#community--feedback)

---

## Current Features

### Core Gameplay
- ✅ **2048-style Tile Merging**: Combine identical creatures to create stronger variants
- ✅ **11-Tier Creature Progression**: From Slime (2) to Dragon God (2048)
- ✅ **Dynamic Grid Expansion**: 4×4 → 8×8 grid as players progress
- ✅ **Level-Based Progression**: 50+ levels with exponential XP scaling
- ✅ **Boss Encounters**: Appear every 5 levels starting at level 5
- ✅ **Stage/Zone System**: 5 different biomes (Crypt → Elysium) with unique visuals

### Progression & Economy
- ✅ **Creature Merging**: Base XP and gold from merges scale with tile value
- ✅ **Boss Rewards**: Double gold + guaranteed premium loot
- ✅ **Perk Unlocks**: 10+ perks unlocked as players level up
  - Grid expansions, XP bonuses, boss spawning, loot drops, auto-merge
- ✅ **Shop System**: 5+ consumable items purchasable with gold
- ✅ **Inventory System**: Store and use items strategically

### Items & Special Mechanics
- ✅ **XP Potion**: Direct XP boost
- ✅ **Bomb/Purge Scroll**: Clears lowest-value tiles
- ✅ **Reroll Token**: Reset board state
- ✅ **Golden Rune**: Next spawn guaranteed high-tier
- ✅ **Lucky Charm**: Temporary gold multiplier
- ✅ **Rune Tiles** (3 types):
  - RUNE_MIDAS: +2× gold for 3 merges
  - RUNE_CHRONOS: Extra turn (undo mechanic)
  - RUNE_VOID: Remove any tile

### UI & Experience
- ✅ **Responsive Grid Display**: Touch/keyboard/mouse controls
- ✅ **HUD**: Level, XP bar, gold counter, stage display
- ✅ **Floating Text Effects**: Visual feedback for merges, gold, XP gains
- ✅ **Game Logs**: Recent action history
- ✅ **Settings Panel**: Audio toggle, game speed, visual effects
- ✅ **Leaderboard**: Track personal best scores
- ✅ **Achievement System**: 15+ achievements with unique challenges
- ✅ **Splash Screen**: Title screen with new game/continue options

### Audio & Visuals
- ✅ **Dynamic Background Images**: AI-generated per stage via Pollinations.ai
- ✅ **Creature Artwork**: AI-generated unique sprites for each tier
- ✅ **Sound Effects**: Merge, spawn, level-up, boss defeat, UI interactions
- ✅ **Music System**: Adaptive background music per stage
- ✅ **Visual Effects**: Tile glows, merge animations, floating text

### Data Persistence
- ✅ **localStorage Saving**: Auto-save game state
- ✅ **Save/Load Game**: Resume from splash screen
- ✅ **Leaderboard Storage**: Persistent high score tracking
- ✅ **Achievement Tracking**: Unlock history preserved

---

## Planned Features

### 🎯 Priority Tier 1: Core Gameplay Enhancements (Near-term)

#### 1. **Crafting System**
- **Description**: Combine multiple items to create rare/powerful consumables
- **Mechanics**:
  - 3 base crafting recipes: Combine 3 potions → Greater Potion, etc.
  - Gold cost requirement for crafting
  - Recipe UI showing ingredients and results
- **Impact**: Adds depth to economy, makes items feel more valuable
- **Estimated Effort**: 2-3 days
- **Technical Notes**: Add to constants.ts (CraftingRecipe interface), gameLogic.ts (merge logic)

#### 2. **Daily Challenges**
- **Description**: Time-limited objectives that reset each day
- **Example Challenges**:
  - "Reach level 10 in one session"
  - "Defeat 5 bosses"
  - "Earn 50,000 gold"
  - "Merge 100 tiles"
- **Rewards**: Bonus XP, gold, exclusive items
- **Impact**: Encourages daily engagement, repeatable goals
- **Estimated Effort**: 3-4 days
- **Technical Notes**: 
  - Add dailyChallenges to GameState
  - Implement daily reset logic based on timestamp
  - Track progress per challenge

#### 3. **Combo System**
- **Description**: Chain merges together to earn multiplier bonuses
- **Mechanics**:
  - Track consecutive merges without board spawn
  - Combo meter fills with each merge (max 5× multiplier)
  - Bonus XP + gold applied at combo end
  - Visual indicator showing combo count
- **Impact**: Adds skill-based reward, makes gameplay feel more dynamic
- **Estimated Effort**: 2-3 days
- **Technical Notes**: 
  - Add comboMultiplier to GameState
  - Modify moveGrid logic to track merge count
  - Add FloatingText for combo notifications

#### 4. **Wave/Challenge Modes**
- **Description**: Timed survival modes with escalating difficulty
- **Variants**:
  - **Time Attack**: 5-minute hardcore survival, no pauses
  - **Wave Mode**: 10 waves of increasing spawn rates
  - **Boss Rush**: 5-10 boss encounters back-to-back
- **Rewards**: Special cosmetic items, leaderboard ranking
- **Impact**: Adds replayable competitive content
- **Estimated Effort**: 4-5 days

#### 5. **Deck/Class System** (Optional)
- **Description**: Pre-game selection of passive abilities
- **Examples**:
  - "Berserker": +damage but fewer heals
  - "Scholar": +XP gain but lower gold
  - "Merchant": +gold but slower leveling
- **Impact**: Multiple playstyles, replayability
- **Estimated Effort**: 3-4 days

---

### 🎯 Priority Tier 2: Polish & QoL (Medium-term)

#### 6. **Enhanced Animation System**
- **Description**: Smoother, more satisfying tile animations
- **Improvements**:
  - Particle effects on merges
  - Creature evolve animations (transition between tiers)
  - Screen shake on boss hits
  - Bounce/scale animations for important events
- **Impact**: Feels more polished and rewarding
- **Estimated Effort**: 3-4 days
- **Tools**: Framer Motion or custom CSS animations

#### 7. **Tutorial & Onboarding**
- **Description**: Interactive guided first-time experience
- **Features**:
  - Step-by-step merge tutorial
  - Highlight key UI elements
  - Explain leveling system
  - Show shop/inventory usage
  - Optional tutorial replay
- **Impact**: Lowers barrier to entry for new players
- **Estimated Effort**: 3-4 days

#### 8. **Statistics Dashboard**
- **Description**: Detailed game analytics displayed to player
- **Metrics**:
  - Merge count breakdown by tile value
  - Average XP per merge
  - Gold earned per stage
  - Most used items
  - Boss win/loss ratio
  - Session duration & trends
- **Impact**: Players understand their performance, increases engagement
- **Estimated Effort**: 2-3 days

#### 9. **Mobile Optimization**
- **Description**: Enhanced touch controls and responsive layout
- **Improvements**:
  - Gesture controls (swipe with better feedback)
  - Optimized button/text sizing for mobile
  - Touch-friendly UI on small screens
  - Performance optimization for mobile devices
  - Landscape orientation support
- **Impact**: Better mobile user experience
- **Estimated Effort**: 2-3 days

#### 10. **Save Slots / Multiple Profiles**
- **Description**: Support multiple independent game saves
- **Features**:
  - Create/delete game slots
  - Quick switch between saves
  - Per-save settings
  - Leaderboard tracks by profile
- **Impact**: Players can experiment without losing progress
- **Estimated Effort**: 2-3 days

#### 11. **Undo/Rewind System**
- **Description**: Limited undo mechanics
- **Features**:
  - 1-3 free undos per session (resets on level up)
  - Can rewind board to previous state
  - Visual indicator of undo count
  - Strategic decision-making element
- **Impact**: Reduces frustration on bad RNG while maintaining challenge
- **Estimated Effort**: 2-3 days
- **Note**: Complements RUNE_CHRONOS mechanic

---

### 🎯 Priority Tier 3: Advanced Features (Long-term)

#### 12. **Multiplayer / PvP**
- **Description**: Competitive or cooperative gameplay modes
- **Options**:
  - **Async Leaderboard**: See real-time competitive scores
  - **Trading System**: Exchange items with other players
  - **Co-op Mode**: Shared board between 2 players
  - **PvP Arena**: 1v1 timed matches
- **Impact**: Long-term engagement, community building
- **Estimated Effort**: 10-15 days (significant backend needed)
- **Technical Notes**: Requires WebSocket or Firebase/Supabase backend

#### 13. **Story Campaign**
- **Description**: Narrative progression through levels
- **Features**:
  - Lore about Dragon God and 5 realms
  - Boss characters with unique dialogue
  - Story cutscenes between major level milestones
  - Unlockable lore entries
  - Branching narrative paths
- **Impact**: Emotional investment, context for gameplay
- **Estimated Effort**: 5-7 days (mostly writing + cutscene UX)

#### 14. **Cosmetics & Skins**
- **Description**: Visual customizations
- **Options**:
  - Creature skins (dark theme, neon, retro pixel)
  - Board themes (dark dungeon, glowing neon, cosmic)
  - UI themes
  - Title animations
  - Purchase with gold or unlock via achievements
- **Impact**: Expresses player identity, monetization option
- **Estimated Effort**: 4-6 days

#### 15. **Prestige System**
- **Description**: Reset progression for permanent bonuses
- **Mechanics**:
  - After reaching level 50, can prestige
  - Resets level/XP/board but grants permanent stat boost
  - Each prestige increases XP gain, gold gain, or creature power
  - Prestige level displayed on leaderboard
  - Unlock cosmetics tied to prestige tier
- **Impact**: Endgame content, long-term progression
- **Estimated Effort**: 3-4 days

#### 16. **Procedural Content**
- **Description**: Randomized modifiers and events
- **Features**:
  - Run modifiers (e.g., "Creatures cost 2× more XP", "Double gold")
  - Random events during gameplay (meteor shower, treasure chest)
  - Procedurally generated challenges
  - Seed-based replays for speedrunning
- **Impact**: Infinite replayability, speedrun community
- **Estimated Effort**: 4-5 days

#### 17. **Expansion Packs / DLC**
- **Description**: New creatures, stages, items
- **Content**:
  - New creature line (tier 13-15)
  - 2-3 new stages with unique mechanics
  - 5+ new items with special effects
  - New boss types
- **Impact**: Long-term content updates, player retention
- **Estimated Effort**: 7-10 days per pack

---

### 🎯 Priority Tier 4: Community & Social (Optional)

#### 18. **User-Generated Content**
- **Description**: Allow players to create and share content
- **Features**:
  - Build custom board layouts/seeds
  - Share runs (replay codes)
  - Design custom achievements
  - Contest system (best run, fastest level, etc.)
- **Impact**: Community engagement, extended gameplay
- **Estimated Effort**: 5-7 days

#### 19. **Guilds / Clans**
- **Description**: Group players into communities
- **Features**:
  - Guild creation with permissions
  - Guild bank for item trading
  - Weekly guild challenges (cooperative goals)
  - Guild leaderboard rankings
  - Discord integration
- **Impact**: Community building, social features
- **Estimated Effort**: 8-10 days (backend required)

#### 20. **Live Events**
- **Description**: Time-limited seasonal content
- **Features**:
  - Holiday-themed events (Halloween bosses, Xmas creatures)
  - Seasonal pass progression
  - Limited-time store items
  - Special event-only creatures
- **Impact**: Reasons to return regularly
- **Estimated Effort**: 3-5 days per event

---

## Implementation Roadmap

### **Phase 1: MVP + Polish** (Weeks 1-2)
- [x] Core 2048 mechanics ✓
- [ ] Crafting System (feature #1)
- [ ] Tutorial & Onboarding (feature #7)
- [ ] Mobile Optimization (feature #9)
- [ ] Bug fixes and gameplay balance

**Deliverable**: Polished, feature-complete 1.0 release

---

### **Phase 2: Engagement Loop** (Weeks 3-4)
- [ ] Daily Challenges (feature #2)
- [ ] Combo System (feature #3)
- [ ] Statistics Dashboard (feature #8)
- [ ] Save Slots (feature #10)
- [ ] Achievement balancing
- [ ] Community feedback incorporation

**Deliverable**: 1.1 release with daily engagement mechanics

---

### **Phase 3: Replayability** (Weeks 5-7)
- [ ] Enhanced Animations (feature #6)
- [ ] Wave/Challenge Modes (feature #4)
- [ ] Undo/Rewind System (feature #11)
- [ ] Procedural Content (feature #16)
- [ ] Leaderboard refinement

**Deliverable**: 1.2 release with challenge modes

---

### **Phase 4: Expansion** (Weeks 8-12)
- [ ] Story Campaign (feature #13)
- [ ] Cosmetics & Skins (feature #14)
- [ ] Prestige System (feature #15)
- [ ] Multiplayer Framework (feature #12 - Part 1)

**Deliverable**: 2.0 release with story + endgame

---

### **Phase 5: Community** (Ongoing)
- [ ] Live Events (feature #20)
- [ ] Full Multiplayer (feature #12 - Part 2)
- [ ] Guilds System (feature #19)
- [ ] User-Generated Content (feature #18)
- [ ] Expansion Packs (feature #17)

**Deliverable**: 2.1+ with seasonal content

---

## Technical Debt & Improvements

### Code Quality
- [ ] Add comprehensive unit tests (70%+ coverage)
- [ ] Refactor `gameLogic.ts` - split into smaller modules
- [ ] Add JSDoc comments to all public functions
- [ ] Implement error boundary for crash recovery
- [ ] Add performance monitoring/metrics

### Architecture
- [ ] Consider extracting to modular component library
- [ ] Add state management validation (middleware)
- [ ] Implement feature flags for A/B testing
- [ ] Add analytics integration (Plausible/Segment)
- [ ] Create CI/CD pipeline (GitHub Actions)

### Performance
- [ ] Optimize Pollinations.ai image loading (caching)
- [ ] Lazy-load achievement data
- [ ] Virtualize leaderboard (if >1000 entries)
- [ ] Reduce re-renders (memoization audit)
- [ ] Bundle analysis and optimization

### Accessibility
- [ ] Add ARIA labels to all interactive elements
- [ ] Keyboard navigation for all UI
- [ ] Color-blind friendly palette option
- [ ] Screen reader testing
- [ ] High contrast mode

### Documentation
- [ ] API documentation for game services
- [ ] Architecture decision records (ADRs)
- [ ] Contributing guide for open source
- [ ] Plugin/mod system documentation
- [ ] Video tutorials/DevLog

---

## Community & Feedback

### Gathering Feedback
- **Discord Server**: Create for community discussion
- **Feedback Form**: In-game or web form for suggestions
- **Regular Surveys**: Monthly player satisfaction polls
- **Beta Testing**: Early access for engaged players
- **Content Creator Program**: Partner with streamers

### Priority Signals
Features voted on by community will receive higher priority. Current voting mechanisms:
1. GitHub Discussions (pinned feature request threads)
2. In-game feedback button
3. Discord community polls
4. Reddit/social media mentions

### Known Issues Tracker
See [CONTRIBUTING.md](CONTRIBUTING.md) for reporting bugs and feature requests.

---

## Success Metrics

### Player Engagement
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Average Session Length
- Return rate (% returning after 1 day/7 days)
- Progression to Level 10, 25, 50

### Quality
- Bug report rate
- Crash-free rate
- Load time (< 2s target)
- Mobile conversion rate

### Community
- Discord members
- GitHub stars
- Content creator coverage
- User-generated content submissions

---

## Questions & Discussion

**For community feedback and discussion, please:**
1. Open an Issue on GitHub (with `[FEATURE]` prefix)
2. Join our Discord community
3. Reply to Feature Request discussions

**Last Review**: December 8, 2025  
**Next Review**: January 8, 2026
