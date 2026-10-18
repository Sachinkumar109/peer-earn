// src/services/doubtService.js

import {
  collection,
  doc,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  runTransaction,
  serverTimestamp
} from "firebase/firestore";

import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";

import {
  db,
  storage,
  isFirebaseConfigured
} from "../firebase/config";

import * as mockStore from "./mockStorage";

import {
  XP_REWARDS,
  getLevelFromXP
} from "./progressService";

import {
  calculateAchievementUpdate
} from "./achievementService";

import {
  KP_TRANSACTION_TYPES
} from "./kpHistoryService";

// ============================================================
// CONSTANTS
// ============================================================

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 30 * 1024 * 1024;

// ============================================================
// HELPERS
// ============================================================

const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

const getCreatedTime = (doubt) => {
  if (!doubt?.createdAt) {
    return 0;
  }

  if (typeof doubt.createdAt.toDate === "function") {
    return doubt.createdAt.toDate().getTime();
  }

  if (typeof doubt.createdAt.toMillis === "function") {
    return doubt.createdAt.toMillis();
  }

  if (doubt.createdAt.seconds !== undefined) {
    return Number(doubt.createdAt.seconds) * 1000;
  }

  const parsed = new Date(doubt.createdAt).getTime();

  return Number.isNaN(parsed) ? 0 : parsed;
};

const normalizeDoubtId = (doubtId) => {
  if (
    doubtId === undefined ||
    doubtId === null
  ) {
    return "";
  }

  return String(doubtId).trim();
};

// ============================================================
// SMART FEED PRIORITY
// ============================================================

export const getDoubtFeedPriority = (doubt) => {
  const awardedStars = toNumber(
    doubt?.awardedStars,
    0
  );

  const rewardedPoints = toNumber(
    doubt?.rewardedPoints,
    0
  );

  const remainingPoints = toNumber(
    doubt?.remainingPoints ??
      doubt?.stakedPoints ??
      0,
    0
  );

  if (
    doubt?.status === "resolved" ||
    awardedStars >= 5 ||
    remainingPoints <= 0
  ) {
    return 2;
  }

  if (
    awardedStars > 0 ||
    rewardedPoints > 0
  ) {
    return 1;
  }

  return 0;
};

// ============================================================
// SMART FEED SORT
// ============================================================

export const sortDoubtsForFeed = (doubts = []) => {
  return [...doubts].sort((a, b) => {
    const priorityA =
      getDoubtFeedPriority(a);

    const priorityB =
      getDoubtFeedPriority(b);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    return (
      getCreatedTime(b) -
      getCreatedTime(a)
    );
  });
};

// ============================================================
// FILE VALIDATION
// ============================================================

const validateFile = (
  file,
  type = "image"
) => {
  if (!file) {
    return true;
  }

  if (type === "image") {
    if (!file.type?.startsWith("image/")) {
      throw new Error(
        "Please select a valid image file."
      );
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error(
        "Image is too large. Maximum size is 5 MB."
      );
    }
  }

  if (type === "video") {
    if (!file.type?.startsWith("video/")) {
      throw new Error(
        "Please select a valid video file."
      );
    }

    if (file.size > MAX_VIDEO_SIZE) {
      throw new Error(
        "Video is too large. Maximum size is 30 MB."
      );
    }
  }

  return true;
};

// ============================================================
// UPLOAD ATTACHMENT
// ============================================================

const uploadAttachment = async (
  file,
  folder,
  userId
) => {
  if (!file) {
    return null;
  }

  if (!storage) {
    throw new Error(
      "Firebase Storage is not configured."
    );
  }

  const safeName =
    `${Date.now()}_${file.name || "attachment"}`;

  const path =
    `${folder}/${userId || "anonymous"}/${safeName}`;

  const fileRef =
    storageRef(storage, path);

  await uploadBytes(
    fileRef,
    file
  );

  return await getDownloadURL(
    fileRef
  );
};

// ============================================================
// CREATE DOUBT
// ============================================================

export const createDoubt = async (
  userOrPayload,
  maybePayload = null
) => {
  let userProfile;
  let payload;

  if (
    maybePayload &&
    typeof maybePayload === "object"
  ) {
    userProfile =
      userOrPayload || {};

    payload =
      maybePayload || {};
  } else {
    userProfile = {};

    payload =
      userOrPayload || {};
  }

  // ----------------------------------------------------------
  // USER
  // ----------------------------------------------------------

  const askerId =
    payload.askerId ||
    userProfile.uid ||
    userProfile.id ||
    userProfile.userId ||
    "";

  const askerName =
    payload.askerName ||
    userProfile.name ||
    userProfile.displayName ||
    userProfile.fullName ||
    "Student";

  // ----------------------------------------------------------
  // DOUBT
  // ----------------------------------------------------------

  const text =
    typeof payload.text === "string"
      ? payload.text.trim()
      : "";

  const subject =
    payload.subject ||
    "General";

  const classLevel =
    payload.classLevel ||
    userProfile.classLevel ||
    "college";

  // ----------------------------------------------------------
  // KP
  // ----------------------------------------------------------

  const points =
    Number(payload.stakedPoints);

  // ----------------------------------------------------------
  // VALIDATION
  // ----------------------------------------------------------

  if (!text || text.length < 10) {
    throw new Error(
      "Please provide a detailed description of your doubt (minimum 10 characters)."
    );
  }

  if (
    !Number.isFinite(points) ||
    !Number.isInteger(points) ||
    points < 5
  ) {
    throw new Error(
      "Please enter a valid KP stake. Minimum stake is 5 KP."
    );
  }

  const profileBalance =
    Number(
      userProfile.kpBalance ??
      payload.kpBalance ??
      0
    );

  // ==========================================================
  // FIREBASE
  // ==========================================================

  if (
    isFirebaseConfigured &&
    db
  ) {
    const userRef =
      askerId
        ? doc(
            db,
            "users",
            askerId
          )
        : null;

    const doubtRef =
      doc(
        collection(
          db,
          "doubts"
        )
      );

    // --------------------------------------------------------
    // KP HISTORY DOCUMENT
    // --------------------------------------------------------
    //
    // Created before the transaction so the same document
    // can safely be written if Firestore retries the transaction.
    //

    const kpTransactionRef =
      askerId
        ? doc(
            collection(
              db,
              "kpTransactions"
            )
          )
        : null;

    await runTransaction(
      db,
      async (transaction) => {
        let currentBalance =
          profileBalance;

        let currentXP = 0;

        let currentDoubtsRaised = 0;

        let currentAchievements = {};

        // ----------------------------------------------------
        // READ USER
        // ----------------------------------------------------

        if (userRef) {
          const userSnap =
            await transaction.get(
              userRef
            );

          if (userSnap.exists()) {
            const userData =
              userSnap.data();

            currentBalance =
              Number(
                userData.kpBalance ?? 0
              );

            currentXP =
              Number(
                userData.xp ?? 0
              );

            currentDoubtsRaised =
              Number(
                userData.doubtsRaised ?? 0
              );

            currentAchievements =
              userData.achievements &&
              typeof userData.achievements ===
                "object" &&
              !Array.isArray(
                userData.achievements
              )
                ? userData.achievements
                : {};
          }
        }

        // ----------------------------------------------------
        // CHECK BALANCE
        // ----------------------------------------------------

        if (
          !Number.isFinite(
            currentBalance
          ) ||
          currentBalance < points
        ) {
          throw new Error(
            `Insufficient KP balance! You have ${currentBalance} KP, but tried to stake ${points} KP.`
          );
        }

        // ====================================================
        // BASE XP
        // ====================================================

        const xpForRaising =
          Number(
            XP_REWARDS.RAISE_DOUBT ?? 0
          );

        const xpAfterRaise =
          currentXP +
          Math.max(
            0,
            xpForRaising
          );

        const newDoubtsRaised =
          currentDoubtsRaised + 1;

        const baseLevel =
          getLevelFromXP(
            xpAfterRaise
          );

        // ====================================================
        // ACHIEVEMENT CHECK
        // ====================================================

        const achievementResult =
          calculateAchievementUpdate(
            {
              xp: xpAfterRaise,

              level:
                baseLevel.level,

              doubtsRaised:
                newDoubtsRaised,

              totalSolved:
                0,

              fiveStarRatings:
                0,

              achievements:
                currentAchievements
            },
            serverTimestamp()
          );

        // ----------------------------------------------------
        // FINAL XP
        // ----------------------------------------------------

        const finalXP =
          achievementResult.xp;

        const finalLevel =
          getLevelFromXP(
            finalXP
          );

        // ----------------------------------------------------
        // NEW KP BALANCE
        // ----------------------------------------------------

        const newBalance =
          currentBalance -
          points;

        // ----------------------------------------------------
        // USER UPDATE
        // ----------------------------------------------------

        if (userRef) {
          transaction.set(
            userRef,
            {
              kpBalance:
                newBalance,

              xp:
                finalXP,

              level:
                finalLevel.level,

              levelName:
                finalLevel.name,

              doubtsRaised:
                newDoubtsRaised,

              achievements:
                achievementResult.achievements,

              updatedAt:
                serverTimestamp()
            },
            {
              merge: true
            }
          );
        }

        // ----------------------------------------------------
        // CREATE DOUBT
        // ----------------------------------------------------

        transaction.set(
          doubtRef,
          {
            askerId,
            askerName,

            text,
            subject,
            classLevel,

            stakedPoints:
              points,

            remainingPoints:
              points,

            awardedStars: 0,

            rewardedPoints: 0,

            status: "open",

            currentSolverId:
              null,

            currentSolverName:
              null,

            photoUrl:
              typeof payload.photoUrl ===
              "string"
                ? payload.photoUrl
                : null,

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),

            rewardHistory: []
          }
        );

        // ----------------------------------------------------
        // KP TRANSACTION HISTORY
        // ----------------------------------------------------

        if (
          kpTransactionRef &&
          askerId
        ) {
          transaction.set(
            kpTransactionRef,
            {
              userId:
                askerId,

              type:
                KP_TRANSACTION_TYPES.DOUBT_STAKE,

              amount:
                -points,

              title:
                "Doubt Stake",

              description:
                `You staked ${points} KP to raise a ${subject} doubt.`,

              doubtId:
                doubtRef.id,

              balanceAfter:
                newBalance,

              metadata: {
                subject,
                classLevel,
                doubtText:
                  text.slice(0, 120)
              },

              createdAt:
                serverTimestamp()
            }
          );
        }
      }
    );

    return {
      id: doubtRef.id,

      askerId,
      askerName,

      text,
      subject,
      classLevel,

      stakedPoints:
        points,

      remainingPoints:
        points,

      awardedStars: 0,

      rewardedPoints: 0,

      status: "open",

      photoUrl:
        typeof payload.photoUrl ===
        "string"
          ? payload.photoUrl
          : null,

      xpAdded:
        Number(
          XP_REWARDS.RAISE_DOUBT ?? 0
        )
    };
  }

  // ==========================================================
  // MOCK
  // ==========================================================

  if (
    typeof mockStore.createDoubt ===
    "function"
  ) {
    return await mockStore.createDoubt({
      askerId,
      askerName,
      text,
      subject,
      classLevel,
      stakedPoints: points,
      photoUrl:
        typeof payload.photoUrl ===
        "string"
          ? payload.photoUrl
          : null
    });
  }

  throw new Error(
    "No database is configured. Please configure Firebase."
  );
};

// ============================================================
// SUBSCRIBE TO ALL DOUBTS
// ============================================================

export const subscribeToDoubts = (
  filters = {},
  callback
) => {
  if (
    isFirebaseConfigured &&
    db
  ) {
    const doubtsRef =
      collection(
        db,
        "doubts"
      );

    const doubtsQuery =
      query(
        doubtsRef,
        orderBy(
          "createdAt",
          "desc"
        )
      );

    const unsubscribe =
      onSnapshot(
        doubtsQuery,

        (snapshot) => {
          let doubts =
            snapshot.docs.map(
              (document) => ({
                id: document.id,
                ...document.data()
              })
            );

          if (
            filters.subject &&
            filters.subject !== "all"
          ) {
            doubts =
              doubts.filter(
                (doubt) =>
                  String(
                    doubt.subject || ""
                  ).toLowerCase() ===
                  String(
                    filters.subject
                  ).toLowerCase()
              );
          }

          if (
            filters.classLevel &&
            filters.classLevel !== "all"
          ) {
            doubts =
              doubts.filter(
                (doubt) =>
                  String(
                    doubt.classLevel || ""
                  ).toLowerCase() ===
                  String(
                    filters.classLevel
                  ).toLowerCase()
              );
          }

          if (
            filters.status &&
            filters.status !== "all"
          ) {
            doubts =
              doubts.filter(
                (doubt) =>
                  String(
                    doubt.status || "open"
                  ).toLowerCase() ===
                  String(
                    filters.status
                  ).toLowerCase()
              );
          }

          doubts =
            sortDoubtsForFeed(
              doubts
            );

          callback(doubts);
        },

        (error) => {
          console.error(
            "subscribeToDoubts error:",
            error
          );

          callback([]);
        }
      );

    return unsubscribe;
  }

  if (
    typeof mockStore.subscribeToDoubts ===
    "function"
  ) {
    return mockStore.subscribeToDoubts(
      filters,
      callback
    );
  }

  callback([]);

  return () => {};
};

// ============================================================
// SUBSCRIBE TO SINGLE DOUBT
// ============================================================

export const subscribeToDoubt = (
  doubtId,
  callback
) => {
  const cleanDoubtId =
    normalizeDoubtId(doubtId);

  if (!cleanDoubtId) {
    callback(null);
    return () => {};
  }

  if (
    isFirebaseConfigured &&
    db
  ) {
    const doubtRef =
      doc(
        db,
        "doubts",
        cleanDoubtId
      );

    return onSnapshot(
      doubtRef,

      (snapshot) => {
        if (!snapshot.exists()) {
          callback(null);
          return;
        }

        callback({
          id: snapshot.id,
          ...snapshot.data()
        });
      },

      (error) => {
        console.error(
          "subscribeToDoubt error:",
          error
        );

        callback(null);
      }
    );
  }

  if (
    typeof mockStore.subscribeToDoubt ===
    "function"
  ) {
    return mockStore.subscribeToDoubt(
      cleanDoubtId,
      callback
    );
  }

  callback(null);

  return () => {};
};

// ============================================================
// CLAIM DOUBT
// ============================================================

export const claimDoubt = async (
  doubtId,
  solver
) => {
  const cleanDoubtId =
    normalizeDoubtId(doubtId);

  if (!cleanDoubtId) {
    throw new Error(
      "Invalid doubt ID."
    );
  }

  if (!solver) {
    throw new Error(
      "Solver information is required."
    );
  }

  const solverId =
    solver.uid ||
    solver.id ||
    solver.userId ||
    solver.solverId ||
    "";

  const solverName =
    solver.name ||
    solver.displayName ||
    solver.fullName ||
    solver.solverName ||
    "Scholar";

  if (!solverId) {
    throw new Error(
      "Unable to identify the solver."
    );
  }

  // ==========================================================
  // FIREBASE
  // ==========================================================

  if (
    isFirebaseConfigured &&
    db
  ) {
    const doubtRef =
      doc(
        db,
        "doubts",
        cleanDoubtId
      );

    await runTransaction(
      db,
      async (transaction) => {
        const snapshot =
          await transaction.get(
            doubtRef
          );

        if (!snapshot.exists()) {
          throw new Error(
            "Doubt not found."
          );
        }

        const doubt =
          snapshot.data();

        if (
          doubt.status ===
          "resolved"
        ) {
          throw new Error(
            "This doubt has already been resolved."
          );
        }

        const remaining =
          Number(
            doubt.remainingPoints ??
            doubt.stakedPoints ??
            0
          );

        if (remaining <= 0) {
          throw new Error(
            "No reward is remaining for this doubt."
          );
        }

        if (
          doubt.currentSolverId &&
          doubt.currentSolverId !==
            solverId
        ) {
          throw new Error(
            "This doubt is currently being handled by another solver."
          );
        }

        transaction.update(
          doubtRef,
          {
            status:
              "in_progress",

            currentSolverId:
              solverId,

            currentSolverName:
              solverName,

            updatedAt:
              serverTimestamp()
          }
        );
      }
    );

    return {
      success: true,
      doubtId: cleanDoubtId,
      solverId,
      solverName
    };
  }

  // ==========================================================
  // MOCK
  // ==========================================================

  if (
    typeof mockStore.claimDoubt ===
    "function"
  ) {
    return mockStore.claimDoubt(
      cleanDoubtId,
      solver
    );
  }

  throw new Error(
    "Database is not configured."
  );
};

// ============================================================
// SUBSCRIBE TO MESSAGES
// ============================================================

export const subscribeToMessages = (
  doubtId,
  callback
) => {
  const cleanDoubtId =
    normalizeDoubtId(doubtId);

  if (!cleanDoubtId) {
    callback([]);
    return () => {};
  }

  if (
    isFirebaseConfigured &&
    db
  ) {
    const messagesRef =
      collection(
        db,
        "doubts",
        cleanDoubtId,
        "messages"
      );

    const messagesQuery =
      query(
        messagesRef,
        orderBy(
          "createdAt",
          "asc"
        )
      );

    return onSnapshot(
      messagesQuery,

      (snapshot) => {
        const messages =
          snapshot.docs.map(
            (document) => ({
              id: document.id,
              ...document.data()
            })
          );

        callback(messages);
      },

      (error) => {
        console.error(
          "subscribeToMessages error:",
          error
        );

        callback([]);
      }
    );
  }

  if (
    typeof mockStore.subscribeToMessages ===
    "function"
  ) {
    return mockStore.subscribeToMessages(
      cleanDoubtId,
      callback
    );
  }

  callback([]);

  return () => {};
};

// ============================================================
// SEND MESSAGE
// ============================================================

export const sendMessage = async ({
  doubtId,
  senderId,
  senderName,
  text = "",
  photoFile = null,
  videoFile = null
}) => {
  const cleanDoubtId =
    normalizeDoubtId(doubtId);

  if (!cleanDoubtId) {
    console.error(
      "sendMessage received invalid doubtId:",
      doubtId
    );

    throw new Error(
      "Invalid doubt ID."
    );
  }

  const cleanText =
    typeof text === "string"
      ? text.trim()
      : "";

  if (
    !cleanText &&
    !photoFile &&
    !videoFile
  ) {
    throw new Error(
      "Message cannot be empty."
    );
  }

  // ==========================================================
  // FIREBASE
  // ==========================================================

  if (
    isFirebaseConfigured &&
    db
  ) {
    let photoUrl = null;
    let videoUrl = null;

    if (photoFile) {
      validateFile(
        photoFile,
        "image"
      );

      photoUrl =
        await uploadAttachment(
          photoFile,
          "chat-images",
          senderId
        );
    }

    if (videoFile) {
      validateFile(
        videoFile,
        "video"
      );

      videoUrl =
        await uploadAttachment(
          videoFile,
          "chat-videos",
          senderId
        );
    }

    const messagesRef =
      collection(
        db,
        "doubts",
        cleanDoubtId,
        "messages"
      );

    const message = {
      senderId:
        senderId || "",

      senderName:
        senderName || "Student",

      text:
        cleanText,

      photoUrl,
      videoUrl,

      createdAt:
        serverTimestamp()
    };

    const messageRef =
      await addDoc(
        messagesRef,
        message
      );

    return {
      id: messageRef.id,
      ...message
    };
  }

  // ==========================================================
  // MOCK
  // ==========================================================

  if (
    typeof mockStore.sendMessage ===
    "function"
  ) {
    return mockStore.sendMessage({
      doubtId:
        cleanDoubtId,

      senderId,
      senderName,

      text:
        cleanText,

      photoFile,
      videoFile
    });
  }

  throw new Error(
    "Database is not configured."
  );
};

// ============================================================
// RESOLVE DOUBT
// ============================================================

export const resolveDoubt = async (
  doubtId,
  solverId,
  awardedStars
) => {
  const cleanDoubtId =
    normalizeDoubtId(doubtId);

  if (!cleanDoubtId) {
    throw new Error(
      "Invalid doubt ID."
    );
  }

  if (!solverId) {
    throw new Error(
      "Solver ID is required."
    );
  }

  const numericStars =
    Number(awardedStars);

  if (!Number.isFinite(numericStars)) {
    throw new Error(
      "Invalid star rating."
    );
  }

  const newStars =
    Math.max(
      1,
      Math.min(
        5,
        numericStars
      )
    );

  // ==========================================================
  // FIREBASE
  // ==========================================================

  if (
    isFirebaseConfigured &&
    db
  ) {
    const doubtRef =
      doc(
        db,
        "doubts",
        cleanDoubtId
      );

    // --------------------------------------------------------
    // KP REWARD HISTORY DOCUMENT
    // --------------------------------------------------------
    //
    // One document per resolve attempt.
    //
    // The document is only written when rewardThisSolve > 0.
    //
    // Creating the reference before runTransaction means
    // Firestore transaction retries still use the same ID.
    //

    const kpTransactionRef =
      doc(
        collection(
          db,
          "kpTransactions"
        )
      );

    const result =
      await runTransaction(
        db,
        async (transaction) => {

          // ==================================================
          // READ DOUBT
          // ==================================================

          const doubtSnapshot =
            await transaction.get(
              doubtRef
            );

          if (
            !doubtSnapshot.exists()
          ) {
            throw new Error(
              "Doubt not found."
            );
          }

          const doubt =
            doubtSnapshot.data();

          // --------------------------------------------------
          // ALREADY FULLY RESOLVED
          // --------------------------------------------------

          if (
            doubt.status ===
              "resolved" &&
            Number(
              doubt.remainingPoints ??
              0
            ) <= 0
          ) {
            throw new Error(
              "This doubt has already been fully resolved."
            );
          }

          // --------------------------------------------------
          // CURRENT SOLVER
          // --------------------------------------------------

          if (
            doubt.currentSolverId &&
            doubt.currentSolverId !==
              solverId
          ) {
            throw new Error(
              "Only the current solver can resolve this doubt."
            );
          }

          // --------------------------------------------------
          // CURRENT VALUES
          // --------------------------------------------------

          const originalPoints =
            Number(
              doubt.stakedPoints ?? 0
            );

          const currentRewardedPoints =
            Number(
              doubt.rewardedPoints ?? 0
            );

          const currentStars =
            Number(
              doubt.awardedStars ?? 0
            );

          const currentRemaining =
            Number(
              doubt.remainingPoints ??
              (
                originalPoints -
                currentRewardedPoints
              )
            );

          if (
            originalPoints <= 0
          ) {
            throw new Error(
              "Invalid doubt bounty."
            );
          }

          // ==================================================
          // STAR CALCULATION
          // ==================================================

          const finalStars =
            Math.max(
              currentStars,
              newStars
            );

          const targetReward =
            finalStars >= 5
              ? originalPoints
              : Math.floor(
                  (
                    originalPoints *
                    finalStars
                  ) / 5
                );

          // --------------------------------------------------
          // ONLY PAY NEW REWARD
          // --------------------------------------------------

          let rewardThisSolve =
            targetReward -
            currentRewardedPoints;

          rewardThisSolve =
            Math.max(
              0,
              Math.min(
                rewardThisSolve,
                currentRemaining
              )
            );

          const newRewardedPoints =
            currentRewardedPoints +
            rewardThisSolve;

          const newRemainingPoints =
            Math.max(
              0,
              originalPoints -
                newRewardedPoints
            );

          const fullyResolved =
            finalStars >= 5 ||
            newRemainingPoints <= 0;

          const newStatus =
            fullyResolved
              ? "resolved"
              : "open";

          // ==================================================
          // READ SOLVER
          // ==================================================

          const solverRef =
            doc(
              db,
              "users",
              solverId
            );

          const solverSnapshot =
            await transaction.get(
              solverRef
            );

          const solverData =
            solverSnapshot.exists()
              ? solverSnapshot.data()
              : {};

          // ==================================================
          // READ ASKER
          // ==================================================

          let askerRef = null;
          let askerSnapshot = null;

          if (
            fullyResolved &&
            doubt.askerId &&
            doubt.askerId !==
              solverId
          ) {
            askerRef =
              doc(
                db,
                "users",
                doubt.askerId
              );

            askerSnapshot =
              await transaction.get(
                askerRef
              );
          }

          // ==================================================
          // SOLVER CURRENT STATS
          // ==================================================

          const oldSolverKP =
            Number(
              solverData.kpBalance ?? 0
            );

          const oldReputation =
            Number(
              solverData.reputation ?? 0
            );

          const oldTotalSolved =
            Number(
              solverData.totalSolved ?? 0
            );

          const oldXP =
            Number(
              solverData.xp ?? 0
            );

          const oldFiveStarRatings =
            Number(
              solverData.fiveStarRatings ?? 0
            );

          const oldAchievements =
            solverData.achievements &&
            typeof solverData.achievements ===
              "object" &&
            !Array.isArray(
              solverData.achievements
            )
              ? solverData.achievements
              : {};

          // ==================================================
          // BASE XP
          // ==================================================

          const solveXP =
            Number(
              XP_REWARDS.SOLVE_DOUBT ?? 0
            );

          const xpThisSolve =
            rewardThisSolve > 0
              ? solveXP
              : 0;

          const xpAfterSolve =
            oldXP +
            xpThisSolve;

          // ==================================================
          // SOLVE COUNT
          // ==================================================

          const solvedThisTime =
            rewardThisSolve > 0;

          const newTotalSolved =
            oldTotalSolved +
            (
              solvedThisTime
                ? 1
                : 0
            );

          // ==================================================
          // FIVE STAR COUNT
          // ==================================================

          const fiveStarThisTime =
            solvedThisTime &&
            finalStars >= 5;

          const newFiveStarRatings =
            oldFiveStarRatings +
            (
              fiveStarThisTime
                ? 1
                : 0
            );

          // ==================================================
          // BASE LEVEL
          // ==================================================

          const baseLevel =
            getLevelFromXP(
              xpAfterSolve
            );

          // ==================================================
          // ACHIEVEMENT CHECK
          // ==================================================

          const achievementResult =
            calculateAchievementUpdate(
              {
                xp:
                  xpAfterSolve,

                level:
                  baseLevel.level,

                doubtsRaised:
                  Number(
                    solverData.doubtsRaised ?? 0
                  ),

                totalSolved:
                  newTotalSolved,

                fiveStarRatings:
                  newFiveStarRatings,

                achievements:
                  oldAchievements
              },
              serverTimestamp()
            );

          // ==================================================
          // FINAL XP + LEVEL
          // ==================================================

          const newSolverXP =
            achievementResult.xp;

          const newSolverLevel =
            getLevelFromXP(
              newSolverXP
            );

          // ==================================================
          // NEW SOLVER KP BALANCE
          // ==================================================

          const newSolverKP =
            oldSolverKP +
            rewardThisSolve;

          // ==================================================
          // SOLVER UPDATE
          // ==================================================

          const solverUpdate = {
            kpBalance:
              newSolverKP,

            reputation:
              oldReputation +
              (
                rewardThisSolve > 0
                  ? 1
                  : 0
              ),

            xp:
              newSolverXP,

            level:
              newSolverLevel.level,

            levelName:
              newSolverLevel.name,

            totalSolved:
              newTotalSolved,

            fiveStarRatings:
              newFiveStarRatings,

            achievements:
              achievementResult.achievements,

            updatedAt:
              serverTimestamp()
          };

          // ==================================================
          // REWARD HISTORY
          // ==================================================

          const oldHistory =
            Array.isArray(
              doubt.rewardHistory
            )
              ? doubt.rewardHistory
              : [];

          const rewardEntry = {
            solverId,

            stars:
              finalStars,

            points:
              rewardThisSolve,

            rewardedPointsTotal:
              newRewardedPoints,

            remainingPoints:
              newRemainingPoints,

            createdAt:
              new Date().toISOString()
          };

          const rewardHistory = [
            ...oldHistory,
            rewardEntry
          ];

          // ==================================================
          // DOUBT UPDATE
          // ==================================================

          const doubtUpdate = {
            awardedStars:
              finalStars,

            rewardedPoints:
              newRewardedPoints,

            remainingPoints:
              newRemainingPoints,

            status:
              newStatus,

            rewardHistory,

            updatedAt:
              serverTimestamp()
          };

          if (!fullyResolved) {
            doubtUpdate.currentSolverId =
              null;

            doubtUpdate.currentSolverName =
              null;
          }

          if (fullyResolved) {
            doubtUpdate.currentSolverId =
              solverId;
          }

          // ==================================================
          // ASKER UPDATE
          // ==================================================

          let askerUpdate = null;

          if (
            askerSnapshot &&
            askerSnapshot.exists()
          ) {
            const askerData =
              askerSnapshot.data();

            const askerReputation =
              Number(
                askerData.reputation ?? 0
              );

            const totalAccepted =
              Number(
                askerData.totalAccepted ?? 0
              );

            askerUpdate = {
              reputation:
                askerReputation + 1,

              totalAccepted:
                totalAccepted + 1,

              updatedAt:
                serverTimestamp()
            };
          }

          // ==================================================
          // ALL WRITES
          // ==================================================

          transaction.set(
            solverRef,
            solverUpdate,
            {
              merge: true
            }
          );

          transaction.update(
            doubtRef,
            doubtUpdate
          );

          if (
            askerRef &&
            askerUpdate
          ) {
            transaction.update(
              askerRef,
              askerUpdate
            );
          }

          // ==================================================
          // KP TRANSACTION HISTORY
          // ==================================================
          //
          // Only create history when the solver actually
          // receives KP.
          //
          // Example:
          //
          // 20 KP doubt
          // 1 star -> +4 KP
          // 2 stars -> +4 additional KP
          // 5 stars -> remaining KP
          //
          // Each actual reward is recorded separately.
          //

          if (
            rewardThisSolve > 0
          ) {
            transaction.set(
              kpTransactionRef,
              {
                userId:
                  solverId,

                type:
                  KP_TRANSACTION_TYPES.SOLVER_REWARD,

                amount:
                  rewardThisSolve,

                title:
                  "Solver Reward",

                description:
                  `You earned ${rewardThisSolve} KP for solving a doubt with ${finalStars} star${finalStars === 1 ? "" : "s"}.`,

                doubtId:
                  cleanDoubtId,

                balanceAfter:
                  newSolverKP,

                metadata: {
                  stars:
                    finalStars,

                  rewardThisSolve,

                  totalRewarded:
                    newRewardedPoints,

                  remainingPoints:
                    newRemainingPoints,

                  fullyResolved
                },

                createdAt:
                  serverTimestamp()
              }
            );
          }

          // ==================================================
          // RETURN RESULT
          // ==================================================

          return {
            success: true,

            rewardThisSolve,

            totalRewarded:
              newRewardedPoints,

            remainingPoints:
              newRemainingPoints,

            awardedStars:
              finalStars,

            status:
              newStatus,

            fullyResolved,

            xpAdded:
              xpThisSolve,

            achievementXP:
              achievementResult.achievementXP,

            unlockedAchievements:
              achievementResult.unlockedAchievements,

            totalXP:
              newSolverXP,

            level:
              newSolverLevel.level,

            levelName:
              newSolverLevel.name
          };
        }
      );

    return result;
  }

  // ==========================================================
  // MOCK MODE
  // ==========================================================

  if (
    typeof mockStore.resolveDoubt ===
    "function"
  ) {
    return mockStore.resolveDoubt(
      cleanDoubtId,
      solverId,
      newStars
    );
  }

  throw new Error(
    "Database is not configured."
  );
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  createDoubt,

  subscribeToDoubts,

  subscribeToDoubt,

  subscribeToMessages,

  sendMessage,

  claimDoubt,

  resolveDoubt,

  getDoubtFeedPriority,

  sortDoubtsForFeed
};