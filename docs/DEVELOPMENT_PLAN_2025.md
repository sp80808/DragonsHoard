# Dragon's Hoard - Development Plan 2025

**Date Created:** December 8, 2025  
**Status:** Active Planning Document  
**Current Phase:** Visual Polish & Core Feature Enhancement

---

## 🎯 EXECUTIVE SUMMARY

Dragon's Hoard is transitioning from core gameplay implementation to a comprehensive polish and feature expansion phase. With the cascade system now complete, we're focusing on visual feedback, particle systems, and progression mechanics that create a premium, addictive game experience.

**Key Achievements to Date:**
- ✅ Core 2048 mechanics with dragon theme
- ✅ Boss system, power-ups, shop, dailies
- ✅ 18 CSS animations for micro-interactions
- ✅ Cascade chain reaction system (Phase 1)
- ✅ Zero TypeScript errors, 60fps performance

**Strategic Vision:**
Transform Dragon's Hoard from a solid 2048 variant into a best-in-class incremental game with AAA-level visual polish, deep progression systems, and high player retention.

---

## 📊 CURRENT STATUS SNAPSHOT

### ✅ Completed Systems
- **Core Gameplay:** 2048 grid mechanics, merge system, movement
- **Combat:** Boss spawning, HP system, damage calculation
- **Economy:** Gold, XP, leveling, shop
- **Items:** Potions, runes, consumables
- **Daily Challenges:** 3 challenge types, streak tracking
- **Statistics:** Comprehensive game stats tracking
- **Visual Phase 1:** Micro-animations, tap feedback, combo effects
- **Cascade System Phase 1:** Auto-merge detection, sequential execution, visual ring

### 🔄 In Progress
- **Visual Phase 2:** Particle systems (0%)
- **Cascade Testing:** User feedback needed
- **Performance Optimization:** Monitoring for particle load

### ⬜ Not Started (Planned)
- **Advanced Particles:** Lightning arcs, soul wisps, gold bursts
- **Pattern Detection:** 3-in-a-row, 2×2 squares
- **Account Progression:** Mastery tiers, prestige system
- **Advanced Audio:** Dynamic layer stacking, combo tones
- **Stage Transitions:** Animated biome changes

---

## 🗓️ DEVELOPMENT ROADMAP (Next 3 Months)

### **PHASE 2.1: Particle Foundation** (Week 1-2)
**Goal:** Implement core particle system for resource feedback

#### Week 1: Base Particle System
**Priority:** CRITICAL ⭐⭐⭐  
**Time Estimate:** 8-12 hours  
**Risk:** Low (CSS/Canvas well-documented)

**Deliverables:**
1. **Particle Base Component** (`components/Particle.tsx`)
   - Props: type, startPos, endPos, color, lifetime
   - Supports both DOM and Canvas rendering
   - Pooling system for performance (reuse particles)
   - 60fps animation via requestAnimationFrame

2. **XP Soul Particles**
   - Blue wisps fly from merge point → XP bar
   - Bezier curve path (natural arc)
   - 5-10 particles per merge
   - Duration: 400ms
   - Integration: Hook into gameLogic merge rewards

3. **Gold Coin Burst**
   - 10-20 coins eject from merge
   - Physics-based arcs (gravity simulation)
   - Coins "clink" into gold counter
   - Staggered arrivals (50ms intervals)
   - Duration: 800ms total

**Technical Approach:**
```typescript
// Particle pool for performance
class ParticlePool {
  private particles: Particle[] = [];
  private activeCount = 0;
  
  spawn(config: ParticleConfig) {
    const particle = this.particles[this.activeCount] || new Particle();
    particle.init(config);
    this.activeCount++;
  }
  
  update() {
    // RAF loop, update active particles only
  }
}
```

**Success Metrics:**
- 100+ particles on screen at 60fps
- No memory leaks (particle pooling working)
- Particles feel "juicy" (good timing/arcs)

#### Week 2: Merge & Combo Particles
**Priority:** HIGH ⭐⭐⭐  
**Time Estimate:** 6-8 hours

**Deliverables:**
1. **Merge Spark Shower**
   - Radial burst of 15-20 sparks
   - Random directions (360°)
   - Sparks fade after 200ms
   - Color matches tile tier

2. **Combo Active Aura**
   - Floating ember particles around grid edges
   - Intensity increases with combo count
   - Looping animation while combo active
   - Fades when combo expires

3. **Tier Ascension Effect**
   - Special burst for 8→16, 64→128, 256→512
   - Larger particles, longer duration
   - Halo effect around merged tile

**Integration Points:**
- Modify `App.tsx` MOVE reducer to trigger particles
- Use existing cascade system hooks
- Coordinate with ComboCounter component

---

### **PHASE 2.2: Advanced Visual Feedback** (Week 3-4)
**Goal:** Enhanced floating text and grid feedback

#### Week 3: Floating Text Overhaul
**Priority:** MEDIUM ⭐⭐  
**Time Estimate:** 4-6 hours

**Deliverables:**
1. **Enhanced Damage Numbers**
   - Critical hits: Red text, shake animation, 1.5× size
   - Normal hits: White text, subtle fade-up
   - Text outlines for readability (black stroke)

2. **Gold Pop Numbers**
   - Gold icon next to number
   - Color: Gold gradient (#FFD700 → #FFA500)
   - Arc upward, fade at peak

3. **Level Up Banner**
   - Full-width banner slides from top
   - "LEVEL UP!" text with particle trail
   - Shows new level number
   - Auto-dismisses after 2s

**CSS Enhancements:**
```css
.critical-damage {
  animation: criticalHit 600ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
  color: #ff3030;
  text-shadow: 0 0 10px #ff0000, 2px 2px 0 #000;
  font-size: 2.5rem;
  font-weight: 900;
}

@keyframes criticalHit {
  0% { transform: scale(0.5) rotate(-5deg); opacity: 0; }
  60% { transform: scale(1.2) rotate(5deg); }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}
```

#### Week 4: Grid Visual Feedback
**Priority:** MEDIUM ⭐⭐  
**Time Estimate:** 4-5 hours

**Deliverables:**
1. **Combo Border Glow**
   - Grid border pulses with combo count
   - 3-5 combo: Cyan glow
   - 6-9 combo: Purple glow
   - 10+ combo: Gold glow with particle trail
   - Uses existing CSS animations

2. **Near-Death Danger Vignette**
   - Triggers when <3 moves available
   - Red vignette pulses (800ms loop)
   - Screen subtle shake (2px)
   - Warning icon in corner

3. **Boss Entrance Effect**
   - Screen darkens (vignette)
   - Boss tile spawns with beam of light
   - Health bar slides in from top
   - Demonic roar sound effect placeholder

**Implementation:**
```typescript
// In App.tsx
const remainingMoves = findAvailableMoves(grid);
const isDangerous = remainingMoves.length < 3;

return (
  <div className={isDangerous ? 'danger-mode' : ''}>
    {/* Grid and UI */}
  </div>
);
```

---

### **PHASE 2.3: Cascade System Phase 2** (Week 5-6)
**Goal:** Pattern detection and advanced cascade features

#### Week 5: Pattern Detection
**Priority:** MEDIUM ⭐⭐  
**Time Estimate:** 8-10 hours  
**Risk:** Medium (complex logic)

**Deliverables:**
1. **Pattern Detection Functions**
   ```typescript
   // services/gameLogic.ts additions
   export const findPatterns = (grid: Tile[]): Pattern[] => {
     return [
       ...findHorizontalLines(grid),  // 3-in-a-row horizontal
       ...findVerticalLines(grid),    // 3-in-a-row vertical
       ...findSquares(grid)           // 2×2 same-value squares
     ];
   };
   
   interface Pattern {
     type: 'horizontal' | 'vertical' | 'square';
     tiles: Tile[];
     bonus: { xp: number; gold: number };
   }
   ```

2. **Pattern Bonuses**
   - **3-in-a-row:** +50% rewards, "Horizontal Strike!" message
   - **3-in-a-column:** +50% rewards, "Vertical Slam!" message
   - **2×2 square:** +100% rewards, spawns Elite Monster (special boss)
   - Visual: Lightning connects pattern tiles (400ms)

3. **Pattern Lens Shop Item**
   - Cost: 150 gold
   - Effect: Highlights potential patterns for 3 turns
   - Visual: Glowing outlines on tiles

**Testing Strategy:**
- Unit tests for pattern detection edge cases
- Visual debug mode to show detected patterns
- Balance testing: Ensure patterns aren't too rare/common

#### Week 6: Cascade Polish & Achievements
**Priority:** LOW ⭐  
**Time Estimate:** 4-6 hours

**Deliverables:**
1. **Lightning Arc Animation**
   - SVG or Canvas line between cascading tiles
   - Electric pulse effect (200ms)
   - Audio: Zap sound

2. **Cascade Achievements**
   - "Chain Reaction" - First cascade (10 gold)
   - "Chain Lightning" - 5-cascade combo (50 gold)
   - "Cascade Master" - 10-cascade combo (Legendary Chest)
   - "Geometer" - Trigger all 3 pattern types (200 gold)

3. **Chain Catalyst Shop Item**
   - Cost: 200 gold
   - Effect: +50% cascade rewards next turn
   - One-time use consumable

---

### **PHASE 3: Account Progression** (Week 7-9)
**Goal:** Long-term retention systems

#### Week 7-8: Account Level System
**Priority:** HIGH ⭐⭐⭐  
**Time Estimate:** 12-15 hours  
**Risk:** Medium (localStorage management)

**Deliverables:**
1. **Account XP Tracking**
   - Separate from game-level XP
   - Persists across all games (localStorage)
   - Cumulative: All XP earned → Account XP
   - Level curve: Exponential (Level 1→2 = 1000 XP, Level 50→51 = 1M XP)

2. **Mastery Tiers**
   ```typescript
   interface MasteryTier {
     name: string;
     levelRange: [number, number];
     bonuses: {
       xpBoost: number;    // +5%, +10%, etc.
       goldBoost: number;
       rareSpawn: number;
     };
     cosmetics: {
       border: string;     // CSS class
       title: string;      // Display name
       particle?: string;  // Special effects
     };
   }
   
   const TIERS: MasteryTier[] = [
     { name: 'Bronze', levelRange: [1, 20], bonuses: { xpBoost: 0.05, goldBoost: 0, rareSpawn: 0 }, ... },
     { name: 'Silver', levelRange: [21, 40], bonuses: { xpBoost: 0.10, goldBoost: 0.05, rareSpawn: 0 }, ... },
     { name: 'Gold', levelRange: [41, 60], bonuses: { xpBoost: 0.15, goldBoost: 0.10, rareSpawn: 0 }, ... },
     { name: 'Platinum', levelRange: [61, 80], bonuses: { xpBoost: 0.20, goldBoost: 0.15, rareSpawn: 0.05 }, ... },
     { name: 'Dragon God', levelRange: [81, 100], bonuses: { xpBoost: 0.30, goldBoost: 0.25, rareSpawn: 0.10 }, ... }
   ];
   ```

3. **Profile Screen UI**
   - New component: `components/ProfileScreen.tsx`
   - Shows: Account level, tier, progress bar, bonuses
   - Statistics: Total games, total merges, highest tile
   - Cosmetic unlocks gallery
   - Daily streak tracker

4. **Milestone Rewards**
   - Level 5: Unlock Crafting (future feature)
   - Level 10: +1 Daily Challenge slot
   - Level 20: +1 Reroll per game (permanent)
   - Level 40: Unlock Cosmetic Shop
   - Level 50: Legendary Pet (passive XP boost)

**localStorage Structure:**
```typescript
interface AccountData {
  accountXP: number;
  accountLevel: number;
  totalGamesPlayed: number;
  totalMerges: number;
  highestTile: number;
  loginStreak: number;
  lastLoginDate: string;
  unlockedCosmetics: string[];
  achievements: { [id: string]: boolean };
}
```

#### Week 9: Prestige System
**Priority:** MEDIUM ⭐⭐  
**Time Estimate:** 6-8 hours

**Deliverables:**
1. **Prestige Mechanics**
   - Unlock at Account Level 25
   - Requires reaching 2048 tile once
   - Grants "Prestige Star" (displayed on profile)
   - Each prestige: +5% permanent XP/Gold boost (stacks)
   - Resets game level to 1, keeps account level

2. **Prestige Tiers**
   - Prestige 1: Bronze Star
   - Prestige 3: Silver Star
   - Prestige 5: Gold Star
   - Prestige 10: Platinum Star
   - Prestige 25: Diamond Star (max, ultimate reward)

3. **Prestige UI**
   - Confirmation modal with benefits breakdown
   - Visual: Player "ascends" animation (2000ms)
   - Exclusive prestige cosmetics unlock

---

### **PHASE 4: Audio & Atmosphere** (Week 10-11)
**Goal:** Professional sound design

#### Week 10: Dynamic Audio System
**Priority:** MEDIUM ⭐⭐  
**Time Estimate:** 8-10 hours  
**Risk:** Medium (Web Audio API complexity)

**Deliverables:**
1. **Audio Service** (`services/audioService.ts` enhancement)
   - Web Audio API integration
   - Volume controls (master, SFX, music)
   - Audio pooling for performance
   - Mute/unmute state persistence

2. **Sound Effects Library**
   - Merge sounds: 5 variations, pitch increases with tier
   - Combo stinger: Rising pitch per combo count
   - Boss roar: Entrance/defeat sounds
   - Gold clink: Staggered coin sounds
   - XP chime: Soft bell on XP gain
   - Button clicks: Subtle UI feedback
   - Item use: Magical whoosh
   - Level up: Triumphant fanfare (800ms)

3. **Dynamic Music Layers**
   - Base ambient loop (always playing)
   - Combo layer activates at 3+ combo
   - Boss battle layer (heavy percussion)
   - Victory stinger (2048 achievement)
   - Crossfade transitions (200ms)

**Implementation Example:**
```typescript
class AudioLayerManager {
  private layers: Map<string, HTMLAudioElement> = new Map();
  
  setLayerVolume(layer: string, volume: number) {
    const audio = this.layers.get(layer);
    if (audio) {
      audio.volume = volume;
    }
  }
  
  transitionTo(layer: string, duration: number = 200) {
    // Crossfade logic
  }
}
```

#### Week 11: Stage-Specific Audio
**Priority:** LOW ⭐  
**Time Estimate:** 4-5 hours

**Deliverables:**
1. **Stage Ambience**
   - The Crypt: Dripping water, chains, wind
   - Fungal Caverns: Pulsing bio-hum, spore releases
   - Magma Core: Bubbling lava, rock crumbling
   - The Void: Cosmic wind, whispers
   - Frozen Keep: Howling wind, ice cracks
   - Dragon's Throne: Fire roar, heavy breathing

2. **Transition Sounds**
   - Stage entry whoosh
   - Fade-in/out between areas
   - Level milestone chimes

---

### **PHASE 5: Stage Transitions & Biomes** (Week 12-14)
**Goal:** Cinematic stage changes

#### Week 12-13: Stage Transition Animations
**Priority:** HIGH ⭐⭐⭐  
**Time Estimate:** 10-12 hours

**Deliverables:**
1. **Transition System** (`components/StageTransition.tsx`)
   - Full-screen overlay component
   - 1500-2500ms animations
   - Unique per stage pairing
   - Blocks input during transition

2. **Stage Transition Sequences**

**Crypt → Fungal Caverns** (1500ms):
```
Phase 1 (500ms): Fade to black
Phase 2 (600ms): Purple bioluminescent glow fades in
Phase 3 (400ms): Mushroom silhouettes grow from bottom
```

**Fungal → Magma Core** (1800ms):
```
Phase 1 (600ms): Screen heats (red vignette intensifies)
Phase 2 (500ms): Cracks form on edges, lava seeps through
Phase 3 (700ms): Explosion transition, new background revealed
```

**Magma → Frozen Keep** (1500ms):
```
Phase 1 (500ms): Screen exhales frost, crystallization from edges
Phase 2 (600ms): Camera "drops" downward
Phase 3 (400ms): Ice pillars rise, blue sigils light up
```

**Frozen → Blood Cathedral** (1800ms):
```
Phase 1 (600ms): Red pulse syncs with heartbeat
Phase 2 (500ms): Stained-glass fractal flash
Phase 3 (700ms): Blood-red wave sweeps, candles ignite
```

**Cathedral → Storm Peaks** (2000ms):
```
Phase 1 (700ms): Wind streaks, debris flies past
Phase 2 (600ms): Lightning cracks, Wyvern Lord silhouette
Phase 3 (700ms): Grid arcs with static electricity
```

**Storm → Necrotic Wasteland** (1900ms):
```
Phase 1 (600ms): Screen desaturates, colors drain
Phase 2 (700ms): Ghostly hands reach from bottom
Phase 3 (600ms): Spores float, necrotic green aura
```

**Wasteland → Dragon's Throne** (2500ms):
```
Phase 1 (800ms): Fire/darkness strobe rhythm
Phase 2 (900ms): Lava rivers animate, dragon statues ignite
Phase 3 (800ms): Obsidian throne emerges, molten vignette
```

3. **Stage Background Assets**
   - 7 unique background images/gradients
   - Parallax layers (3 layers per stage)
   - CSS filters for atmosphere
   - Reactive elements (torches, fog)

#### Week 14: Environmental Effects
**Priority:** MEDIUM ⭐⭐  
**Time Estimate:** 6-8 hours

**Deliverables:**
1. **Parallax Background System**
   - Multi-layer backgrounds move at different speeds
   - Player input triggers slight parallax shift
   - Layer 1 (far): 10% speed
   - Layer 2 (mid): 30% speed
   - Layer 3 (near): 50% speed

2. **Fog/Particle Overlays**
   - Canvas-based ambient particles
   - Embers rising (Magma Core)
   - Snowflakes falling (Frozen Keep)
   - Spores floating (Fungal Caverns)
   - Souls drifting (Necrotic Wasteland)

3. **Reactive Torches**
   - Background torches respond to combos
   - Bright flare on high combo
   - Flicker violently during boss battles
   - Triumphant surge when boss defeated

---

## 🎨 VISUAL POLISH BACKLOG (Ongoing)

### High Priority
- [ ] **Tile Physics Micro-Jitter** (2 hours)
  - Tiles wobble slightly on spawn
  - Adds "weight" sensation
  - Simple CSS animation

- [ ] **Merge Squish Effect** (1 hour)
  - Tiles compress 10% before merging
  - 100ms squish → merge
  - Enhances impact feel

- [ ] **Shine Pass on High Tiers** (2 hours)
  - Every 10s, glint travels across 128+ tiles
  - Teases "you're close"
  - CSS gradient animation

### Medium Priority
- [ ] **Tile Magnetism** (3 hours)
  - Matching tiles "pull" slightly when near
  - Subconscious merge encouragement
  - 100ms pull animation

- [ ] **Combo Active Aura** (2 hours)
  - Grid edges glow during combo
  - Pulsing flame effect
  - Looping animation

- [ ] **Near-Miss Mechanics** (4 hours)
  - "Almost 2048!" at 1024 tile
  - Screen pulses, encouraging text
  - Psychological retention hook

### Low Priority
- [ ] **Boss Health Bar Polish** (2 hours)
  - Segmented health bar
  - Damage shake animation
  - Color changes at low HP

- [ ] **Item Hover 3D Tilt** (3 hours)
  - Inventory items tilt on mouse move
  - CSS transform perspective
  - Premium feel

- [ ] **Victory Screen Overhaul** (6 hours)
  - Full-screen celebration
  - Stat summary with animations
  - Share/retry buttons

---

## 🔧 TECHNICAL DEBT & OPTIMIZATION

### Code Quality (Ongoing)
- [ ] **Component Splitting** (4 hours)
  - App.tsx is large, split into smaller modules
  - Extract game reducer to separate file
  - Improve code readability

- [ ] **Type Safety Audit** (2 hours)
  - Ensure all `any` types removed
  - Strict null checks enabled
  - Proper interface documentation

- [ ] **Performance Profiling** (3 hours)
  - React DevTools profiling
  - Identify re-render bottlenecks
  - Memoization where needed

### Build & Deployment
- [ ] **Bundle Size Optimization** (3 hours)
  - Code splitting for heavy features
  - Lazy load non-critical components
  - Target: <500KB gzipped

- [ ] **PWA Setup** (4 hours)
  - Service worker for offline play
  - Add to home screen support
  - Manifest.json configuration

- [ ] **Analytics Integration** (2 hours)
  - Track user behavior (privacy-friendly)
  - Heatmaps for UI optimization
  - Retention metrics

---

## 📈 METRICS & SUCCESS CRITERIA

### Player Engagement Targets
- **Session Length:** 15+ minutes average
- **Retention:** 40% day-1, 20% day-7, 10% day-30
- **Cascade Frequency:** 3-5 cascades per game average
- **Pattern Detection:** 1-2 patterns per game
- **Account Level Progression:** Players reach Level 10 within 5 games

### Technical Performance
- **Load Time:** <2 seconds on 3G
- **Frame Rate:** Stable 60fps with 100+ particles
- **Memory Usage:** <100MB RAM
- **Bundle Size:** <500KB gzipped
- **Zero Critical Bugs:** No game-breaking issues

### Visual Quality
- **Animation Smoothness:** No jank on 60Hz displays
- **Particle Density:** 100+ simultaneous particles without lag
- **Transition Fluidity:** Stage transitions feel cinematic
- **Audio Sync:** Sound effects match visual timing precisely

---

## 🚧 RISK ASSESSMENT

### High Risk Items
1. **Particle System Performance** (PHASE 2.1)
   - **Risk:** 100+ particles may cause lag on low-end devices
   - **Mitigation:** Implement particle pooling, quality settings toggle
   - **Fallback:** Reduce particle count on performance detection

2. **Pattern Detection Complexity** (PHASE 2.3)
   - **Risk:** Complex logic may introduce bugs or balance issues
   - **Mitigation:** Comprehensive unit tests, gradual rollout
   - **Fallback:** Disable pattern detection if issues arise

3. **localStorage Data Loss** (PHASE 3)
   - **Risk:** Players lose account progress
   - **Mitigation:** Frequent auto-save, export/import feature
   - **Fallback:** Cloud save integration (future)

### Medium Risk Items
1. **Web Audio API Browser Support**
   - **Risk:** Safari/iOS limitations
   - **Mitigation:** Polyfills, fallback to HTML5 Audio
   - **Testing:** Cross-browser audio testing

2. **Stage Transition Performance**
   - **Risk:** Complex animations may stutter
   - **Mitigation:** GPU acceleration, preloading assets
   - **Optimization:** Reduce animation complexity if needed

---

## 🔄 ITERATIVE TESTING SCHEDULE

### Weekly Testing Cycles
**Every Friday:**
- Deploy latest build to staging
- Playtesting session (30-60 min)
- Collect feedback on new features
- Log bugs/polish items in backlog

### Monthly Milestones
**End of Month 1 (Week 4):**
- Particle systems complete
- Visual feedback enhanced
- Performance validated

**End of Month 2 (Week 8):**
- Cascade Phase 2 complete
- Account progression launched
- Retention metrics tracking

**End of Month 3 (Week 12):**
- Audio system polished
- Stage transitions live
- Pre-launch readiness check

---

## 📚 DOCUMENTATION UPDATES NEEDED

### Code Documentation
- [ ] Add JSDoc comments to all gameLogic functions
- [ ] Component prop documentation
- [ ] README.md with setup instructions
- [ ] CONTRIBUTING.md for future contributors

### Player-Facing Docs
- [ ] In-game tutorial improvements
- [ ] Help screen with mechanics explanations
- [ ] Changelog for version updates
- [ ] FAQ for common questions

### Internal Planning
- [ ] Weekly progress tracking document
- [ ] Feature request voting system
- [ ] Bug triage guidelines

---

## 🎁 FUTURE EXPANSION IDEAS (Beyond 3 Months)

### Community Features
- **Global Leaderboard** (cloud integration needed)
- **Friend Codes** (share progress, compete)
- **Weekly Tournaments** (special rule sets)
- **Player Profiles** (public stats, cosmetics showcase)

### Advanced Gameplay
- **Roguelite Runs** (random modifiers, permadeath mode)
- **Crafting System** (combine items for new effects)
- **Pet System** (passive bonuses, collectible creatures)
- **Gacha Summoning** (optional, ethical design)

### Monetization (Ethical)
- **Cosmetic Shop** (skins, themes, no pay-to-win)
- **Season Pass** (optional premium track)
- **Support the Dev** (donation/tip jar)
- **Ad-Free Option** (one-time purchase)

### Technical Enhancements
- **Mobile App** (React Native port)
- **Cloud Save** (Firebase/Supabase integration)
- **Mod Support** (custom stages, rules)
- **Speedrun Mode** (timer, leaderboards)

---

## ✅ IMMEDIATE NEXT STEPS (This Week)

### Priority 1: Complete Cascade Testing
- [ ] Restart dev server
- [ ] Play 5-10 full games
- [ ] Verify cascade frequency feels good
- [ ] Check cascade ring visibility
- [ ] Test edge cases (no pairs, boss tiles, max cascades)
- [ ] Document any balance tweaks needed

### Priority 2: Start Particle Foundation
- [ ] Create `components/Particle.tsx` base component
- [ ] Implement particle pool system
- [ ] Add XP soul particles (first feature)
- [ ] Test performance with 50+ particles
- [ ] Iterate on timing/feel

### Priority 3: Planning & Documentation
- ✅ This document created
- [ ] Update CURRENT_STATUS.md with this week's goals
- [ ] Create GitHub issues for PHASE 2.1 tasks
- [ ] Set up weekly milestone tracking

---

## 🎯 DEFINITION OF DONE

**For Each Feature:**
- [ ] Code implemented and tested
- [ ] Zero TypeScript errors
- [ ] Performance validated (60fps maintained)
- [ ] Visual polish complete (no placeholder states)
- [ ] Documentation updated (code comments, README)
- [ ] Playtested for feel (not just functionality)
- [ ] Integrated with existing systems (no regressions)
- [ ] User feedback incorporated (if applicable)

**For Each Phase:**
- [ ] All deliverables complete
- [ ] Success metrics validated
- [ ] No critical bugs
- [ ] Documentation comprehensive
- [ ] Playtest approval received
- [ ] Ready for next phase

---

## 📞 DECISION LOG

### Key Design Decisions
**December 8, 2025:**
- **Cascade System:** Decided on sequential execution over simultaneous (clarity, no chaos)
- **Multiplier Scaling:** +10% per cascade (modest, not exponential)
- **Max Cascades:** 8 default, 12 at Level 18+ (prevents infinite loops)
- **Visual Feedback:** CascadeRing component in top-right (non-intrusive)

**Next Decisions Needed:**
- Particle rendering strategy (DOM vs Canvas vs hybrid)
- Audio file format and hosting approach
- Account data storage strategy (localStorage limits)
- Stage transition trigger points (level thresholds)

---

## 🎬 CONCLUSION

Dragon's Hoard is positioned for a massive quality leap over the next 3 months. By focusing on visual polish, progressive disclosure of depth, and long-term retention mechanics, we're building a game that players will want to return to daily.

**Core Philosophy:**
> "Every interaction should feel satisfying. Every milestone should feel earned. Every session should leave players wanting more."

**Next Review:** December 15, 2025 (End of Week 1 - Particle Foundation)

---

**Document Version:** 1.0  
**Last Updated:** December 8, 2025  
**Owner:** Development Team  
**Status:** ACTIVE PLANNING DOCUMENT
