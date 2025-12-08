# Framer Motion Integration Guide

**Purpose**: Quick-start guide for integrating Framer Motion animations  
**Effort**: 1-2 hours  
**Impact**: Significant visual polish

---

## Installation

```bash
npm install framer-motion
```

---

## Quick Examples for Our Project

### 1. Combo Counter Animation

**Current**: CSS-based bounce  
**Enhanced**: Spring physics + stagger

```typescript
import { motion } from 'framer-motion';

export const ComboCounter: React.FC<ComboCounterProps> = ({ combo, multiplier, isActive }) => {
  if (!isActive || combo < 2) return null;

  return (
    <motion.div
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {/* Combo Ring */}
      <motion.div
        className="absolute inset-0 w-32 h-32 rounded-full border-2 border-yellow-500"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />

      {/* Combo Number */}
      <motion.div
        className="relative w-32 h-32 flex items-center justify-center"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        <div className="text-6xl font-black text-yellow-400">
          {combo}x
        </div>
      </motion.div>

      {/* Multiplier Badge */}
      <motion.div
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-yellow-500 text-white text-xs font-bold"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {multiplier.toFixed(1)}× Multiplier
      </motion.div>
    </motion.div>
  );
};
```

---

### 2. Daily Challenges List (Staggered Animation)

**Current**: Static list  
**Enhanced**: Staggered entrance animation

```typescript
import { motion } from 'framer-motion';

export const DailyChallengesPanel: React.FC<DailyChallengesPanelProps> = ({ challenges, onClose }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-slate-900 w-full max-w-md rounded-xl border border-yellow-700/50 shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800">
          <h2 className="text-xl font-bold text-yellow-500">📅 Daily Challenges</h2>
        </div>

        {/* Challenges List */}
        <motion.div
          className="flex-1 overflow-y-auto p-4 space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {challenges.map((challenge) => (
            <motion.div
              key={challenge.id}
              className="p-3 rounded-lg border bg-slate-800/50 border-slate-700/50"
              variants={itemVariants}
              whileHover={{ scale: 1.02, backgroundColor: "rgba(30, 41, 59, 0.7)" }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start gap-3">
                {/* Challenge Info */}
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-slate-200">
                    {challenge.name}
                  </h3>
                  <p className="text-xs text-slate-400 mb-2">
                    {challenge.description}
                  </p>

                  {/* Progress Bar */}
                  <motion.div
                    className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (challenge.current / challenge.target) * 100)}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </motion.div>
                </div>

                {/* Reward */}
                <motion.div
                  className="text-right"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="text-xs font-bold text-yellow-400">
                    {challenge.reward.gold}G
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
```

---

### 3. Stats Modal with Number Counters

**Current**: Static numbers  
**Enhanced**: Animated number transitions

```typescript
import { motion } from 'framer-motion';

const AnimatedNumber: React.FC<{ value: number; duration?: number }> = ({ value, duration = 1 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration }}
      >
        {value}
      </motion.span>
    </motion.div>
  );
};

export const StatsModal: React.FC<StatsModalProps> = ({ stats, onClose }) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-slate-900 w-full max-w-md rounded-xl border border-cyan-700/50 shadow-2xl overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Stats Grid */}
        <motion.div
          className="p-6 space-y-4"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
          initial="hidden"
          animate="visible"
        >
          {/* Row 1: Core Stats */}
          <motion.div
            className="grid grid-cols-2 gap-4"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1 },
            }}
          >
            <motion.div
              className="bg-slate-800/50 p-3 rounded-lg border border-slate-700"
              whileHover={{ scale: 1.05, backgroundColor: "rgba(30, 41, 59, 0.8)" }}
            >
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Merges</div>
              <AnimatedNumber value={stats.totalMerges} duration={1} />
            </motion.div>

            <motion.div
              className="bg-slate-800/50 p-3 rounded-lg border border-slate-700"
              whileHover={{ scale: 1.05, backgroundColor: "rgba(30, 41, 59, 0.8)" }}
            >
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Highest Combo</div>
              <AnimatedNumber value={stats.highestCombo} duration={1} />
            </motion.div>
          </motion.div>

          {/* Additional stats... */}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
```

---

### 4. Tile Merge Animation

**Current**: CSS scale  
**Enhanced**: Spring physics + particle burst

```typescript
import { motion } from 'framer-motion';

export const TileComponent: React.FC<TileProps> = ({ tile, size }) => {
  const mergeVariants = {
    initial: { scale: 1, opacity: 1 },
    merge: {
      scale: [1, 0.8, 1.1, 1],
      opacity: [1, 0.8, 1, 1],
      transition: {
        duration: 0.3,
        times: [0, 0.3, 0.7, 1],
        ease: "easeInOut",
      },
    },
  };

  return (
    <motion.div
      className={`absolute w-full h-full rounded-lg font-bold text-white flex items-center justify-center cursor-pointer transition-all ${getTileStyle(tile)}`}
      style={{
        left: `${(tile.x / size) * 100}%`,
        top: `${(tile.y / size) * 100}%`,
        width: `${100 / size}%`,
        height: `${100 / size}%`,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      variants={mergeVariants}
      animate={tile.mergedFrom ? "merge" : "initial"}
    >
      {/* Tile Content */}
      <motion.div
        className="text-center"
        animate={{ scale: tile.mergedFrom ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-2xl font-black">{tile.value}</div>
      </motion.div>

      {/* Merge Glow */}
      {tile.mergedFrom && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-white/20"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  );
};
```

---

### 5. Level Up Celebration

**Current**: Static text  
**Enhanced**: Explosion effect

```typescript
import { motion } from 'framer-motion';

export const LevelUpCelebration: React.FC<{ level: number }> = ({ level }) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Explosion Ring */}
      <motion.div
        className="absolute w-32 h-32 rounded-full border-2 border-yellow-400"
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />

      {/* Level Text */}
      <motion.div
        className="text-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <motion.div
          className="text-6xl font-black text-yellow-400 mb-4"
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 0.6 }}
        >
          LEVEL UP!
        </motion.div>
        <motion.div
          className="text-4xl font-bold text-yellow-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Level {level}
        </motion.div>
      </motion.div>

      {/* Particle Burst */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-yellow-400"
          initial={{
            x: 0,
            y: 0,
            opacity: 1,
          }}
          animate={{
            x: Math.cos((i / 12) * Math.PI * 2) * 100,
            y: Math.sin((i / 12) * Math.PI * 2) * 100,
            opacity: 0,
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      ))}
    </motion.div>
  );
};
```

---

## Common Patterns

### Entrance Animation
```typescript
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -20 }}
transition={{ type: "spring", stiffness: 300, damping: 30 }}
```

### Hover Effect
```typescript
whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255, 215, 0, 0.5)" }}
whileTap={{ scale: 0.95 }}
```

### Stagger Children
```typescript
variants={{
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}}
```

### Number Counter
```typescript
<motion.span>
  {Math.round(value)}
</motion.span>
```

---

## Performance Tips

1. **Use `will-change` CSS**
```typescript
style={{ willChange: "transform, opacity" }}
```

2. **Reduce Motion for Accessibility**
```typescript
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

<motion.div
  animate={prefersReducedMotion ? {} : { scale: 1.1 }}
/>
```

3. **Lazy Load Animations**
```typescript
const [isVisible, setIsVisible] = useState(false);

useEffect(() => {
  const timer = setTimeout(() => setIsVisible(true), 100);
  return () => clearTimeout(timer);
}, []);

{isVisible && <motion.div animate={{ opacity: 1 }} />}
```

4. **Use `layout` Prop Sparingly**
```typescript
<motion.div layout> {/* Only when necessary */}
```

---

## Integration Checklist

- [ ] Install Framer Motion: `npm install framer-motion`
- [ ] Update ComboCounter with spring animations
- [ ] Add stagger to DailyChallengesPanel
- [ ] Enhance StatsModal with number counters
- [ ] Add merge animations to TileComponent
- [ ] Create LevelUpCelebration component
- [ ] Test on mobile devices
- [ ] Verify performance (60fps)
- [ ] Check accessibility (prefers-reduced-motion)
- [ ] Update documentation

---

## Bundle Impact

- **Framer Motion**: ~40KB (gzipped)
- **Total with Framer Motion**: ~277KB (from ~237KB)
- **Gzipped**: ~150KB (acceptable)

---

## Next Steps

1. Install Framer Motion
2. Update ComboCounter component
3. Test animations on target devices
4. Gradually migrate other components
5. Monitor performance metrics

---

**Ready to implement. Estimated time: 2-3 hours for full integration.**
