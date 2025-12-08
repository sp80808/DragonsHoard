import { ParticleConfig, Particle } from '../types';
import { ParticlePool } from '../components/ParticleSystem';

/**
 * Particle system utilities for spawning common particle effects
 */

/**
 * Spawn XP soul particles from a merge point to XP bar
 */
export function spawnXPParticles(
  pool: ParticlePool,
  mergeX: number,
  mergeY: number,
  xpBarTargetX: number,
  xpBarTargetY: number,
  amount: number = 8
): Particle[] {
  const particles: Particle[] = [];

  for (let i = 0; i < amount; i++) {
    // Slight randomization in target position (±20px)
    const targetX = xpBarTargetX + (Math.random() - 0.5) * 40;
    const targetY = xpBarTargetY + (Math.random() - 0.5) * 40;

    // Random delay between particles
    const delay = i * 20;

    const config: ParticleConfig = {
      type: 'xp',
      startPos: { x: mergeX, y: mergeY },
      endPos: { x: targetX, y: targetY },
      color: '#00CED1', // Cyan
      lifetime: 400 + delay, // Account for delay
      gravity: false,
    };

    const particle = pool.spawn(config);
    if (particle) {
      particles.push(particle);
    }
  }

  return particles;
}

/**
 * Spawn gold coin particles with physics
 */
export function spawnGoldParticles(
  pool: ParticlePool,
  mergeX: number,
  mergeY: number,
  goldCounterX: number,
  goldCounterY: number,
  goldAmount: number
): Particle[] {
  // Scale particle count based on gold amount (min 5, max 20)
  const count = Math.min(20, Math.max(5, Math.floor(goldAmount / 50)));
  
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    // Random initial velocity (eject outward)
    const angle = (Math.PI * 2 * i) / count;
    const speed = 2 + Math.random() * 3;

    const config: ParticleConfig = {
      type: 'gold',
      startPos: { 
        x: mergeX + (Math.random() - 0.5) * 20,
        y: mergeY + (Math.random() - 0.5) * 20 
      },
      color: '#FFD700', // Gold
      lifetime: 800,
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed - 2, // Initial upward burst
      },
      gravity: true, // Apply gravity to coins
    };

    const particle = pool.spawn(config);
    if (particle) {
      particles.push(particle);
    }
  }

  return particles;
}

/**
 * Spawn merge spark burst
 */
export function spawnMergeSparks(
  pool: ParticlePool,
  mergeX: number,
  mergeY: number,
  color: string = '#FFD700',
  count: number = 15
): Particle[] {
  const config: ParticleConfig = {
    type: 'spark',
    startPos: { x: mergeX, y: mergeY },
    color,
    lifetime: 200,
  };

  return pool.spawnBurst(config, count);
}

/**
 * Spawn combo aura embers (looping effect)
 */
export function spawnComboEmbers(
  pool: ParticlePool,
  gridX: number,
  gridY: number,
  gridWidth: number,
  comboCount: number
): Particle[] {
  // Intensity scales with combo
  const count = Math.min(8, Math.floor(comboCount / 2) + 2);
  
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    // Random position around grid edge
    const side = i % 4; // 0=top, 1=right, 2=bottom, 3=left
    let x = gridX;
    let y = gridY;
    let vx = 0;
    let vy = 0;

    switch (side) {
      case 0: // Top
        x = gridX + Math.random() * gridWidth;
        y = gridY;
        vy = -1 - Math.random();
        break;
      case 1: // Right
        x = gridX + gridWidth;
        y = gridY + Math.random() * gridWidth;
        vx = 1 + Math.random();
        break;
      case 2: // Bottom
        x = gridX + Math.random() * gridWidth;
        y = gridY + gridWidth;
        vy = 1 + Math.random();
        break;
      case 3: // Left
        x = gridX;
        y = gridY + Math.random() * gridWidth;
        vx = -1 - Math.random();
        break;
    }

    const config: ParticleConfig = {
      type: 'ember',
      startPos: { x, y },
      color: '#FF8C00',
      lifetime: 300 + Math.random() * 200,
      velocity: { x: vx * 2, y: vy * 2 },
      gravity: false,
    };

    const particle = pool.spawn(config);
    if (particle) {
      particles.push(particle);
    }
  }

  return particles;
}

/**
 * Get tile position in grid (pixel coordinates)
 * Assumes grid layout: each tile is roughly 40px with padding
 */
export function getTilePixelPos(tileIndex: number, gridSize: number): { x: number; y: number } {
  const row = Math.floor(tileIndex / gridSize);
  const col = tileIndex % gridSize;
  
  // Rough calculation - adjust based on actual grid CSS
  const tileSize = 60; // CSS: w-14, h-14 ≈ 56-60px
  const padding = 4; // CSS: p-1
  const offset = 16; // Grid margin offset
  
  return {
    x: offset + col * (tileSize + padding) + tileSize / 2,
    y: offset + row * (tileSize + padding) + tileSize / 2,
  };
}

/**
 * Get UI element position (like XP bar or gold counter)
 */
export function getUIElementPos(elementId: string): { x: number; y: number } | null {
  const element = document.getElementById(elementId);
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

/**
 * Spawn tier ascension effect for major upgrades (8→16, 64→128, 256→512)
 */
export function spawnTierAscensionEffect(
  pool: ParticlePool,
  tileX: number,
  tileY: number,
  tierValue: number
): Particle[] {
  const particles: Particle[] = [];

  // Determine color based on tier
  let color = '#FFD700'; // Gold default
  if (tierValue >= 256) {
    color = '#9333EA'; // Purple for ultra-high tiers
  } else if (tierValue >= 64) {
    color = '#3B82F6'; // Blue for high tiers
  }

  // Inner burst - tight, bright sparks
  const innerConfig: ParticleConfig = {
    type: 'spark',
    startPos: { x: tileX, y: tileY },
    color,
    lifetime: 400,
  };
  const innerSparks = pool.spawnBurst(innerConfig, 20);
  particles.push(...innerSparks);

  // Outer halo - larger, slower particles
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 * i) / 12;
    const speed = 1.5;

    const config: ParticleConfig = {
      type: 'spark',
      startPos: { x: tileX, y: tileY },
      color,
      lifetime: 600,
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
      gravity: false,
    };

    const particle = pool.spawn(config);
    if (particle) {
      particles.push(particle);
    }
  }

  return particles;
}

/**
 * Check if a merge qualifies as a "tier ascension" (special milestone)
 */
export function isTierAscension(value: number): boolean {
  return value === 16 || value === 128 || value === 512 || value === 2048;
}

/**
 * Get tier color for particle effects
 */
export function getTierColor(value: number): string {
  if (value >= 512) return '#9333EA'; // Purple
  if (value >= 128) return '#3B82F6'; // Blue
  if (value >= 32) return '#10B981'; // Green
  if (value >= 8) return '#F59E0B'; // Amber
  return '#FFD700'; // Gold
}
