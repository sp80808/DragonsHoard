
import { PlayerProfile, GameState, RunStats, HeroClass, DailyBounty, AbilityType, ItemType, ClassProgress, UnlockReward } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { facebookService } from './facebookService';
import { SHOP_ITEMS, getItemDefinition, MEDALS } from '../constants';
import { generateId } from '../utils/rng';

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

export interface DailyReward {
    day: number;
    gold: number;
    item?: ItemType;
    sp?: number;
}

export const DAILY_REWARDS: DailyReward[] = [
    { day: 1, gold: 100 },
    { day: 2, gold: 200, item: ItemType.XP_POTION },
    { day: 3, gold: 300 },
    { day: 4, gold: 400, item: ItemType.REROLL_TOKEN },
    { day: 5, gold: 500 },
    { day: 6, gold: 600, item: ItemType.GOLDEN_RUNE },
    { day: 7, gold: 1000, sp: 1, item: ItemType.LUCKY_CHARM }
];

export const checkDailyLoginStatus = (profile: PlayerProfile) => {
    const today = new Date().toISOString().split('T')[0];
    const lastLogin = profile.lastLoginRewardDate;
    
    if (lastLogin === today) {
        return { canClaim: false, streak: profile.loginStreak };
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Simple streak check: if last login was yesterday or today (already handled), keep streak.
    // If empty (first time) start at 0 (will become 1).
    let streak = profile.loginStreak;
    if (lastLogin !== yesterdayStr && lastLogin !== '') {
        streak = 0;
    }

    return { canClaim: true, streak };
};

export const claimDailyReward = (state: GameState): Partial<GameState> => {
    const profile = getPlayerProfile();
    const { canClaim, streak } = checkDailyLoginStatus(profile);
    
    if (!canClaim) return {};

    const newStreak = streak + 1;
    const dayIndex = (newStreak - 1) % 7; 
    const reward = DAILY_REWARDS[dayIndex];

    // Update Profile
    profile.loginStreak = newStreak;
    profile.lastLoginRewardDate = new Date().toISOString().split('T')[0];
    
    // Handle Skill Points in Profile directly
    if (reward.sp) {
        const cls = state.selectedClass;
        if (profile.classProgress[cls]) {
            profile.classProgress[cls].skillPoints += reward.sp;
        }
    }
    
    localStorage.setItem('dragons_hoard_profile', JSON.stringify(profile));
    
    // Update Game State
    let newGold = state.gold + reward.gold;
    let newInventory = [...state.inventory];
    let logs = [...state.logs, `Claimed Daily Reward: ${reward.gold} Gold`];

    if (reward.item) {
        const def = getItemDefinition(reward.item);
        if (def) {
            newInventory.push({
                id: generateId(),
                type: reward.item,
                name: def.name,
                description: def.desc,
                icon: def.icon
            });
            logs.push(`Received ${def.name}`);
        }
    }

    return {
        gold: newGold,
        inventory: newInventory,
        logs
    };
}

const generateDailyBounties = (): DailyBounty[] => {
    const shuffled = [...BOUNTY_TEMPLATES].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3).map(t => ({
        ...t,
        id: uuidv4(),
        currentValue: 0,
        isCompleted: false
    }));
};

const getDefaultClassProgress = (): ClassProgress => ({
    xp: 0,
    level: 1,
    skillPoints: 0,
    unlockedNodes: []
});

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
    cascadeTutorialSeen: false,
    bossTutorialCompleted: false,
    seenHints: [],
    activeTilesetId: 'DEFAULT',
    unlockedLore: [],
    earnedMedals: {},
    unlockedPowerups: [],
    skillPoints: 0, // Legacy support
    unlockedSkills: ['ROOT'], // Legacy support
    classProgress: {
        [HeroClass.ADVENTURER]: getDefaultClassProgress()
    },
    loginStreak: 0,
    lastLoginRewardDate: ''
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

    // 4. Validate & Fill missing fields (Migration Logic)
    if (!finalProfile.unlockedClasses) finalProfile.unlockedClasses = [HeroClass.ADVENTURER];
    if (!finalProfile.activeBounties) finalProfile.activeBounties = [];
    
    // Migration: Initialize Class Progress if missing
    if (!finalProfile.classProgress) {
        finalProfile.classProgress = {};
        // Migrate legacy points to Adventurer
        finalProfile.classProgress[HeroClass.ADVENTURER] = {
            xp: 0,
            level: 1,
            skillPoints: finalProfile.skillPoints || 0,
            unlockedNodes: finalProfile.unlockedSkills || []
        };
    }
    
    // Ensure every unlocked class has an entry
    finalProfile.unlockedClasses.forEach(cls => {
        if (!finalProfile.classProgress[cls]) {
            finalProfile.classProgress[cls] = getDefaultClassProgress();
        }
    });

    if (finalProfile.loginStreak === undefined) finalProfile.loginStreak = 0;
    if (!finalProfile.lastLoginRewardDate) finalProfile.lastLoginRewardDate = '';
    if (finalProfile.cascadeTutorialSeen === undefined) finalProfile.cascadeTutorialSeen = false;
    
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
    facebookService.saveData(STORAGE_KEY, p);
};

export const completeTutorial = () => {
    const profile = getPlayerProfile();
    profile.tutorialCompleted = true;
    saveProfile(profile);
};

export const completeCascadeTutorial = () => {
    const profile = getPlayerProfile();
    profile.cascadeTutorialSeen = true;
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
        if (!profile.classProgress[cls]) {
            profile.classProgress[cls] = getDefaultClassProgress();
        }
        saveProfile(profile);
        return true; 
    }
    return false; 
};

const calculateHoardRank = (level: number) => {
    if (level >= 50) return 3; 
    if (level >= 30) return 2; 
    if (level >= 10) return 1; 
    return 0; 
};

export const finalizeRun = (finalState: GameState): { profile: PlayerProfile, leveledUp: boolean, xpGained: number, bountiesCompleted: number, newUnlocks: UnlockReward[] } => {
  const profile = getPlayerProfile();
  
  // Calculate Base XP
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

  // Update Class Specific Progress
  const heroClass = finalState.selectedClass;
  if (!profile.classProgress[heroClass]) {
      profile.classProgress[heroClass] = getDefaultClassProgress();
  }
  const classData = profile.classProgress[heroClass];
  
  // Class gets full XP
  classData.xp += runXp;
  
  // Check for Class Level Up
  while (true) {
      const nextClassXp = getXpForLevel(classData.level);
      if (classData.xp >= nextClassXp) {
          classData.level++;
          classData.skillPoints++; // Award SP
      } else {
          break;
      }
  }

  // Award End-of-Run Medals
  if (finalState.runStats.turnCount >= 500) awardMedal(MEDALS.SURVIVOR.id);
  if (finalState.gold >= 5000) awardMedal(MEDALS.TYCOON.id);
  if (finalState.runStats.powerUpsUsed === 0 && finalState.gameWon) awardMedal(MEDALS.TACTICIAN.id);
  if (finalState.runStats.turnCount >= 100 && finalState.runStats.bossesDefeated === 0) awardMedal(MEDALS.PACIFIST.id);

  // Social: Submit to Global Leaderboard
  facebookService.submitScore('Global_Hoard_Rank', profile.highScore, JSON.stringify({ level: profile.accountLevel }));
  facebookService.postSessionScore(finalState.score);
  facebookService.setStats({ hoard_rank: calculateHoardRank(profile.accountLevel) });

  let leveledUp = false;
  const newUnlocks: UnlockReward[] = [];
  
  if (finalState.runStats.highestTile >= 2048 && !profile.unlockedFeatures.includes('MODE_BOSS_RUSH')) {
      profile.unlockedFeatures.push('MODE_BOSS_RUSH');
      newUnlocks.push({ type: 'FEATURE', id: 'MODE_BOSS_RUSH', label: 'Boss Rush', desc: 'Face the gauntlet.', level: profile.accountLevel });
  }

  // Account Level Logic (Global Unlocks)
  while (true) {
    const nextLevelXp = getXpForLevel(profile.accountLevel);
    if (profile.totalAccountXp >= nextLevelXp) {
        profile.accountLevel += 1;
        leveledUp = true;
        const level = profile.accountLevel;

        if (level >= 3) {
            // MOVED: Cascade Mechanic at Level 3
            if (!profile.unlockedFeatures.includes('CASCADE_MECHANIC')) {
                profile.unlockedFeatures.push('CASCADE_MECHANIC');
                newUnlocks.push({ type: 'FEATURE', id: 'CASCADE_MECHANIC', label: 'Cascade', desc: 'Tiles now fall and merge automatically.', level });
            }
            if (!profile.unlockedPowerups.includes('SCORCH')) {
                profile.unlockedPowerups.push('SCORCH');
                newUnlocks.push({ type: 'POWERUP', id: 'SCORCH', label: 'Passive: Scorch', desc: 'Automatically burns a weak tile every 30 turns.', level });
            }
        }

        if (level >= 4 && !profile.unlockedClasses.includes(HeroClass.WARRIOR)) {
            profile.unlockedClasses.push(HeroClass.WARRIOR);
            if (!profile.classProgress[HeroClass.WARRIOR]) profile.classProgress[HeroClass.WARRIOR] = getDefaultClassProgress();
            newUnlocks.push({ type: 'CLASS', id: HeroClass.WARRIOR, label: 'Warrior', desc: 'Starts with Bomb Scroll', level });
        }
        
        if (level >= 6) {
            if (!profile.unlockedClasses.includes(HeroClass.ROGUE)) {
                profile.unlockedClasses.push(HeroClass.ROGUE);
                if (!profile.classProgress[HeroClass.ROGUE]) profile.classProgress[HeroClass.ROGUE] = getDefaultClassProgress();
                newUnlocks.push({ type: 'CLASS', id: HeroClass.ROGUE, label: 'Rogue', desc: 'Starts with Reroll Token', level });
            }
            if (!profile.unlockedFeatures.includes('HARD_MODE')) {
                profile.unlockedFeatures.push('HARD_MODE');
                newUnlocks.push({ type: 'FEATURE', id: 'HARD_MODE', label: 'Hard Mode', desc: 'Higher risks, higher rewards.', level });
            }
        }

        if (level >= 8 && !profile.unlockedFeatures.includes('TILESET_UNDEAD')) {
            profile.unlockedFeatures.push('TILESET_UNDEAD');
            newUnlocks.push({ type: 'TILESET', id: 'TILESET_UNDEAD', label: 'Necrotic Rot', desc: 'New visual theme unlocked.', level });
        }

        if (level >= 10 && !profile.unlockedFeatures.includes('CODEX_FULL')) {
            profile.unlockedFeatures.push('CODEX_FULL');
            newUnlocks.push({ type: 'FEATURE', id: 'CODEX', label: 'Full Codex', desc: 'View enemy stats and detailed lore.', level });
        }

        if (level >= 15) {
            if (!profile.unlockedClasses.includes(HeroClass.MAGE)) {
                profile.unlockedClasses.push(HeroClass.MAGE);
                if (!profile.classProgress[HeroClass.MAGE]) profile.classProgress[HeroClass.MAGE] = getDefaultClassProgress();
                newUnlocks.push({ type: 'CLASS', id: HeroClass.MAGE, label: 'Mage', desc: 'Starts with XP Potion', level });
            }
            if (!profile.unlockedFeatures.includes('AUTO_COLLECT')) {
                profile.unlockedFeatures.push('AUTO_COLLECT');
                newUnlocks.push({ type: 'FEATURE', id: 'AUTO_COLLECT', label: 'Auto-Collect', desc: 'Gold loot is collected automatically.', level });
            }
        }

        // ... (Keep existing high level unlocks) ...
        if (level >= 20 && !profile.unlockedPowerups.includes('DRAGON_BREATH')) {
            profile.unlockedPowerups.push('DRAGON_BREATH');
            newUnlocks.push({ type: 'POWERUP', id: 'DRAGON_BREATH', label: 'Passive: Dragon Breath', desc: 'Clears a random row every 60 turns.', level });
        }
        if (level >= 20 && !profile.unlockedFeatures.includes('TILESET_INFERNAL')) {
            profile.unlockedFeatures.push('TILESET_INFERNAL');
            newUnlocks.push({ type: 'TILESET', id: 'TILESET_INFERNAL', label: 'Infernal Core', desc: 'Magma visual theme.', level });
        }
        if (level >= 25 && !profile.unlockedPowerups.includes('GOLDEN_EGG')) {
            profile.unlockedPowerups.push('GOLDEN_EGG');
            newUnlocks.push({ type: 'POWERUP', id: 'GOLDEN_EGG', label: 'Passive: Golden Egg', desc: 'Evolves a random tile every 50 turns.', level });
        }
        if (level >= 30 && !profile.unlockedFeatures.includes('TILESET_AQUATIC')) {
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
            newUnlocks.push({ type: 'TILESET', id: 'TILESET_CELESTIAL', label: 'Divine Light', desc: 'Angels and holy entities.', level });
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
