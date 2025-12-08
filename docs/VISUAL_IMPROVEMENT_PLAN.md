# Dragon's Hoard - Visual Improvement Plan

**Date:** December 8, 2025  
**Status:** Ready for Implementation  
**Previous Work:** Phase 1 Core Juice Complete (see DOPAMINE_IMPLEMENTATION.md)

---

## ✅ COMPLETED (Phase 1 - Core Juice)

### Animation Infrastructure
- ✅ **18 CSS animation keyframes** in `index.html`
- ✅ **Micro-animations** (<150ms): tap pulse, coin blink, XP tick, button press
- ✅ **Medium animations** (300-600ms): implosion burst, soul absorb, tier flash
- ✅ **Big animations** (800-2000ms): level up burst, screen flash, combo popup
- ✅ **Ambient effects**: glow pulse, shimmer, combo aura

### Component Enhancements
- ✅ `TileComponent.tsx`: Tap interactions, tier-based animations, merge effects
- ✅ `HUD.tsx`: Gold blink, XP tick, level up pulse with state tracking
- ✅ `ComboCounter.tsx`: Popup animations, screen flash, dynamic intensity
- ✅ `Settings.tsx`: Button press states, tactile feedback
- ✅ **All buttons**: Consistent micro-animations across UI

### Technical Foundation
- ✅ React hooks for change detection (useState/useEffect)
- ✅ GPU-accelerated CSS animations
- ✅ Non-destructive implementation
- ✅ Zero TypeScript errors
- ✅ ~275 lines of animation code added

---

## 🎯 NEXT PRIORITIES - Visual Improvements

### Priority 1: Particle Systems ⭐⭐⭐
**Goal:** Make resource gains and tile merges visually explode with satisfaction

#### A. XP Soul Particles
- **Complexity:** Medium (3/5)
- **Impact:** ⭐⭐⭐ Very High
- **Time:** 30-45 minutes

**Implementation Strategy:**
```tsx
// DOM-based particles - lightweight approach
interface XPParticle {
  id: string;
  startX: number;
  startY: number;
  createdAt: number;
}

// In App.tsx
const [xpParticles, setXpParticles] = useState<XPParticle[]>([]);

// Trigger on XP gain
const createXPParticles = (x: number, y: number) => {
  const particles = Array.from({ length: 5 }, (_, i) => ({
    id: `xp-${Date.now()}-${i}`,
    startX: x,
    startY: y,
    createdAt: Date.now()
  }));
  setXpParticles(prev => [...prev, ...particles]);
};

// Render particles
{xpParticles.map(particle => (
  <div
    key={particle.id}
    className="xp-particle soul-absorb"
    style={{
      left: particle.startX,
      top: particle.startY,
      '--end-x': xpBarPosition.x,
      '--end-y': xpBarPosition.y
    }}
  />
))}
```

**Visual Specs:**
- Particles: 5-10 blue wisps per merge
- Path: Bezier curve to XP bar
- Duration: 450ms
- Color: Cyan (#06b6d4) → Blue (#3b82f6)
- Size: 4-8px random circles
- Animation: `soulAbsorb` (already defined in CSS)

**Files to Create/Modify:**
1. `components/Particle.tsx` (new)
2. `App.tsx` (add particle state + rendering)
3. `index.html` (add `.xp-particle` styles)

#### B. Gold Coin Burst
- **Complexity:** Medium-High (4/5)
- **Impact:** ⭐⭐⭐ Very High
- **Time:** 45-60 minutes

**Implementation Strategy:**
```tsx
// Physics-based approach
interface GoldParticle {
  id: string;
  x: number;
  y: number;
  vx: number;  // velocity x
  vy: number;  // velocity y
  rotation: number;
  createdAt: number;
}

// Simple physics update
const updateGoldParticles = () => {
  setGoldParticles(prev => prev.map(p => {
    const elapsed = (Date.now() - p.createdAt) / 1000;
    const gravity = 800;
    return {
      ...p,
      x: p.x + p.vx * elapsed,
      y: p.y + p.vy * elapsed + 0.5 * gravity * elapsed * elapsed,
      rotation: p.rotation + elapsed * 360
    };
  }));
};
```

**Visual Specs:**
- Particles: 10-20 gold coins per drop
- Ejection: Radial burst (angles 45-135°)
- Velocity: Random 100-200px/s
- Gravity: 800px/s²
- Duration: 800ms with stagger
- Icon: 💰 or CSS circle with gradient
- Animation: `coinBurst` (already defined)

#### C. Merge Spark Shower
- **Complexity:** Low (2/5)
- **Impact:** ⭐⭐ Medium
- **Time:** 15-20 minutes

**Implementation:**
```tsx
// Quick radial sparks
const createSparks = (x: number, y: number, count: number) => {
  Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count;
    return {
      id: `spark-${Date.now()}-${i}`,
      x: x + Math.cos(angle) * 20,
      y: y + Math.sin(angle) * 20,
      angle
    };
  });
};
```

**Visual Specs:**
- 5-8 sparks per merge
- Radial explosion
- Duration: 200ms
- Color: Orange/yellow
- Scales with combo count

---

### Priority 2: Enhanced Floating Text ⭐⭐
**Goal:** Make all gains explicitly visible and satisfying

#### A. Damage/XP Number Enhancements
- **Complexity:** Low (2/5)
- **Impact:** ⭐⭐ Medium-High
- **Time:** 20-30 minutes

**Current State:** Basic floating text exists in `App.tsx`

**Enhancements:**
```tsx
interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  type: 'damage' | 'xp' | 'gold' | 'critical';
  value: number;
}

// Styling by type
const getFloatingTextClass = (type: string, value: number) => {
  switch(type) {
    case 'critical':
      return 'text-red-500 text-4xl font-black critical-flash shake';
    case 'xp':
      return 'text-cyan-400 text-2xl font-bold shimmer-highlight';
    case 'gold':
      return 'text-yellow-400 text-2xl font-bold coin-blink';
    case 'damage':
      return value >= 10 ? 'text-orange-500 text-3xl' : 'text-white text-2xl';
  }
};
```

**Features:**
- Critical hits: RED + shake + larger
- XP gains: Cyan with shimmer
- Gold: Yellow with coin icon
- Boss damage: Orange color
- Text outline for readability

**Files to Modify:**
- `App.tsx` (enhance FloatingText rendering)
- `index.html` (add text-outline styles)

#### B. Gold Pop Numbers
- **Complexity:** Low (2/5)
- **Impact:** ⭐⭐ Medium
- **Time:** 15 minutes

**Implementation:**
```tsx
// Show +X gold on drops
const createGoldText = (amount: number, x: number, y: number) => {
  addFloatingText({
    text: `+${amount}💰`,
    x, y,
    type: 'gold',
    value: amount
  });
};
```

#### C. Level Up Banner
- **Complexity:** Low (2/5)
- **Impact:** ⭐⭐⭐ High
- **Time:** 20-30 minutes

**Implementation:**
```tsx
// New component: LevelUpBanner.tsx
export const LevelUpBanner = ({ level, isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 
                    bg-gradient-to-r from-cyan-600 to-blue-600 
                    text-white text-center py-8 
                    level-up-banner animate-slide-down">
      <div className="text-6xl font-black tracking-wider">
        LEVEL {level}
      </div>
      <div className="text-lg opacity-80 mt-2">
        New abilities unlocked!
      </div>
    </div>
  );
};
```

---

### Priority 3: Grid Visual Feedback ⭐⭐
**Goal:** Make the game board feel alive and reactive

#### A. Combo Border Glow
- **Complexity:** Low (1/5)
- **Impact:** ⭐⭐ Medium
- **Time:** 10-15 minutes

**Implementation:**
```tsx
// In Grid.tsx
<div className={`
  relative w-full
  ${isComboActive ? 'combo-border-glow' : ''}
  ${comboCount >= 10 ? 'border-red-500' : 
    comboCount >= 5 ? 'border-orange-500' : 'border-cyan-500'}
`}>
```

**Visual Specs:**
- Pulsing border when combo active
- Color shifts: cyan → orange → red
- Uses existing `comboGlow` animation
- Intensity scales with combo

#### B. Stage Background Transitions
- **Complexity:** Medium (3/5)
- **Impact:** ⭐⭐ Medium
- **Time:** 30 minutes

**Implementation:**
```tsx
// Animated background swap
const [prevStage, setPrevStage] = useState(stage);

useEffect(() => {
  if (stage !== prevStage) {
    // Trigger transition
    setIsTransitioning(true);
    setTimeout(() => {
      setPrevStage(stage);
      setIsTransitioning(false);
    }, 1000);
  }
}, [stage]);

// Dual background layers
<div className={`bg-layer ${isTransitioning ? 'fade-out' : ''}`} 
     style={{ backgroundImage: getStageBackground(prevStage) }} />
<div className={`bg-layer ${isTransitioning ? 'fade-in' : ''}`}
     style={{ backgroundImage: getStageBackground(stage) }} />
```

#### C. Near-Death Visual Warning
- **Complexity:** Low (2/5)
- **Impact:** ⭐⭐ Medium
- **Time:** 15 minutes

**Implementation:**
```tsx
// Red vignette when in danger
const isInDanger = state.grid.filter(canMove).length < 3 || 
                   state.bosses.some(b => b.nextAttack === 1);

{isInDanger && (
  <div className="fixed inset-0 pointer-events-none z-40">
    <div className="danger-vignette pulse-red" />
  </div>
)}
```

**CSS:**
```css
.danger-vignette {
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, transparent 40%, rgba(220, 38, 38, 0.3) 100%);
  animation: pulse-red 1s ease-in-out infinite;
}

@keyframes pulse-red {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}
```

---

### Priority 4: Store/Inventory Polish ⭐
**Goal:** Make shopping feel premium (Lower priority)

#### A. Shop Item Hover Previews
- **Time:** 15-20 minutes
- Enlarges item on hover
- Shows detailed stats tooltip
- Glow effect

#### B. Purchase Animation
- **Time:** 20 minutes
- Item flies from shop to inventory
- Inventory slot highlights
- Gold counter updates with animation

#### C. Reroll Animation
- **Time:** 15 minutes
- Spinner on button
- Tiles fade out → new tiles pop in
- Staggered entrance

---

## 📋 IMPLEMENTATION ROADMAP

### 🎯 Session 1: Particle Foundation (CURRENT)
**Estimated Time:** 1.5-2 hours  
**Goal:** Get XP and Gold particles working

**Tasks:**
1. ✅ Review & document completed work
2. ✅ Create visual improvement plan
3. ⬜ Create `components/Particle.tsx` base component
4. ⬜ Add XP particle state to `App.tsx`
5. ⬜ Implement XP soul particles
6. ⬜ Add particle cleanup logic
7. ⬜ Test performance during combos
8. ⬜ Implement gold coin burst particles

**Success Criteria:**
- [ ] Particles appear on every merge
- [ ] Smooth 60fps animation
- [ ] Particles auto-cleanup after 1s
- [ ] No memory leaks

---

### 🎯 Session 2: Enhanced Feedback (Next)
**Estimated Time:** 1-1.5 hours  
**Goal:** Polish floating text and add level up banner

**Tasks:**
1. ⬜ Enhanced floating text types (critical, XP, gold)
2. ⬜ Gold pop numbers on drops
3. ⬜ Create `LevelUpBanner.tsx`
4. ⬜ Integrate banner with level up events
5. ⬜ Add text outlines for readability
6. ⬜ Merge spark shower particles

**Success Criteria:**
- [ ] All number gains are visible
- [ ] Critical hits stand out
- [ ] Level ups feel celebratory
- [ ] Text is readable on all backgrounds

---

### 🎯 Session 3: Grid & Board Effects
**Estimated Time:** 1 hour  
**Goal:** Make the board react to game state

**Tasks:**
1. ⬜ Combo border glow on Grid
2. ⬜ Near-death danger vignette
3. ⬜ Stage background transitions
4. ⬜ Victory celebration screen
5. ⬜ Boss entrance effects

**Success Criteria:**
- [ ] Combos feel impactful
- [ ] Danger states are obvious
- [ ] Stage progression feels significant
- [ ] Boss encounters are dramatic

---

### 🎯 Session 4: Final Polish
**Estimated Time:** 1 hour  
**Goal:** Shop animations and final touches

**Tasks:**
1. ⬜ Shop item hover effects
2. ⬜ Purchase fly-to-inventory
3. ⬜ Inventory glow effects
4. ⬜ Reroll animation sequence
5. ⬜ Audio-visual sync check
6. ⬜ Mobile testing
7. ⬜ Performance optimization

**Success Criteria:**
- [ ] Shopping feels premium
- [ ] All animations sync with audio
- [ ] 60fps on mobile devices
- [ ] No visual bugs

---

## 🎨 VISUAL DESIGN PRINCIPLES

### Timing Guidelines
```
Instant Feedback:    <100ms   (button press, hover)
Micro-animations:    100-200ms (taps, blinks, ticks)
Small Rewards:       200-400ms (tile merges, XP)
Medium Rewards:      400-800ms (combos, tier jumps)
Big Celebrations:    800-2000ms (level ups, boss kills)
Ambient Effects:     Loop/Continuous
```

### Color Psychology
```
Cyan/Blue (#06b6d4):  XP, mana, progress
Gold/Yellow (#fbbf24): Currency, rewards
Red/Orange (#ef4444):  Danger, damage, urgency
Purple (#a855f7):      Magic, rare items
Green (#10b981):       Healing, positive
White Flash:           Critical, milestones
```

### Animation Easing
```
Bounce:     cubic-bezier(0.68, -0.55, 0.265, 1.55)
Ease Out:   cubic-bezier(0.4, 0, 0.2, 1)
Elastic:    cubic-bezier(0.34, 1.56, 0.64, 1)
Linear:     For loops only
```

### Performance Targets
```
Target FPS:          60fps constant
Max Particles:       <30 simultaneous
Preferred Method:    CSS > JS animation
GPU Acceleration:    transform, opacity only
Avoid:               blur >10px, complex filters
```

---

## 🔧 TECHNICAL ARCHITECTURE

### Particle System Design
```tsx
// Centralized particle manager in App.tsx
interface Particle {
  id: string;
  type: 'xp' | 'gold' | 'spark';
  x: number;
  y: number;
  vx?: number;  // velocity for physics
  vy?: number;
  targetX?: number;  // end position for paths
  targetY?: number;
  createdAt: number;
  duration: number;
}

const [particles, setParticles] = useState<Particle[]>([]);

// Auto-cleanup
useEffect(() => {
  const cleanup = setInterval(() => {
    const now = Date.now();
    setParticles(p => p.filter(particle => 
      now - particle.createdAt < particle.duration
    ));
  }, 100);
  return () => clearInterval(cleanup);
}, []);

// Spawn particles
const spawnXPParticles = (x: number, y: number, count = 5) => {
  const newParticles = Array.from({ length: count }, (_, i) => ({
    id: `xp-${Date.now()}-${i}`,
    type: 'xp',
    x: x + (Math.random() - 0.5) * 20,
    y: y + (Math.random() - 0.5) * 20,
    targetX: xpBarRef.current.offsetLeft,
    targetY: xpBarRef.current.offsetTop,
    createdAt: Date.now(),
    duration: 450
  }));
  setParticles(prev => [...prev, ...newParticles]);
};
```

### Reusable Particle Component
```tsx
// components/Particle.tsx
export const Particle: React.FC<{
  particle: Particle;
  onComplete?: () => void;
}> = ({ particle, onComplete }) => {
  const getParticleClass = () => {
    switch(particle.type) {
      case 'xp': return 'xp-particle soul-absorb';
      case 'gold': return 'gold-particle coin-burst';
      case 'spark': return 'spark-particle';
    }
  };

  useEffect(() => {
    const timer = setTimeout(onComplete, particle.duration);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={getParticleClass()}
      style={{
        position: 'absolute',
        left: particle.x,
        top: particle.y,
        '--tx': `${particle.targetX}px`,
        '--ty': `${particle.targetY}px`,
        pointerEvents: 'none'
      }}
    />
  );
};
```

### CSS Variables for Particles
```css
/* In index.html */
.xp-particle {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: radial-gradient(circle, #06b6d4, #3b82f6);
  box-shadow: 0 0 10px #06b6d4;
  animation: soulAbsorb 450ms ease-out forwards;
}

.gold-particle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: radial-gradient(circle, #fbbf24, #f59e0b);
  box-shadow: 0 0 8px #fbbf24;
}

.spark-particle {
  width: 3px;
  height: 3px;
  background: #fff;
  box-shadow: 0 0 6px #fbbf24;
}
```

---

## 📊 SUCCESS METRICS

### User Experience Goals
- [ ] Every interaction has visual feedback <100ms
- [ ] Resource gains are explicitly visible (particles + text)
- [ ] Combos feel escalating and rewarding
- [ ] Boss encounters are tense
- [ ] Level ups are celebratory
- [ ] Shopping feels premium

### Technical Quality
- [ ] Consistent 60fps during gameplay
- [ ] Zero TypeScript errors
- [ ] No breaking changes to saves
- [ ] Mobile-tested (touch works)
- [ ] Respects `prefers-reduced-motion`

### Polish Benchmark
- [ ] AAA mobile game visual quality
- [ ] Consistent animation language
- [ ] Audio-visual sync
- [ ] No particle spam (performance)
- [ ] No visual glitches

---

## 📝 CURRENT STATUS

**Phase:** Planning Complete ✅  
**Next Action:** Create Particle.tsx component  
**Estimated Time to Complete:** 4-6 hours total  
**Blocking Issues:** None  
**Dependencies:** React 19, TypeScript 5.8, existing CSS animations  

**Ready to proceed with Session 1: Particle Foundation**

---

## 💡 QUICK WINS TO START

### Easiest High-Impact Features (30 min each):
1. **Combo Border Glow** - Just add CSS class to Grid
2. **Level Up Banner** - Simple component + state
3. **Gold Pop Text** - Reuse existing FloatingText
4. **Danger Vignette** - CSS overlay + condition

### Start Here (Recommended):
```bash
# Create particle component first
touch components/Particle.tsx

# Then add particle rendering to App.tsx
# Start with XP particles only
# Test performance before adding gold
```

---

**Last Updated:** December 8, 2025  
**Author:** GitHub Copilot  
**Reference:** DOPAMINE_DESIGN.md, DOPAMINE_IMPLEMENTATION.md
