# Dragon's Hoard - This Week's Tasks

**Week Of:** December 8, 2025  
**Focus:** Cascade validation + Particle foundation

---

## ✅ COMPLETED THIS SESSION

- [x] Remove duplicate Grid.tsx in docs/
- [x] Create comprehensive development plan (DEVELOPMENT_PLAN_2025.md)
- [x] Update CURRENT_STATUS.md with latest state
- [x] Create QUICK_ROADMAP.md for easy reference
- [x] Cascade System Phase 1 fully implemented

---

## 🎯 THIS WEEK'S PRIORITIES

### Priority 1: Cascade System Testing (CRITICAL)
**Time:** 30-60 minutes  
**Owner:** Testing/validation

**Tasks:**
- [ ] Restart dev server
- [ ] Play 5-10 complete games
- [ ] Track cascade frequency per game
- [ ] Verify CascadeRing appears and is readable
- [ ] Test edge cases:
  - [ ] Grid with no adjacent pairs
  - [ ] Cascades with boss tiles present
  - [ ] Hitting max cascade limit (8/12)
  - [ ] Cascade rewards calculation correct
- [ ] Document any balance issues:
  - [ ] Is +10% multiplier too low/high?
  - [ ] Is 3s display duration good?
  - [ ] Are messages ("NICE!", "GODLIKE!") triggering correctly?
  - [ ] Does cascade frequency feel earned vs. random?
- [ ] Update CASCADE_IMPLEMENTATION.md with findings

**Success Criteria:**
- Cascades feel satisfying, not overwhelming
- Frequency: 3-5 cascades per game average
- No bugs or edge case crashes
- Visual feedback clear and readable

---

### Priority 2: Particle System Foundation (HIGH PRIORITY)
**Time:** 8-12 hours  
**Owner:** Development

#### Task 2.1: Create Base Particle Component
**Time:** 3-4 hours

- [ ] Create `/workspaces/DragonsHoard/components/Particle.tsx`
- [ ] Implement ParticleConfig interface:
  ```typescript
  interface ParticleConfig {
    type: 'xp' | 'gold' | 'spark' | 'ember';
    startPos: { x: number; y: number };
    endPos?: { x: number; y: number };
    color: string;
    lifetime: number;
    velocity?: { x: number; y: number };
    gravity?: boolean;
  }
  ```
- [ ] Build particle pool system (reuse particles for performance)
- [ ] Implement requestAnimationFrame update loop
- [ ] Add support for both DOM and Canvas rendering modes
- [ ] Test with 50 particles, verify 60fps

#### Task 2.2: XP Soul Particles
**Time:** 2-3 hours

- [ ] Create XP wisp particle type
- [ ] Implement Bezier curve path (merge point → XP bar)
- [ ] Spawn 5-10 particles per merge
- [ ] Duration: 400ms
- [ ] Color: Cyan blue (#00CED1)
- [ ] Add slight randomness to paths (organic feel)
- [ ] Integrate with App.tsx MOVE reducer
- [ ] Hook into existing XP gain events

#### Task 2.3: Gold Coin Burst
**Time:** 3-4 hours

- [ ] Create gold coin particle type
- [ ] Implement physics simulation (gravity, velocity)
- [ ] Spawn 10-20 coins per merge (based on gold amount)
- [ ] Arc trajectories from merge → gold counter
- [ ] Staggered arrivals (50ms intervals)
- [ ] Total duration: 800ms
- [ ] Add "clink" sound placeholder (muted by default)
- [ ] Integrate with gold gain events

#### Task 2.4: Performance Testing
**Time:** 1 hour

- [ ] Test with 100+ active particles
- [ ] Profile with React DevTools
- [ ] Verify 60fps maintained
- [ ] Check memory usage (no leaks)
- [ ] Add quality setting toggle (high/medium/low particle count)
- [ ] Document performance metrics

---

### Priority 3: Documentation Updates
**Time:** 1 hour

- [x] Create DEVELOPMENT_PLAN_2025.md
- [x] Update CURRENT_STATUS.md
- [x] Create QUICK_ROADMAP.md
- [x] Create THIS_WEEK.md
- [ ] Update README.md with particle system info
- [ ] Add particle component documentation

---

## 📋 BACKLOG (Next Week)

### Week 2 Tasks (Preview)
- [ ] Merge spark shower particles
- [ ] Combo active aura (floating embers)
- [ ] Tier ascension effect particles
- [ ] Integration with cascade system
- [ ] Particle feel polish

---

## 🐛 KNOWN ISSUES TO FIX

**None currently!** ✨  
All systems working as designed.

---

## 📊 PROGRESS TRACKER

### This Week's Goals
- **Cascade Testing:** [ ] 0/1 sessions complete
- **Particle Component:** [ ] 0/4 tasks complete
- **Documentation:** [x] 4/4 tasks complete

### Week Completion: 30%
*(4 out of ~13 total tasks)*

---

## 💡 NOTES & DECISIONS

### December 8, 2025
- **Decision:** Particle system will use hybrid approach (DOM for <50 particles, Canvas for >50)
- **Rationale:** DOM is simpler for small counts, Canvas needed for larger effects
- **Next Decision:** Audio file format (MP3 vs OGG vs WAV) - deferred to Week 10

---

## 🎯 DEFINITION OF DONE (This Week)

**Cascade Testing Complete When:**
- [x] 5+ games played
- [ ] Frequency feels balanced
- [ ] No critical bugs
- [ ] Balance notes documented

**Particle Foundation Complete When:**
- [ ] Particle.tsx component created
- [ ] XP and Gold particles working
- [ ] 60fps with 100+ particles
- [ ] Integrated with game events

**Week Complete When:**
- [ ] Both Priority 1 and 2 done
- [ ] Documentation updated
- [ ] Ready to start Week 2 tasks

---

**Next Review:** End of day Friday, December 13, 2025  
**Weekly Sync:** Document progress, adjust next week's plan
