// src/services/progressService.js

import {
  doc,
  runTransaction,
  serverTimestamp
} from "firebase/firestore";

import {
  db,
  isFirebaseConfigured
} from "../firebase/config";


// ============================================================
// XP CONFIGURATION
// ============================================================

export const XP_REWARDS = {
  RAISE_DOUBT: 10,
  SOLVE_DOUBT: 50,
  FIVE_STAR: 20,
  ACHIEVEMENT: 100
};


// ============================================================
// LEVEL CONFIGURATION
// ============================================================

export const LEVELS = [
  {
    level: 1,
    name: "New Learner",
    requiredXP: 0
  },
  {
    level: 2,
    name: "Curious Learner",
    requiredXP: 100
  },
  {
    level: 3,
    name: "Active Learner",
    requiredXP: 250
  },
  {
    level: 4,
    name: "Peer Helper",
    requiredXP: 500
  },
  {
    level: 5,
    name: "Knowledge Sharer",
    requiredXP: 850
  },
  {
    level: 6,
    name: "Rising Mentor",
    requiredXP: 1300
  },
  {
    level: 7,
    name: "Community Helper",
    requiredXP: 1850
  },
  {
    level: 8,
    name: "Learning Champion",
    requiredXP: 2500
  },
  {
    level: 9,
    name: "Expert Mentor",
    requiredXP: 3250
  },
  {
    level: 10,
    name: "Peer-Earn Master",
    requiredXP: 4000
  }
];


// ============================================================
// GET LEVEL FROM XP
// ============================================================

export const getLevelFromXP = (xp = 0) => {
  const numericXP = Math.max(
    0,
    Number(xp) || 0
  );

  let currentLevel = LEVELS[0];

  for (const level of LEVELS) {
    if (numericXP >= level.requiredXP) {
      currentLevel = level;
    } else {
      break;
    }
  }

  return currentLevel;
};


// ============================================================
// GET NEXT LEVEL
// ============================================================

export const getNextLevel = (xp = 0) => {
  const numericXP = Math.max(
    0,
    Number(xp) || 0
  );

  const currentLevel = getLevelFromXP(
    numericXP
  );

  const nextLevel = LEVELS.find(
    (level) =>
      level.level >
      currentLevel.level
  );

  return nextLevel || null;
};


// ============================================================
// GET LEVEL PROGRESS
// ============================================================

export const getLevelProgress = (xp = 0) => {
  const numericXP = Math.max(
    0,
    Number(xp) || 0
  );

  const currentLevel = getLevelFromXP(
    numericXP
  );

  const nextLevel = getNextLevel(
    numericXP
  );

  // Max level reached
  if (!nextLevel) {
    return {
      currentLevel: currentLevel.level,
      levelName: currentLevel.name,
      currentXP: numericXP,
      requiredXP: currentLevel.requiredXP,
      nextLevelXP: null,
      progressXP: 0,
      progressPercent: 100,
      isMaxLevel: true
    };
  }

  const levelStartXP =
    currentLevel.requiredXP;

  const levelEndXP =
    nextLevel.requiredXP;

  const xpInsideLevel =
    numericXP - levelStartXP;

  const xpRequiredForLevel =
    levelEndXP - levelStartXP;

  const progressPercent =
    xpRequiredForLevel > 0
      ? Math.min(
          100,
          Math.round(
            (
              xpInsideLevel /
              xpRequiredForLevel
            ) *
              100
          )
        )
      : 0;

  return {
    currentLevel:
      currentLevel.level,

    levelName:
      currentLevel.name,

    currentXP:
      numericXP,

    requiredXP:
      currentLevel.requiredXP,

    nextLevelXP:
      nextLevel.requiredXP,

    progressXP:
      xpInsideLevel,

    progressPercent,

    isMaxLevel: false
  };
};


// ============================================================
// ADD XP
// ============================================================

export const addXP = async (
  userId,
  amount,
  reason = "Activity"
) => {
  if (!userId) {
    throw new Error(
      "User ID is required to add XP."
    );
  }

  const numericAmount =
    Number(amount);

  if (
    !Number.isFinite(
      numericAmount
    ) ||
    numericAmount <= 0
  ) {
    throw new Error(
      "XP amount must be greater than 0."
    );
  }

  // ==========================================================
  // FIREBASE
  // ==========================================================

  if (
    isFirebaseConfigured &&
    db
  ) {
    const userRef = doc(
      db,
      "users",
      userId
    );

    const result =
      await runTransaction(
        db,
        async (transaction) => {

          // --------------------------------------------------
          // READ
          // --------------------------------------------------

          const userSnapshot =
            await transaction.get(
              userRef
            );

          const userData =
            userSnapshot.exists()
              ? userSnapshot.data()
              : {};

          const oldXP =
            Number(
              userData.xp ?? 0
            );

          const oldLevel =
            getLevelFromXP(
              oldXP
            );

          const newXP =
            oldXP +
            numericAmount;

          const newLevel =
            getLevelFromXP(
              newXP
            );

          // --------------------------------------------------
          // WRITE
          // --------------------------------------------------

          transaction.set(
            userRef,
            {
              xp: newXP,

              level:
                newLevel.level,

              levelName:
                newLevel.name,

              updatedAt:
                serverTimestamp()
            },
            {
              merge: true
            }
          );

          return {
            success: true,

            userId,

            xpAdded:
              numericAmount,

            previousXP:
              oldXP,

            newXP,

            previousLevel:
              oldLevel.level,

            newLevel:
              newLevel.level,

            levelName:
              newLevel.name,

            levelUp:
              newLevel.level >
              oldLevel.level,

            reason
          };
        }
      );

    return result;
  }

  // ==========================================================
  // MOCK MODE
  // ==========================================================

  console.warn(
    "Firebase is not configured. XP was not saved.",
    {
      userId,
      amount: numericAmount,
      reason
    }
  );

  return {
    success: false,
    userId,
    xpAdded: numericAmount,
    reason
  };
};


// ============================================================
// GET USER PROGRESS
// ============================================================

export const getUserProgress = (
  userProfile = {}
) => {
  const xp =
    Number(
      userProfile.xp ?? 0
    );

  const level =
    getLevelFromXP(xp);

  const progress =
    getLevelProgress(xp);

  return {
    xp,

    level:
      level.level,

    levelName:
      level.name,

    progressPercent:
      progress.progressPercent,

    currentLevelXP:
      progress.progressXP,

    nextLevelXP:
      progress.nextLevelXP,

    isMaxLevel:
      progress.isMaxLevel
  };
};


// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  XP_REWARDS,
  LEVELS,
  getLevelFromXP,
  getNextLevel,
  getLevelProgress,
  addXP,
  getUserProgress
};