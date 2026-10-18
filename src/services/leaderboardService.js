// src/services/leaderboardService.js

import {
  collection,
  getDocs,
  query,
  orderBy,
  limit
} from "firebase/firestore";

import {
  db,
  isFirebaseConfigured
} from "../firebase/config";

// ============================================================
// AVATAR SYSTEM
// Avatar automatically changes according to user's level
// ============================================================

export const getLevelAvatar = (level = 1) => {
  const numericLevel = Number(level) || 1;

  if (numericLevel >= 10) {
    return {
      emoji: "👑",
      name: "Peer-Earn Legend"
    };
  }

  if (numericLevel >= 9) {
    return {
      emoji: "🏆",
      name: "Master Mentor"
    };
  }

  if (numericLevel >= 7) {
    return {
      emoji: "⚡",
      name: "Expert Helper"
    };
  }

  if (numericLevel >= 5) {
    return {
      emoji: "🧠",
      name: "Knowledge Seeker"
    };
  }

  if (numericLevel >= 3) {
    return {
      emoji: "📘",
      name: "Active Learner"
    };
  }

  return {
    emoji: "🌱",
    name: "Beginner"
  };
};

// ============================================================
// GET AVATAR
// ============================================================

export const getUserAvatar = (user = {}) => {
  const level = Number(user.level ?? 1);

  return getLevelAvatar(level);
};

// ============================================================
// GET LEADERBOARD
// ============================================================

export const getLeaderboard = async (maxUsers = 50) => {
  if (!isFirebaseConfigured || !db) {
    console.warn(
      "Firebase is not configured. Leaderboard cannot be loaded."
    );

    return [];
  }

  try {
    const usersRef = collection(db, "users");

    const leaderboardQuery = query(
      usersRef,
      orderBy("xp", "desc"),
      limit(maxUsers)
    );

    const snapshot = await getDocs(leaderboardQuery);

    const users = snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();

      const level = Number(data.level ?? 1);
      const xp = Number(data.xp ?? 0);
      const totalSolved = Number(
        data.totalSolved ?? 0
      );
      const reputation = Number(
        data.reputation ?? 0
      );
      const kpBalance = Number(
        data.kpBalance ?? 0
      );

      const avatar = getLevelAvatar(level);

      return {
        id: docSnapshot.id,

        name:
          data.name ||
          data.displayName ||
          "Peer Learner",

        email: data.email || "",

        avatar: avatar.emoji,
        avatarName: avatar.name,

        level,
        levelName:
          data.levelName || avatar.name,

        xp,

        totalSolved,

        reputation,

        kpBalance,

        photoURL: null
      };
    });

    // ========================================================
    // EXTRA SORTING
    // If XP is same:
    // 1. More solved doubts
    // 2. Higher reputation
    // ========================================================

    users.sort((a, b) => {
      if (b.xp !== a.xp) {
        return b.xp - a.xp;
      }

      if (b.totalSolved !== a.totalSolved) {
        return b.totalSolved - a.totalSolved;
      }

      return b.reputation - a.reputation;
    });

    // ========================================================
    // ADD RANK
    // ========================================================

    return users.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

  } catch (error) {
    console.error(
      "❌ Failed to load leaderboard:",
      error
    );

    return [];
  }
};

// ============================================================
// GET TOP 3 USERS
// ============================================================

export const getTopThreeUsers = async () => {
  const leaderboard = await getLeaderboard(3);

  return leaderboard;
};

// ============================================================
// GET CURRENT USER RANK
// ============================================================

export const getUserRank = async (userId) => {
  if (!userId) {
    return null;
  }

  const leaderboard = await getLeaderboard(100);

  const user = leaderboard.find(
    (item) => item.id === userId
  );

  return user
    ? {
        rank: user.rank,
        xp: user.xp,
        level: user.level,
        levelName: user.levelName
      }
    : null;
};

// ============================================================
// EXPORT
// ============================================================

export default {
  getLevelAvatar,
  getUserAvatar,
  getLeaderboard,
  getTopThreeUsers,
  getUserRank
};