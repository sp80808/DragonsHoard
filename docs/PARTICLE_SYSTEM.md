# Particle System Documentation

## Overview

Dragon's Hoard features a comprehensive particle effects system that provides visual feedback for game events. The system is optimized for performance and supports multiple particle types with physics simulation and curved path animations.

## Architecture

### Components

- **`Particle.tsx`**: Individual particle renderer with type-specific styling
- **`ParticleSystem.tsx`**: Manages particle pool, physics updates, and rendering
- **`particleUtils.ts`**: Utility functions for spawning common particle effects

### Core Classes

#### ParticlePool

Manages particle allocation and reuse for performance:

```typescript
interface ParticlePool {
  spawn(config: ParticleConfig): Particle | null;
  spawnBurst(config: ParticleConfig, count: number): Particle[];
  update(): Particle[];  // Return active particles
  cleanup(): Particle[]; // Remove inactive particles
  getStats(): { total: number; active: number; usage: string };
}
```

#### Particle Types

- **`xp`**: Cyan particles that follow curved paths to the XP bar
- **`gold`**: Yellow particles with gravity physics toward gold counter
- **`spark`**: Brief, intense particles for merge effects
- **`ember`**: Subtle floating particles for combo auras

## Particle Effects

### XP Soul Particles

Triggered on XP gain from merges:

- **Path**: Quadratic Bezier curve from tile to XP bar
- **Duration**: 400ms
- **Count**: 5-8 particles per merge
- **Color**: Cyan (#00CED1)
- **Randomization**: Slight position variation for organic feel

### Gold Coin Burst

Triggered on gold gain from merges:

- **Path**: Physics simulation with gravity
- **Duration**: 800ms
- **Count**: 5-20 particles based on gold amount
- **Color**: Gold (#FFD700)
- **Velocity**: Initial upward burst, then parabolic arc

### Merge Spark Shower

Triggered on all merges:

- **Path**: Radial burst from merge point
- **Duration**: 200ms
- **Count**: 12-15 particles
- **Color**: Based on tile tier (gold → purple)
- **Effect**: Instant burst for impact feedback

### Combo Ember Aura

Triggered when combo counter > 1:

- **Path**: Floating around grid perimeter
- **Duration**: Continuous while combo active
- **Count**: 4-8 particles scaling with combo
- **Color**: Orange (#FF8C00)
- **Movement**: Slow circular motion around board

### Tier Ascension Effects

Triggered on milestone merges (16, 128, 512, 2048):

- **Inner Burst**: 20 tight sparks
- **Outer Halo**: 12 slower particles in ring formation
- **Duration**: 400-600ms
- **Color**: Tier-based (gold → blue → purple)

## Performance Optimizations

### Particle Pool System

- Pre-allocates 200 particles to avoid GC pressure
- Reuses inactive particles instead of creating new ones
- Automatic cleanup removes expired particles from active list

### Rendering Strategy

- DOM-based particles for <100 count (better for interaction)
- Canvas fallback planned for >100 particles (future optimization)

### Update Loop

- 60fps physics simulation using `requestAnimationFrame`
- Fixed timestep prevents frame-rate dependent behavior
- Batching updates for efficient state management

## Configuration

### ParticleConfig Interface

```typescript
interface ParticleConfig {
  type: ParticleType;
  startPos: { x: number; y: number };
  endPos?: { x: number; y: number };
  color: string;
  lifetime: number; // milliseconds
  velocity?: { x: number; y: number };
  gravity?: boolean;
  count?: number;
  pathType?: 'linear' | 'bezier';
  controlPoint?: { x: number; y: number };
}
```

### Quality Settings (Planned)

Future versions will include quality presets:
- **High**: Full particle counts, all effects enabled
- **Medium**: Reduced counts, essential effects only
- **Low**: Minimal particles, critical feedback only

## Integration Points

### Game Events

Particles are spawned in `App.tsx` useEffect hooks:

```typescript
useEffect(() => {
  // Monitor XP/gold/combo changes
  // Spawn appropriate particle effects
}, [state.xp, state.gold, state.combo]);
```

### UI Element Positioning

Particle targets use DOM queries for accurate positioning:

```typescript
const xpBarPos = getUIElementPos('xp-bar');
const goldCounterPos = getUIElementPos('gold-counter');
```

## Future Enhancements

- **Canvas Rendering**: For ultra-high particle counts
- **Particle Textures**: Animated sprites instead of CSS
- **Audio Integration**: Sound effects synchronized with particles
- **Performance Monitoring**: Real-time FPS and particle stats
- **Shader Effects**: WebGL-accelerated visual effects

## Troubleshooting

### Common Issues

1. **Particles not appearing**: Check if pool is exhausted (`getStats()`)
2. **Performance drops**: Reduce particle counts or enable cleanup
3. **Incorrect positioning**: Verify DOM element IDs and positioning

### Debug Tools

Enable particle debugging in browser console:

```javascript
// View particle pool stats
console.log(particlePool.getStats());

// Monitor active particles
setInterval(() => {
  console.log('Active particles:', particlePool.getActiveParticles().length);
}, 1000);