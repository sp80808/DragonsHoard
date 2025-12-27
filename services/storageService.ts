
import { PlayerProfile, GameState, RunStats, HeroClass, DailyBounty, AbilityType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { facebookService } from './facebookService';

const STORAGE_KEY = 'dragons_hoard_profile';

const getXpForLevel = (level: number) => Math.floor(1000 * Math.pow(level, 1.5));

export const getNextLevelXp = (level: number) => getXpForLevel(level);

const BOUNTY_TEMPLATES: Omit<DailyBounty, 'id' | 'currentValue' | 'isCompleted'>[] = [
    { description: "Slay 1 Boss", targetStat: 'bossesDefeated', targetValue: 1, rewardXp: 500 },
    { description: "Earn 200 Gold", targetStat: 'goldEarned', targetValue: 200, rewardXp: 300 },
    { description: "Trigger 5 Cascades", targetStat: 'cascadesTriggered', targetValue: 5, rewardXp: 400 },
    { description: "Reach Stage 2 (Fungal)", targetStat: 'highestTile', targetValue: 32, rewardXp: 400 }, 
    { description: "Use 3 Power Ups", targetStat: 'powerUpsUsed', targetValue: 3, rewardXp: 300 },
    { description: "Survive 100 Turns", targetStat: 'turnCount', targetValue: 100, rewardXp: 350 },
    { description: "Score 5,000 Points", targetStat: 'goldEarned', targetValue: 5000, rewardXp: 600 }, 
];

const generateDailyBounties = (): DailyBounty[] => {
    const shuffled = [...BOUNTY_TEMPLATES].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3).map(t => ({
        ...t,
        id: uuidv4(),
        currentValue: 0,
        isCompleted: false
    }));
};

const getDefaultProfile = (): PlayerProfile => ({
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
    earnedMedals: {},
    unlockedPowerups: []
});

export const syncPlayerProfile = async (): Promise<PlayerProfile> => {
    // 1. Load Local
    let localProfile: PlayerProfile | null = null;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) localProfile = JSON.parse(stored);
    } catch(e) {}

    // 2. Load Cloud
    let cloudData: any = {};
    try {
        cloudData = await facebookService.loadData([STORAGE_KEY]);
    } catch(e) {}
    
    const cloudProfile = cloudData[STORAGE_KEY] as PlayerProfile | undefined;

    // 3. Merge (Simple strategy: Highest XP wins, or Cloud wins if no local)
    let finalProfile = localProfile || getDefaultProfile();

    if (cloudProfile) {
        if (!localProfile || cloudProfile.totalAccountXp > localProfile.totalAccountXp) {
            finalProfile = cloudProfile;
            console.log("Synced from Cloud (Newer/Better data)");
        }
    }

    // 4. Validate & Fill missing fields
    if (!finalProfile.unlockedClasses) finalProfile.unlockedClasses = [HeroClass.ADVENTURER];
    if (!finalProfile.activeBounties) finalProfile.activeBounties = [];
    
    const today = new Date().toISOString().split('T')[0];
    if (finalProfile.lastBountyDate !== today) {
        finalProfile.activeBounties = generateDailyBounties();
        finalProfile.lastBountyDate = today;
    }

    // 5. Save back to ensure consistency
    saveProfile(finalProfile);
    return finalProfile;
};

export const getPlayerProfile = (): PlayerProfile => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return getDefaultProfile();
};

const saveProfile = (p: PlayerProfile) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    // Fire and forget cloud save
    facebookService.saveData(STORAGE_KEY, p);
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

export const unlockClass = (cls: HeroClass) => {
    const profile = getPlayerProfile();
    if (!profile.unlockedClasses.includes(cls)) {
        profile.unlockedClasses.push(cls);
        saveProfile(profile);
        return true; 
    }
    return false; 
};

export interface UnlockReward {
    type: 'CLASS' | 'FEATURE' | 'TILESET' | 'POWERUP';
    id: string;
    label: string;
    desc: string;
    level: number;
}

const calculateHoardRank = (level: number) => {
    if (level >= 50) return 3; // Dragon Lord
    if (level >= 30) return 2; // Conqueror
    if (level >= 10) return 1; // Slayer
    return 0; // Scavenger
};

export const finalizeRun = (finalState: GameState): { profile: PlayerProfile, leveledUp: boolean, xpGained: number, bountiesCompleted: number, newUnlocks: UnlockReward[] } => {
  const profile = getPlayerProfile();
  
  let runXp = 
    finalState.score + 
    (finalState.level * 250) + 
    (finalState.runStats.goldEarned * 2) +
    (finalState.runStats.cascadesTriggered * 50) +
    (finalState.runStats.powerUpsUsed * 100);
  
  let bountiesCompletedCount = 0;
  const updatedBounties = profile.activeBounties.map(bounty => {
      if (bounty.isCompleted) return bounty;

      let achieved = false;
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
  profile.totalAccountXp += runXp;
  profile.gamesPlayed += 1;
  profile.highScore = Math.max(profile.highScore, finalState.score);
  profile.lastPlayed = new Date().toISOString();

  // Social: Submit to Global Leaderboard
  facebookService.submitScore('Global_Hoard_Rank', profile.highScore, JSON.stringify({ level: profile.accountLevel }));
  
  // Social: Post Session Score (For generic FB context ranking)
  facebookService.postSessionScore(finalState.score);

  // Social: Update Surfaceable Stats (Hoard Rank)
  facebookService.setStats({ hoard_rank: calculateHoardRank(profile.accountLevel) });

  let leveledUp = false;
  const newUnlocks: UnlockReward[] = [];
  
  if (finalState.runStats.highestTile >= 2048 && !profile.unlockedFeatures.includes('MODE_BOSS_RUSH')) {
      profile.unlockedFeatures.push('MODE_BOSS_RUSH');
      newUnlocks.push({ type: 'FEATURE', id: 'MODE_BOSS_RUSH', label: 'Boss Rush', desc: 'Face the gauntlet.', level: profile.accountLevel });
  }

  while (true) {
    const nextLevelXp = getXpForLevel(profile.accountLevel);
    if (profile.totalAccountXp >= nextLevelXp) {
        profile.accountLevel += 1;
        leveledUp = true;
        const level = profile.accountLevel;

        if (level >= 3 && !profile.unlockedPowerups.includes('SCORCH')) {
            profile.unlockedPowerups.push('SCORCH');
            newUnlocks.push({ type: 'POWERUP', id: 'SCORCH', label: 'Passive: Scorch', desc: 'Automatically burns a weak tile every 30 turns.', level });
        }

        if (level >= 3 && !profile.unlockedClasses.includes(HeroClass.WARRIOR)) {
            profile.unlockedClasses.push(HeroClass.WARRIOR);
            newUnlocks.push({ type: 'CLASS', id: HeroClass.WARRIOR, label: 'Warrior', desc: 'Starts with Bomb Scroll', level });
        }

        if (level >= 5) {
            if (!profile.unlockedClasses.includes(HeroClass.ROGUE)) {
                profile.unlockedClasses.push(HeroClass.ROGUE);
                newUnlocks.push({ type: 'CLASS', id: HeroClass.ROGUE, label: 'Rogue', desc: 'Starts with Reroll Token', level });
            }
            if (!profile.unlockedFeatures.includes('HARD_MODE')) {
                profile.unlockedFeatures.push('HARD_MODE');
                newUnlocks.push({ type: 'FEATURE', id: 'HARD_MODE', label: 'Hard Mode', desc: 'Higher risks, higher rewards.', level });
            }
        }

        if (level >= 6 && !profile.unlockedFeatures.includes('CODEX_FULL')) {
            profile.unlockedFeatures.push('CODEX_FULL');
            newUnlocks.push({ type: 'FEATURE', id: 'CODEX', label: 'Full Codex', desc: 'View enemy stats and detailed lore.', level });
        }

        if (level >= 8 && !profile.unlockedFeatures.includes('TILESET_UNDEAD')) {
            profile.unlockedFeatures.push('TILESET_UNDEAD');
            newUnlocks.push({ type: 'TILESET', id: 'TILESET_UNDEAD', label: 'Necrotic Rot', desc: 'New visual theme unlocked.', level });
        }

        if (level >= 10) {
            if (!profile.unlockedClasses.includes(HeroClass.MAGE)) {
                profile.unlockedClasses.push(HeroClass.MAGE);
                newUnlocks.push({ type: 'CLASS', id: HeroClass.MAGE, label: 'Mage', desc: 'Starts with XP Potion', level });
            }
            if (!profile.unlockedFeatures.includes('PASSIVE_MIDAS')) {
                profile.unlockedFeatures.push('PASSIVE_MIDAS');
                newUnlocks.push({ type: 'FEATURE', id: 'PASSIVE_MIDAS', label: 'Midas Touch', desc: '5% chance to earn 2x Gold on merge.', level });
            }
        }

        if (level >= 15 && !profile.unlockedPowerups.includes('DRAGON_BREATH')) {
            profile.unlockedPowerups.push('DRAGON_BREATH');
            newUnlocks.push({ type: 'POWERUP', id: 'DRAGON_BREATH', label: 'Passive: Dragon Breath', desc: 'Clears a random row every 60 turns.', level });
        }

        if (level >= 20 && !profile.unlockedPowerups.includes('GOLDEN_EGG')) {
            profile.unlockedPowerups.push('GOLDEN_EGG');
            newUnlocks.push({ type: 'POWERUP', id: 'GOLDEN_EGG', label: 'Passive: Golden Egg', desc: 'Evolves a random tile every 50 turns.', level });
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
