
import { PlayerProfile, GameState, RunStats, HeroClass, DailyBounty } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'dragons_hoard_profile';

// --- XP & Leveling Logic ---
// Level 1: 0-1000
// Level 2: 1000-2828
// Level 10: ~31,000
const getXpForLevel = (level: number) => Math.floor(1000 * Math.pow(level, 1.5));

export const getNextLevelXp = (level: number) => getXpForLevel(level);

// --- Bounty System ---
const BOUNTY_TEMPLATES: Omit<DailyBounty, 'id' | 'currentValue' | 'isCompleted'>[] = [
    { description: "Slay 1 Boss", targetStat: 'bossesDefeated', targetValue: 1, rewardXp: 500 },
    { description: "Earn 200 Gold", targetStat: 'goldEarned', targetValue: 200, rewardXp: 300 },
    { description: "Trigger 5 Cascades", targetStat: 'cascadesTriggered', targetValue: 5, rewardXp: 400 },
    { description: "Reach Stage 2 (Fungal)", targetStat: 'highestTile', targetValue: 32, rewardXp: 400 }, // Proxy using Tile Value
    { description: "Use 3 Power Ups", targetStat: 'powerUpsUsed', targetValue: 3, rewardXp: 300 },
    { description: "Survive 100 Turns", targetStat: 'turnCount', targetValue: 100, rewardXp: 350 },
    { description: "Score 5,000 Points", targetStat: 'goldEarned', targetValue: 5000, rewardXp: 600 }, // Hack: reusing goldEarned field for score logic in finalize check
];

const generateDailyBounties = (): DailyBounty[] => {
    // Shuffle and pick 3
    const shuffled = [...BOUNTY_TEMPLATES].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3).map(t => ({
        ...t,
        id: uuidv4(),
        currentValue: 0,
        isCompleted: false
    }));
};

// --- Profile Management ---

export const getPlayerProfile = (): PlayerProfile => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        const profile: PlayerProfile = JSON.parse(stored);
        
        // Data Migration: Ensure new fields exist
        if (!profile.unlockedClasses) profile.unlockedClasses = [HeroClass.ADVENTURER];
        if (!profile.unlockedFeatures) profile.unlockedFeatures = [];
        if (!profile.activeBounties) profile.activeBounties = [];
        if (profile.tutorialCompleted === undefined) profile.tutorialCompleted = false;
        if (profile.bossTutorialCompleted === undefined) profile.bossTutorialCompleted = false;
        if (!profile.seenHints) profile.seenHints = [];
        if (!profile.activeTilesetId) profile.activeTilesetId = 'DEFAULT';
        if (!profile.unlockedLore) profile.unlockedLore = [];
        if (!profile.earnedMedals) profile.earnedMedals = {};
        
        // Check Daily Reset
        const today = new Date().toISOString().split('T')[0];
        if (profile.lastBountyDate !== today) {
            profile.activeBounties = generateDailyBounties();
            profile.lastBountyDate = today;
            saveProfile(profile);
        }
        
        return profile;
    }
  } catch (e) {
    console.error("Failed to load profile", e);
  }

  // Initialize new anonymous profile
  const newProfile: PlayerProfile = {
    id: uuidv4(),
    totalAccountXp: 0,
    accountLevel: 1,
    gamesPlayed: 0,
    highScore: 0,
    unlockedFeatures: [],
    unlockedClasses: [HeroClass.ADVENTURER],
    activeBounties: generateDailyBounties(),
    lastBountyDate: new Date().toISOString().split('T')[0],
    lastPlayed: new Date().toISOString(),
    tutorialCompleted: false,
    bossTutorialCompleted: false,
    seenHints: [],
    activeTilesetId: 'DEFAULT',
    unlockedLore: [],
    earnedMedals: {}
  };
  saveProfile(newProfile);
  return newProfile;
};

export const completeTutorial = () => {
    const profile = getPlayerProfile();
    profile.tutorialCompleted = true;
    saveProfile(profile);
};

export const markHintSeen = (hintId: string) => {
    const profile = getPlayerProfile();
    if (!profile.seenHints.includes(hintId)) {
        profile.seenHints.push(hintId);
        saveProfile(profile);
    }
};

export const setActiveTileset = (id: string) => {
    const profile = getPlayerProfile();
    profile.activeTilesetId = id;
    saveProfile(profile);
};

export const unlockLore = (loreId: string) => {
    const profile = getPlayerProfile();
    if (!profile.unlockedLore.includes(loreId)) {
        profile.unlockedLore.push(loreId);
        saveProfile(profile);
        return true;
    }
    return false;
};

export const awardMedal = (medalId: string) => {
    const profile = getPlayerProfile();
    if (!profile.earnedMedals) profile.earnedMedals = {};
    profile.earnedMedals[medalId] = (profile.earnedMedals[medalId] || 0) + 1;
    saveProfile(profile);
};

// Forcefully unlock a class (used for victory rewards)
export const unlockClass = (cls: HeroClass) => {
    const profile = getPlayerProfile();
    if (!profile.unlockedClasses.includes(cls)) {
        profile.unlockedClasses.push(cls);
        saveProfile(profile);
        return true; // Was new unlock
    }
    return false; // Already unlocked
};

export interface UnlockReward {
    type: 'CLASS' | 'FEATURE' | 'TILESET';
    id: string;
    label: string;
    desc: string;
    level: number;
}

export const finalizeRun = (finalState: GameState): { profile: PlayerProfile, leveledUp: boolean, xpGained: number, bountiesCompleted: number, newUnlocks: UnlockReward[] } => {
  const profile = getPlayerProfile();
  
  // 1. Calculate Base Run XP
  let runXp = 
    finalState.score + 
    (finalState.level * 250) + 
    (finalState.runStats.goldEarned * 2) +
    (finalState.runStats.cascadesTriggered * 50) +
    (finalState.runStats.powerUpsUsed * 100);
  
  // 2. Check Bounties
  let bountiesCompletedCount = 0;
  const updatedBounties = profile.activeBounties.map(bounty => {
      if (bounty.isCompleted) return bounty;

      let achieved = false;
      
      // Special handling for score which isn't directly in RunStats the same way
      if (bounty.description.includes("Score")) {
          if (finalState.score >= bounty.targetValue) achieved = true;
      } else {
          const runVal = finalState.runStats[bounty.targetStat] as number;
          if (runVal >= bounty.targetValue) achieved = true;
      }

      if (achieved) {
          runXp += bounty.rewardXp;
          bountiesCompletedCount++;
          return { ...bounty, isCompleted: true, currentValue: bounty.targetValue };
      }
      return bounty;
  });

  profile.activeBounties = updatedBounties;
  
  // 3. Update Profile Stats
  profile.totalAccountXp += runXp;
  profile.gamesPlayed += 1;
  profile.highScore = Math.max(profile.highScore, finalState.score);
  profile.lastPlayed = new Date().toISOString();

  // 4. Check for Account Level Up & Class Unlocks
  let leveledUp = false;
  const newUnlocks: UnlockReward[] = [];
  
  // We simulate leveling up step by step to catch all rewards
  while (true) {
    const nextLevelXp = getXpForLevel(profile.accountLevel);
    if (profile.totalAccountXp >= nextLevelXp) {
        profile.accountLevel += 1;
        leveledUp = true;
        const level = profile.accountLevel;

        // Unlock Classes
        if (level >= 3 && !profile.unlockedClasses.includes(HeroClass.WARRIOR)) {
            profile.unlockedClasses.push(HeroClass.WARRIOR);
            newUnlocks.push({ type: 'CLASS', id: HeroClass.WARRIOR, label: 'Warrior', desc: 'Starts with Bomb Scroll', level });
        }
        if (level >= 5 && !profile.unlockedClasses.includes(HeroClass.ROGUE)) {
            profile.unlockedClasses.push(HeroClass.ROGUE);
            newUnlocks.push({ type: 'CLASS', id: HeroClass.ROGUE, label: 'Rogue', desc: 'Starts with Reroll Token', level });
        }
        if (level >= 10 && !profile.unlockedClasses.includes(HeroClass.MAGE)) {
            profile.unlockedClasses.push(HeroClass.MAGE);
            newUnlocks.push({ type: 'CLASS', id: HeroClass.MAGE, label: 'Mage', desc: 'Starts with XP Potion', level });
        }
         if (level >= 20 && !profile.unlockedClasses.includes(HeroClass.PALADIN)) {
            profile.unlockedClasses.push(HeroClass.PALADIN);
            newUnlocks.push({ type: 'CLASS', id: HeroClass.PALADIN, label: 'Paladin', desc: 'Starts with Golden Rune', level });
        }

        // Unlock Features
        if (level >= 5 && !profile.unlockedFeatures.includes('HARD_MODE')) {
            profile.unlockedFeatures.push('HARD_MODE');
            newUnlocks.push({ type: 'FEATURE', id: 'HARD_MODE', label: 'Hard Mode', desc: 'Higher risks, higher rewards.', level });
        }
        if (level >= 8 && !profile.unlockedFeatures.includes('TILESET_UNDEAD')) {
            profile.unlockedFeatures.push('TILESET_UNDEAD');
            newUnlocks.push({ type: 'TILESET', id: 'TILESET_UNDEAD', label: 'Necrotic Rot', desc: 'New visual theme unlocked.', level });
        }
        if (level >= 12 && !profile.unlockedFeatures.includes('MODE_BOSS_RUSH')) {
            profile.unlockedFeatures.push('MODE_BOSS_RUSH');
            newUnlocks.push({ type: 'FEATURE', id: 'MODE_BOSS_RUSH', label: 'Boss Rush', desc: 'Start at level 5 with boss waves.', level });
        }
        if (level >= 15 && !profile.unlockedFeatures.includes('TILESET_INFERNAL')) {
            profile.unlockedFeatures.push('TILESET_INFERNAL');
            newUnlocks.push({ type: 'TILESET', id: 'TILESET_INFERNAL', label: 'Infernal Core', desc: 'Magma visual theme.', level });
        }
        if (level >= 25 && !profile.unlockedFeatures.includes('TILESET_AQUATIC')) {
            profile.unlockedFeatures.push('TILESET_AQUATIC');
            newUnlocks.push({ type: 'TILESET', id: 'TILESET_AQUATIC', label: 'Abyssal Depth', desc: 'Oceanic visual theme.', level });
        }
        if (level >= 35 && !profile.unlockedFeatures.includes('TILESET_CYBERPUNK')) {
            profile.unlockedFeatures.push('TILESET_CYBERPUNK');
            newUnlocks.push({ type: 'TILESET', id: 'TILESET_CYBERPUNK', label: 'Neon City', desc: 'Futuristic visual theme.', level });
        }
        if (level >= 45 && !profile.unlockedFeatures.includes('TILESET_STEAMPUNK')) {
            profile.unlockedFeatures.push('TILESET_STEAMPUNK');
            newUnlocks.push({ type: 'TILESET', id: 'TILESET_STEAMPUNK', label: 'Clockwork', desc: 'Steampunk visual theme.', level });
        }
        if (level >= 50 && !profile.unlockedFeatures.includes('TILESET_CELESTIAL')) {
            profile.unlockedFeatures.push('TILESET_CELESTIAL');
            newUnlocks.push({ type: 'TILESET', id: 'TILESET_CELESTIAL', label: 'Divine Light', desc: 'Angelic visual theme.', level });
        }
        if (level >= 55 && !profile.unlockedFeatures.includes('TILESET_FEUDAL')) {
            profile.unlockedFeatures.push('TILESET_FEUDAL');
            newUnlocks.push({ type: 'TILESET', id: 'TILESET_FEUDAL', label: 'Ronin Path', desc: 'Samurai visual theme.', level });
        }
        if (level >= 60 && !profile.unlockedFeatures.includes('TILESET_CANDY')) {
            profile.unlockedFeatures.push('TILESET_CANDY');
            newUnlocks.push({ type: 'TILESET', id: 'TILESET_CANDY', label: 'Sugar Rush', desc: 'Candy visual theme.', level });
        }

    } else {
        break;
    }
  }

  saveProfile(profile);
  return { profile, leveledUp, xpGained: runXp, bountiesCompleted: bountiesCompletedCount, newUnlocks };
};

const saveProfile = (p: PlayerProfile) => localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
