// src/services/achievementService.js

import {
  XP_REWARDS,
  getLevelFromXP
} from "./progressService";

// ============================================================
// ACHIEVEMENT CONFIGURATION
// ============================================================

export const ACHIEVEMENTS = [
  {
    id: "first_step",
    title: "First Step",
    description: "Raise your first doubt.",
    icon: "🌱",
    category: "Learning",
    target: 1,
    rewardXP: XP_REWARDS.ACHIEVEMENT,
    condition: (stats) => stats.doubtsRaised >= 1,
    progress: (stats) => Math.min(stats.doubtsRaised, 1)
  },

  {
    id: "curious_mind",
    title: "Curious Mind",
    description: "Raise 5 doubts.",
    icon: "💡",
    category: "Learning",
    target: 5,
    rewardXP: XP_REWARDS.ACHIEVEMENT,
    condition: (stats) => stats.doubtsRaised >= 5,
    progress: (stats) => Math.min(stats.doubtsRaised, 5)
  },

  {
    id: "first_helper",
    title: "First Helper",
    description: "Successfully solve your first doubt.",
    icon: "🤝",
    category: "Helping",
    target: 1,
    rewardXP: XP_REWARDS.ACHIEVEMENT,
    condition: (stats) => stats.totalSolved >= 1,
    progress: (stats) => Math.min(stats.totalSolved, 1)
  },

  {
    id: "knowledge_sharer",
    title: "Knowledge Sharer",
    description: "Successfully solve 10 doubts.",
    icon: "🧠",
    category: "Helping",
    target: 10,
    rewardXP: XP_REWARDS.ACHIEVEMENT,
    condition: (stats) => stats.totalSolved >= 10,
    progress: (stats) => Math.min(stats.totalSolved, 10)
  },

  {
    id: "five_star_helper",
    title: "Five Star Helper",
    description: "Receive your first completed 5-star rating.",
    icon: "⭐",
    category: "Recognition",
    target: 1,
    rewardXP: XP_REWARDS.ACHIEVEMENT,
    condition: (stats) => stats.fiveStarRatings >= 1,
    progress: (stats) => Math.min(stats.fiveStarRatings, 1)
  },

  {
    id: "top_helper",
    title: "Top Helper",
    description: "Successfully solve 25 doubts.",
    icon: "🏆",
    category: "Helping",
    target: 25,
    rewardXP: XP_REWARDS.ACHIEVEMENT,
    condition: (stats) => stats.totalSolved >= 25,
    progress: (stats) => Math.min(stats.totalSolved, 25)
  },

  {
    id: "consistent_learner",
    title: "Consistent Learner",
    description: "Reach 500 XP.",
    icon: "🔥",
    category: "Progress",
    target: 500,
    rewardXP: XP_REWARDS.ACHIEVEMENT,
    condition: (stats) => stats.xp >= 500,
    progress: (stats) => Math.min(stats.xp, 500)
  },

  {
    id: "peer_earn_master",
    title: "Peer-Earn Master",
    description: "Reach Level 10.",
    icon: "👑",
    category: "Progress",
    target: 10,
    rewardXP: XP_REWARDS.ACHIEVEMENT,
    condition: (stats) => stats.level >= 10,
    progress: (stats) => Math.min(stats.level, 10)
  }
];

// ============================================================
// DEFAULT USER STATS
// ============================================================

export const getAchievementStats = (userData = {}) => {
  return {
    doubtsRaised: Number(userData.doubtsRaised ?? 0),
    totalSolved: Number(userData.totalSolved ?? 0),
    fiveStarRatings: Number(userData.fiveStarRatings ?? 0),
    xp: Number(userData.xp ?? 0),
    level: Number(userData.level ?? 1)
  };
};

// ============================================================
// GET UNLOCKED ACHIEVEMENT IDS
// ============================================================

export const getUnlockedAchievementIds = (
  achievements = {}
) => {
  if (!achievements) {
    return [];
  }

  // New format:
  // {
  //   first_step: {...},
  //   first_helper: {...}
  // }

  if (
    !Array.isArray(achievements) &&
    typeof achievements === "object"
  ) {
    return Object.keys(achievements);
  }

  // Backward-compatible array support
  if (Array.isArray(achievements)) {
    return achievements
      .map((achievement) => {
        if (typeof achievement === "string") {
          return achievement;
        }

        return achievement?.id;
      })
      .filter(Boolean);
  }

  return [];
};

// ============================================================
// GET ACHIEVEMENT BY ID
// ============================================================

export const getAchievementById = (achievementId) => {
  return ACHIEVEMENTS.find(
    (achievement) => achievement.id === achievementId
  ) || null;
};

// ============================================================
// GET ACHIEVEMENT PROGRESS
// ============================================================

export const getAchievementProgress = (
  achievement,
  userData = {}
) => {
  if (!achievement) {
    return {
      current: 0,
      target: 0,
      percentage: 0,
      unlocked: false
    };
  }

  const stats = getAchievementStats(userData);

  const current = Number(
    achievement.progress(stats) || 0
  );

  const target = Number(
    achievement.target || 0
  );

  const percentage =
    target > 0
      ? Math.min(
          100,
          Math.round((current / target) * 100)
        )
      : 0;

  const unlocked = achievement.condition(stats);

  return {
    current,
    target,
    percentage,
    unlocked
  };
};

// ============================================================
// CHECK WHICH ACHIEVEMENTS ARE NEWLY UNLOCKED
// ============================================================

export const getNewlyUnlockedAchievements = (
  userData = {}
) => {
  const stats = getAchievementStats(userData);

  const unlockedIds =
    getUnlockedAchievementIds(
      userData.achievements
    );

  return ACHIEVEMENTS.filter((achievement) => {
    const alreadyUnlocked =
      unlockedIds.includes(achievement.id);

    const conditionMet =
      achievement.condition(stats);

    return (
      !alreadyUnlocked &&
      conditionMet
    );
  });
};

// ============================================================
// CREATE ACHIEVEMENT RECORD
// ============================================================

export const createAchievementRecord = (
  achievement,
  timestamp = null
) => {
  return {
    id: achievement.id,
    title: achievement.title,
    description: achievement.description,
    icon: achievement.icon,
    category: achievement.category,
    rewardXP: achievement.rewardXP,
    unlockedAt: timestamp
  };
};

// ============================================================
// CALCULATE ACHIEVEMENT UPDATE
// ============================================================
//
// IMPORTANT:
// This function does NOT perform a Firestore transaction.
// It only calculates what should be written.
//
// This makes it safe to use INSIDE an existing Firestore
// transaction such as createDoubt() or resolveDoubt().
//
// ============================================================

export const calculateAchievementUpdate = (
  userData = {},
  timestamp = null
) => {
  const stats = getAchievementStats(userData);

  const currentAchievements =
    userData.achievements &&
    typeof userData.achievements === "object" &&
    !Array.isArray(userData.achievements)
      ? {
          ...userData.achievements
        }
      : {};

  const newlyUnlocked =
    getNewlyUnlockedAchievements(userData);

  if (newlyUnlocked.length === 0) {
    return {
      unlockedAchievements: [],
      newlyUnlockedAchievements: [],
      achievementXP: 0,
      achievements: currentAchievements,
      xp: stats.xp,
      level: stats.level,
      levelName: getLevelFromXP(stats.xp).name,
      achievementUnlocked: false
    };
  }

  let achievementXP = 0;

  for (const achievement of newlyUnlocked) {
    achievementXP += Number(
      achievement.rewardXP || 0
    );

    currentAchievements[achievement.id] =
      createAchievementRecord(
        achievement,
        timestamp
      );
  }

  const newXP =
    stats.xp + achievementXP;

  const newLevel =
    getLevelFromXP(newXP);

  return {
    unlockedAchievements: newlyUnlocked.map(
      (achievement) => achievement.id
    ),

    newlyUnlockedAchievements:
      newlyUnlocked.map((achievement) =>
        createAchievementRecord(
          achievement,
          timestamp
        )
      ),

    achievementXP,

    achievements: currentAchievements,

    xp: newXP,

    level: newLevel.level,

    levelName: newLevel.name,

    achievementUnlocked: true
  };
};

// ============================================================
// GET ALL ACHIEVEMENTS WITH USER PROGRESS
// ============================================================

export const getAllAchievementsWithProgress = (
  userData = {}
) => {
  const unlockedIds =
    getUnlockedAchievementIds(
      userData.achievements
    );

  return ACHIEVEMENTS.map((achievement) => {
    const progress =
      getAchievementProgress(
        achievement,
        userData
      );

    return {
      ...achievement,

      ...progress,

      isUnlocked:
        unlockedIds.includes(
          achievement.id
        )
    };
  });
};

// ============================================================
// GET ONLY UNLOCKED ACHIEVEMENTS
// ============================================================

export const getUnlockedAchievements = (
  userData = {}
) => {
  const unlockedIds =
    getUnlockedAchievementIds(
      userData.achievements
    );

  return ACHIEVEMENTS.filter(
    (achievement) =>
      unlockedIds.includes(
        achievement.id
      )
  );
};

// ============================================================
// GET LOCKED ACHIEVEMENTS
// ============================================================

export const getLockedAchievements = (
  userData = {}
) => {
  const unlockedIds =
    getUnlockedAchievementIds(
      userData.achievements
    );

  return ACHIEVEMENTS.filter(
    (achievement) =>
      !unlockedIds.includes(
        achievement.id
      )
  );
};

// ============================================================
// ACHIEVEMENT SUMMARY
// ============================================================

export const getAchievementSummary = (
  userData = {}
) => {
  const unlocked =
    getUnlockedAchievements(
      userData
    );

  const total =
    ACHIEVEMENTS.length;

  return {
    unlocked: unlocked.length,
    total,
    remaining:
      Math.max(
        0,
        total - unlocked.length
      ),

    percentage:
      total > 0
        ? Math.round(
            (unlocked.length / total) *
              100
          )
        : 0
  };
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  ACHIEVEMENTS,

  getAchievementStats,

  getUnlockedAchievementIds,

  getAchievementById,

  getAchievementProgress,

  getNewlyUnlockedAchievements,

  createAchievementRecord,

  calculateAchievementUpdate,

  getAllAchievementsWithProgress,

  getUnlockedAchievements,

  getLockedAchievements,

  getAchievementSummary
};