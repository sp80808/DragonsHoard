# Quick Feature Reference Guide

**A quick lookup for feature priorities, effort estimates, and dependencies**

---

## At a Glance

| # | Feature | Priority | Effort | Impact | Phase | Status |
|---|---------|----------|--------|--------|-------|--------|
| 1 | Crafting System | ⭐⭐⭐⭐⭐ | 2-3d | High | P1 | 📋 Planned |
| 2 | Daily Challenges | ⭐⭐⭐⭐⭐ | 3-4d | High | P2 | 📋 Planned |
| 3 | Combo System | ⭐⭐⭐⭐ | 2-3d | High | P2 | 📋 Planned |
| 4 | Wave/Challenge Modes | ⭐⭐⭐⭐ | 4-5d | High | P3 | 📋 Planned |
| 5 | Deck/Class System | ⭐⭐⭐ | 3-4d | Medium | P3 | 📋 Planned |
| 6 | Enhanced Animations | ⭐⭐⭐⭐ | 3-4d | Medium | P3 | 📋 Planned |
| 7 | Tutorial & Onboarding | ⭐⭐⭐⭐⭐ | 3-4d | High | P1 | 📋 Planned |
| 8 | Statistics Dashboard | ⭐⭐⭐⭐ | 2-3d | Medium | P2 | 📋 Planned |
| 9 | Mobile Optimization | ⭐⭐⭐⭐⭐ | 2-3d | High | P1 | 📋 Planned |
| 10 | Save Slots / Multi-Profile | ⭐⭐⭐ | 2-3d | Medium | P2 | 📋 Planned |
| 11 | Undo/Rewind System | ⭐⭐⭐⭐ | 2-3d | Medium | P3 | 📋 Planned |
| 12 | Multiplayer / PvP | ⭐⭐ | 10-15d | Very High | P4 | 🔮 Long-term |
| 13 | Story Campaign | ⭐⭐⭐⭐ | 5-7d | High | P4 | 🔮 Long-term |
| 14 | Cosmetics & Skins | ⭐⭐⭐ | 4-6d | Medium | P4 | 🔮 Long-term |
| 15 | Prestige System | ⭐⭐⭐⭐ | 3-4d | High | P4 | 🔮 Long-term |
| 16 | Procedural Content | ⭐⭐⭐ | 4-5d | Medium | P3 | 🔮 Long-term |
| 17 | Expansion Packs | ⭐⭐⭐ | 7-10d | Medium | P5 | 🔮 Long-term |
| 18 | User-Generated Content | ⭐⭐ | 5-7d | Medium | P5 | 🔮 Long-term |
| 19 | Guilds / Clans | ⭐⭐ | 8-10d | Medium | P5 | 🔮 Long-term |
| 20 | Live Events | ⭐⭐⭐⭐ | 3-5d/event | Medium | P5 | 📋 Planned |

---

## Priority Tiers Explained

### 🎯 Tier 1: Next 2 Weeks
**Start immediately for launch polish**

1. **Mobile Optimization** (2-3d)
   - Enables iOS/Android play
   - Required for broad audience
   - Quick wins on existing UI

2. **Tutorial & Onboarding** (3-4d)
   - Teaches new players mechanics
   - Reduces early churn
   - Content-heavy but isolated

3. **Crafting System** (2-3d)
   - Adds economy depth
   - Independent implementation
   - No gameplay formula changes

**Estimated Total**: 7-10 days (1-2 weeks)

---

### 🎯 Tier 2: Next 4 Weeks
**Add engagement loops**

1. **Daily Challenges** (3-4d)
   - Creates daily habit loop
   - Drives return players
   - Requires time-based triggers

2. **Combo System** (2-3d)
   - Increases gameplay depth
   - Requires gameplay testing
   - Quick to balance with data

3. **Statistics Dashboard** (2-3d)
   - Shows player performance
   - Drives engagement
   - Requires data aggregation

4. **Save Slots** (2-3d)
   - Multiple game saves
   - Quality of life feature
   - Data structure changes

**Estimated Total**: 9-13 days (1.5-2 weeks)

---

### 🎯 Tier 3: Weeks 5-7
**Add replayability**

1. **Enhanced Animations** (3-4d)
   - Smooth merge/level animations
   - Particle effects
   - Improves feel

2. **Wave/Challenge Modes** (4-5d)
   - Time Attack / Wave / Boss Rush
   - Competitive leaderboards
   - More complex game mode

3. **Undo/Rewind System** (2-3d)
   - Complements gameplay
   - Limits per session
   - Easy implementation

4. **Procedural Content** (4-5d)
   - Run modifiers
   - Random events
   - Infinite replayability

**Estimated Total**: 13-17 days (2-2.5 weeks)

---

### 🔮 Tier 4: Long-term
**Advanced features (8+ weeks out)**

- Story Campaign (5-7d)
- Prestige System (3-4d)
- Cosmetics & Skins (4-6d)
- Multiplayer (10-15d)
- Guilds System (8-10d)

---

## Decision Tree: What to Build Next?

```
START
  │
  ├─ Feedback from players suggests...?
  │  ├─ "Game is too hard" → Undo System
  │  ├─ "Gets boring after level 10" → Daily Challenges + Combo System
  │  ├─ "Can't play on phone" → Mobile Optimization
  │  ├─ "No tutorial confused me" → Tutorial & Onboarding
  │  ├─ "Need more content" → Challenge Modes + Prestige
  │  └─ "Want to compete" → Multiplayer
  │
  ├─ What's your team size?
  │  ├─ 1 person → Focus on Tier 1 (2-3d features)
  │  ├─ 2-3 people → Combine Tier 1 + 2 features
  │  ├─ 4-5 people → Can parallelize Tier 3 features
  │  └─ 6+ people → Can tackle Tier 4 features
  │
  └─ How much time do you have?
     ├─ < 1 week → Mobile Optimization + Tutorial
     ├─ 1-2 weeks → Add Crafting + Statistics
     ├─ 2-4 weeks → Add Daily Challenges + Combo
     ├─ 4-8 weeks → Add Challenge Modes + Prestige
     └─ 8+ weeks → Expand to Story + Multiplayer
```

---

## Dependencies Map

```
No Dependencies (Can start anytime)
├─ Mobile Optimization
├─ Tutorial & Onboarding
├─ Crafting System
├─ Statistics Dashboard
├─ Save Slots
├─ Cosmetics & Skins
└─ Procedural Content

Depends on Previous Features
├─ Daily Challenges → (Requires robust save system)
├─ Combo System → (Requires merge tweaking, playtesting)
├─ Enhanced Animations → (Pure visual, no deps)
├─ Wave/Challenge Modes → (Requires game balance)
├─ Undo System → (Requires save/load refactor)
├─ Prestige System → (Requires progression math)
├─ Story Campaign → (Requires level structure)
└─ Multiplayer → (Requires backend infrastructure)

Blocks Other Features
├─ Tutorial → Onboarding flows
├─ Mobile Optimization → Mobile features
├─ Crafting System → Item recipes
├─ Save Slots → Multi-profile features
└─ Backend Infrastructure → Multiplayer, Guilds, Live Events
```

---

## Effort Categories

### 🟢 Quick Wins (1-3 days)
- Mobile Optimization
- Statistics Dashboard
- Save Slots
- Undo/Rewind System
- Cosmetics & Skins (basic)

→ **Do when you have gaps or need morale boost**

### 🟡 Medium Features (3-5 days)
- Tutorial & Onboarding
- Crafting System
- Daily Challenges
- Combo System
- Enhanced Animations
- Prestige System

→ **Core iteration cycle, sustainable pace**

### 🔴 Large Projects (5+ days)
- Wave/Challenge Modes
- Story Campaign
- Procedural Content
- User-Generated Content
- Multiplayer
- Guilds System

→ **Requires planning, team coordination, testing**

---

## Questions to Ask When Prioritizing

1. **Impact**: Will this feature excite players or solve a problem?
2. **Effort**: Can it be done in the time available?
3. **Risk**: Does it depend on other systems? Is it high risk?
4. **Scalability**: Does it enable other features?
5. **Audience**: Who benefits? Core players or new players?

---

## Recommended Starting Point

**If you're starting development TODAY, do in this order:**

```
Week 1: Foundation
├─ Mobile Optimization (2-3d)
└─ Tutorial & Onboarding (3-4d)

Week 2: Economy
├─ Crafting System (2-3d)
├─ Statistics Dashboard (2-3d)
└─ Testing & Balance (1-2d)

Week 3-4: Engagement
├─ Daily Challenges (3-4d)
├─ Combo System (2-3d)
├─ Save Slots (2-3d)
└─ Testing & Feedback Loop

Week 5+: Replayability
├─ Enhanced Animations (3-4d)
├─ Wave/Challenge Modes (4-5d)
├─ Undo System (2-3d)
└─ Continued polish & balance
```

**Expected Outcome**: Polished 1.2 release with solid engagement mechanics by Week 5

---

**See full details in [FEATURE_PLAN.md](FEATURE_PLAN.md) and [ROADMAP.md](ROADMAP.md)**
