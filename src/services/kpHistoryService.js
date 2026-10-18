import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

import { db, isFirebaseConfigured } from "../firebase/config";

import * as mockStore from "./mockStorage";

/**
 * ============================================================
 * KP HISTORY SERVICE
 * ============================================================
 *
 * Stores and retrieves all Knowledge Point (KP) transactions.
 *
 * Transaction types:
 * - DOUBT_STAKE
 * - SOLVER_REWARD
 * - ACHIEVEMENT_REWARD
 * - STORE_REDEMPTION
 * - BONUS
 * - REFUND
 *
 * Amount:
 * - Positive  -> KP earned
 * - Negative  -> KP spent
 */

/**
 * ------------------------------------------------------------
 * Transaction Types
 * ------------------------------------------------------------
 */
export const KP_TRANSACTION_TYPES = {
  DOUBT_STAKE: "DOUBT_STAKE",
  SOLVER_REWARD: "SOLVER_REWARD",
  ACHIEVEMENT_REWARD: "ACHIEVEMENT_REWARD",
  STORE_REDEMPTION: "STORE_REDEMPTION",
  BONUS: "BONUS",
  REFUND: "REFUND",
};

/**
 * ------------------------------------------------------------
 * Add KP Transaction
 * ------------------------------------------------------------
 *
 * Example:
 *
 * await addKPTransaction({
 *   userId: user.uid,
 *   type: KP_TRANSACTION_TYPES.DOUBT_STAKE,
 *   amount: -20,
 *   title: "Doubt Raised",
 *   description: "20 KP staked on a Mathematics doubt",
 *   doubtId: doubt.id,
 *   balanceAfter: 80
 * });
 */
export const addKPTransaction = async ({
  userId,
  type,
  amount,
  title,
  description = "",
  doubtId = null,
  balanceAfter = null,
  metadata = {},
}) => {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  if (!type) {
    throw new Error("Transaction type is required.");
  }

  if (!Number.isFinite(Number(amount)) || Number(amount) === 0) {
    throw new Error("Transaction amount must be a non-zero number.");
  }

  const transactionData = {
    userId,
    type,
    amount: Number(amount),
    title: title || "KP Transaction",
    description,
    doubtId,
    balanceAfter:
      balanceAfter !== null && balanceAfter !== undefined
        ? Number(balanceAfter)
        : null,
    metadata,
    createdAt: serverTimestamp(),
  };

  /**
   * ----------------------------------------------------------
   * Firebase Mode
   * ----------------------------------------------------------
   */
  if (isFirebaseConfigured && db) {
    try {
      const historyRef = collection(db, "kpTransactions");

      const docRef = await addDoc(historyRef, transactionData);

      return {
        success: true,
        id: docRef.id,
        ...transactionData,
      };
    } catch (error) {
      console.error("❌ Failed to save KP transaction:", error);
      throw error;
    }
  }

  /**
   * ----------------------------------------------------------
   * Demo / Mock Mode
   * ----------------------------------------------------------
   */
  try {
    const transaction = {
      id: `kp-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      ...transactionData,
      createdAt: new Date(),
    };

    if (mockStore?.addKPTransaction) {
      mockStore.addKPTransaction(transaction);
    } else {
      /**
       * Fallback local storage
       */
      const existing = JSON.parse(
        localStorage.getItem("kpTransactions") || "[]"
      );

      existing.push(transaction);

      localStorage.setItem(
        "kpTransactions",
        JSON.stringify(existing)
      );
    }

    return {
      success: true,
      ...transaction,
    };
  } catch (error) {
    console.error("❌ Failed to save mock KP transaction:", error);
    throw error;
  }
};

/**
 * ------------------------------------------------------------
 * Get User KP History
 * ------------------------------------------------------------
 *
 * Returns latest KP transactions for a user.
 */
export const getKPHistory = async (userId, maxTransactions = 100) => {
  if (!userId) {
    return [];
  }

  /**
   * ----------------------------------------------------------
   * Firebase Mode
   * ----------------------------------------------------------
   */
  if (isFirebaseConfigured && db) {
    try {
      const historyRef = collection(db, "kpTransactions");

      const historyQuery = query(
        historyRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(maxTransactions)
      );

      const snapshot = await getDocs(historyQuery);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("❌ Failed to fetch KP history:", error);

      /**
       * Firestore can sometimes require an index for
       * where + orderBy queries.
       *
       * Try a simpler query as fallback.
       */
      try {
        const fallbackQuery = query(
          collection(db, "kpTransactions"),
          where("userId", "==", userId),
          limit(maxTransactions)
        );

        const fallbackSnapshot = await getDocs(fallbackQuery);

        const transactions = fallbackSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        return transactions.sort((a, b) => {
          const dateA = getTransactionDate(a);
          const dateB = getTransactionDate(b);

          return dateB - dateA;
        });
      } catch (fallbackError) {
        console.error(
          "❌ KP history fallback also failed:",
          fallbackError
        );

        return [];
      }
    }
  }

  /**
   * ----------------------------------------------------------
   * Demo / Mock Mode
   * ----------------------------------------------------------
   */
  try {
    if (mockStore?.getKPTransactions) {
      const transactions = mockStore.getKPTransactions(userId);

      return Array.isArray(transactions)
        ? transactions
            .sort(
              (a, b) =>
                getTransactionDate(b) - getTransactionDate(a)
            )
            .slice(0, maxTransactions)
        : [];
    }

    const stored = JSON.parse(
      localStorage.getItem("kpTransactions") || "[]"
    );

    return stored
      .filter((transaction) => transaction.userId === userId)
      .sort(
        (a, b) =>
          getTransactionDate(b) - getTransactionDate(a)
      )
      .slice(0, maxTransactions);
  } catch (error) {
    console.error("❌ Failed to read mock KP history:", error);

    return [];
  }
};

/**
 * ------------------------------------------------------------
 * Get Transaction Date
 * ------------------------------------------------------------
 */
export const getTransactionDate = (transaction) => {
  if (!transaction) {
    return 0;
  }

  const createdAt = transaction.createdAt;

  /**
   * Firestore Timestamp
   */
  if (createdAt?.toDate) {
    return createdAt.toDate().getTime();
  }

  /**
   * JavaScript Date
   */
  if (createdAt instanceof Date) {
    return createdAt.getTime();
  }

  /**
   * Number timestamp
   */
  if (typeof createdAt === "number") {
    return createdAt;
  }

  /**
   * String date
   */
  if (typeof createdAt === "string") {
    const timestamp = new Date(createdAt).getTime();

    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  return 0;
};

/**
 * ------------------------------------------------------------
 * Format Transaction Date
 * ------------------------------------------------------------
 */
export const formatTransactionDate = (transaction) => {
  const timestamp = getTransactionDate(transaction);

  if (!timestamp) {
    return "Just now";
  }

  return new Date(timestamp).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * ------------------------------------------------------------
 * Get Transaction Label
 * ------------------------------------------------------------
 */
export const getTransactionLabel = (type) => {
  switch (type) {
    case KP_TRANSACTION_TYPES.DOUBT_STAKE:
      return "Doubt Stake";

    case KP_TRANSACTION_TYPES.SOLVER_REWARD:
      return "Solver Reward";

    case KP_TRANSACTION_TYPES.ACHIEVEMENT_REWARD:
      return "Achievement Reward";

    case KP_TRANSACTION_TYPES.STORE_REDEMPTION:
      return "Store Redemption";

    case KP_TRANSACTION_TYPES.BONUS:
      return "Bonus";

    case KP_TRANSACTION_TYPES.REFUND:
      return "Refund";

    default:
      return "KP Transaction";
  }
};

/**
 * ------------------------------------------------------------
 * Check Whether KP Was Earned
 * ------------------------------------------------------------
 */
export const isKPEarned = (amount) => {
  return Number(amount) > 0;
};

/**
 * ------------------------------------------------------------
 * Check Whether KP Was Spent
 * ------------------------------------------------------------
 */
export const isKPSpent = (amount) => {
  return Number(amount) < 0;
};

/**
 * ------------------------------------------------------------
 * Get Transaction Icon
 * ------------------------------------------------------------
 */
export const getTransactionIcon = (type) => {
  switch (type) {
    case KP_TRANSACTION_TYPES.DOUBT_STAKE:
      return "🎯";

    case KP_TRANSACTION_TYPES.SOLVER_REWARD:
      return "🏆";

    case KP_TRANSACTION_TYPES.ACHIEVEMENT_REWARD:
      return "🏅";

    case KP_TRANSACTION_TYPES.STORE_REDEMPTION:
      return "🛒";

    case KP_TRANSACTION_TYPES.BONUS:
      return "🎁";

    case KP_TRANSACTION_TYPES.REFUND:
      return "↩️";

    default:
      return "💰";
  }
};

/**
 * ------------------------------------------------------------
 * Get Transaction Summary
 * ------------------------------------------------------------
 */
export const getKPHistorySummary = (transactions = []) => {
  let totalEarned = 0;
  let totalSpent = 0;

  transactions.forEach((transaction) => {
    const amount = Number(transaction.amount) || 0;

    if (amount > 0) {
      totalEarned += amount;
    } else if (amount < 0) {
      totalSpent += Math.abs(amount);
    }
  });

  return {
    totalEarned,
    totalSpent,
    transactionCount: transactions.length,
  };
};

/**
 * ------------------------------------------------------------
 * Get Recent KP Transactions
 * ------------------------------------------------------------
 */
export const getRecentKPTransactions = async (
  userId,
  count = 10
) => {
  return getKPHistory(userId, count);
};

/**
 * ------------------------------------------------------------
 * Get Transactions For A Doubt
 * ------------------------------------------------------------
 */
export const getDoubtKPTransactions = async (doubtId) => {
  if (!doubtId) {
    return [];
  }

  if (isFirebaseConfigured && db) {
    try {
      const historyRef = collection(db, "kpTransactions");

      const historyQuery = query(
        historyRef,
        where("doubtId", "==", doubtId),
        limit(100)
      );

      const snapshot = await getDocs(historyQuery);

      const transactions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return transactions.sort(
        (a, b) =>
          getTransactionDate(a) - getTransactionDate(b)
      );
    } catch (error) {
      console.error(
        "❌ Failed to fetch doubt KP transactions:",
        error
      );

      return [];
    }
  }

  try {
    const stored = JSON.parse(
      localStorage.getItem("kpTransactions") || "[]"
    );

    return stored
      .filter((transaction) => transaction.doubtId === doubtId)
      .sort(
        (a, b) =>
          getTransactionDate(a) - getTransactionDate(b)
      );
  } catch (error) {
    console.error(
      "❌ Failed to read doubt KP transactions:",
      error
    );

    return [];
  }
};