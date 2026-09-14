import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import * as mockStore from './mockStorage';

/**
 * Creates a new doubt and stakes Knowledge Points (KP)
 */
export const createDoubt = async (user, { text, subject, classLevel, stakedPoints }) => {
  const points = Number(stakedPoints);
  if (points <= 0) throw new Error('Staked points must be greater than 0');
  if (user.kpBalance < points) throw new Error('Insufficient Knowledge Points (KP) balance');

  if (isFirebaseConfigured && db) {
    // 1. Deduct staked points from user
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      kpBalance: user.kpBalance - points
    });

    // 2. Create the doubt document
    const doubtData = {
      askerId: user.uid,
      askerName: user.name,
      text,
      subject,
      classLevel,
      stakedPoints: points,
      status: 'open',
      solverId: null,
      solverName: null,
      createdAt: serverTimestamp(),
      resolvedAt: null
    };
    const doubtDocRef = await addDoc(collection(db, 'doubts'), doubtData);
    return { id: doubtDocRef.id, ...doubtData };
  }

  // --- Mock Mode ---
  const users = mockStore.getStoredUsers();
  const uIndex = users.findIndex(u => u.uid === user.uid);
  if (uIndex !== -1) {
    users[uIndex].kpBalance -= points;
    mockStore.saveUsers(users);
  }

  const doubts = mockStore.getStoredDoubts();
  const newDoubt = {
    id: 'doubt_' + Date.now(),
    askerId: user.uid,
    askerName: user.name,
    text,
    subject,
    classLevel,
    stakedPoints: points,
    status: 'open',
    solverId: null,
    solverName: null,
    createdAt: new Date().toISOString(),
    resolvedAt: null
  };
  doubts.unshift(newDoubt);
  mockStore.saveDoubts(doubts);
  return newDoubt;
};

/**
 * Subscribe to doubts list with optional filtering
 */
export const subscribeToDoubts = (filters, callback) => {
  if (isFirebaseConfigured && db) {
    let q = collection(db, 'doubts');
    const constraints = [orderBy('createdAt', 'desc')];
    if (filters?.subject && filters.subject !== 'all') {
      constraints.push(where('subject', '==', filters.subject));
    }
    if (filters?.classLevel && filters.classLevel !== 'all') {
      constraints.push(where('classLevel', '==', filters.classLevel));
    }
    if (filters?.status && filters.status !== 'all') {
      constraints.push(where('status', '==', filters.status));
    }
    
    // Note: in Firestore, compound queries with range/order might require an index,
    // so we handle client-side sorting/filtering gracefully if composite fails.
    const unsubscribe = onSnapshot(collection(db, 'doubts'), (snapshot) => {
      let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (filters?.subject && filters.subject !== 'all') {
        docs = docs.filter(d => d.subject?.toLowerCase() === filters.subject.toLowerCase());
      }
      if (filters?.classLevel && filters.classLevel !== 'all') {
        docs = docs.filter(d => d.classLevel?.toLowerCase() === filters.classLevel.toLowerCase());
      }
      if (filters?.status && filters.status !== 'all') {
        docs = docs.filter(d => d.status === filters.status);
      }
      // Sort newest first
      docs.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return timeB - timeA;
      });
      callback(docs);
    }, (error) => {
      console.error('Firestore doubts subscription error:', error);
    });

    return unsubscribe;
  }

  // --- Mock Mode ---
  const emitFiltered = () => {
    let doubts = mockStore.getStoredDoubts();
    if (filters?.subject && filters.subject !== 'all') {
      doubts = doubts.filter(d => d.subject.toLowerCase() === filters.subject.toLowerCase());
    }
    if (filters?.classLevel && filters.classLevel !== 'all') {
      doubts = doubts.filter(d => d.classLevel.toLowerCase() === filters.classLevel.toLowerCase());
    }
    if (filters?.status && filters.status !== 'all') {
      doubts = doubts.filter(d => d.status === filters.status);
    }
    doubts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    callback([...doubts]);
  };

  emitFiltered();
  const unsub = mockStore.subscribeToStorageEvents((event) => {
    if (event.type === 'DOUBTS_UPDATED' || event.type === 'RESET_DATA') {
      emitFiltered();
    }
  });

  return unsub;
};

/**
 * Subscribe to a single doubt document
 */
export const subscribeToDoubt = (doubtId, callback) => {
  if (isFirebaseConfigured && db) {
    const docRef = doc(db, 'doubts', doubtId);
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() });
      } else {
        callback(null);
      }
    });
  }

  // --- Mock Mode ---
  const emitDoubt = () => {
    const doubts = mockStore.getStoredDoubts();
    const doubt = doubts.find(d => d.id === doubtId);
    callback(doubt ? { ...doubt } : null);
  };

  emitDoubt();
  const unsub = mockStore.subscribeToStorageEvents((event) => {
    if (event.type === 'DOUBTS_UPDATED' || event.type === 'RESET_DATA') {
      emitDoubt();
    }
  });
  return unsub;
};

/**
 * Claim or set solver in progress for a doubt
 */
export const claimDoubt = async (doubtId, solverUser) => {
  if (isFirebaseConfigured && db) {
    const doubtRef = doc(db, 'doubts', doubtId);
    const doubtSnap = await getDoc(doubtRef);
    if (!doubtSnap.exists()) throw new Error('Doubt not found');
    const data = doubtSnap.data();

    // If already in progress with someone else or resolved, do nothing
    if (data.status === 'open') {
      await updateDoc(doubtRef, {
        status: 'in_progress',
        solverId: solverUser.uid,
        solverName: solverUser.name
      });
    }
    return;
  }

  // --- Mock Mode ---
  const doubts = mockStore.getStoredDoubts();
  const idx = doubts.findIndex(d => d.id === doubtId);
  if (idx !== -1 && doubts[idx].status === 'open') {
    doubts[idx].status = 'in_progress';
    doubts[idx].solverId = solverUser.uid;
    doubts[idx].solverName = solverUser.name;
    mockStore.saveDoubts(doubts);
  }
};

/**
 * Subscribe to messages in a doubt chat
 */
export const subscribeToMessages = (doubtId, callback) => {
  if (isFirebaseConfigured && db) {
    const messagesCol = collection(db, 'doubts', doubtId, 'messages');
    const q = query(messagesCol, orderBy('sentAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(msgs);
    }, (error) => {
      console.error('Firestore messages subscription error:', error);
    });
  }

  // --- Mock Mode ---
  const emitMsgs = () => {
    const msgs = mockStore.getStoredMessages(doubtId);
    callback([...msgs]);
  };

  emitMsgs();
  const unsub = mockStore.subscribeToStorageEvents((event) => {
    if ((event.type === 'MESSAGES_UPDATED' && event.doubtId === doubtId) || event.type === 'RESET_DATA') {
      emitMsgs();
    }
  });
  return unsub;
};

/**
 * Send a message in a doubt chat
 */
export const sendMessage = async (doubtId, { senderId, senderName, text }) => {
  if (!text || !text.trim()) return;

  if (isFirebaseConfigured && db) {
    const messagesCol = collection(db, 'doubts', doubtId, 'messages');
    await addDoc(messagesCol, {
      senderId,
      senderName,
      text: text.trim(),
      sentAt: serverTimestamp()
    });
    return;
  }

  // --- Mock Mode ---
  const newMsg = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    senderId,
    senderName,
    text: text.trim(),
    sentAt: new Date().toISOString()
  };
  mockStore.saveMessage(doubtId, newMsg);
};

/**
 * Resolve doubt and execute Knowledge Points transfer transaction
 * Transfers staked KP + 5 KP bonus to solver
 * Updates asker totalAccepted + reputation
 * Updates solver totalSolved + reputation
 */
export const resolveDoubt = async (doubtId, askerUser, solverId) => {
  const BONUS_KP = 5; // Hackathon platform incentive bonus!

  if (isFirebaseConfigured && db) {
    const doubtRef = doc(db, 'doubts', doubtId);
    const askerRef = doc(db, 'users', askerUser.uid);
    const solverRef = doc(db, 'users', solverId);

    await runTransaction(db, async (transaction) => {
      const doubtDoc = await transaction.get(doubtRef);
      if (!doubtDoc.exists()) throw new Error('Doubt does not exist');
      
      const doubtData = doubtDoc.data();
      if (doubtData.status === 'resolved') {
        throw new Error('Doubt is already resolved');
      }

      const solverDoc = await transaction.get(solverRef);
      if (!solverDoc.exists()) throw new Error('Solver user not found');
      const solverData = solverDoc.data();

      const askerDoc = await transaction.get(askerRef);
      const askerData = askerDoc.exists() ? askerDoc.data() : askerUser;

      const stakedPoints = Number(doubtData.stakedPoints) || 0;
      const totalEarned = stakedPoints + BONUS_KP;

      // 1. Update solver balance & stats
      transaction.update(solverRef, {
        kpBalance: (solverData.kpBalance || 0) + totalEarned,
        totalSolved: (solverData.totalSolved || 0) + 1,
        reputation: (solverData.reputation || 0) + 5
      });

      // 2. Update asker stats
      transaction.update(askerRef, {
        totalAccepted: (askerData.totalAccepted || 0) + 1,
        reputation: (askerData.reputation || 0) + 2
      });

      // 3. Mark doubt as resolved
      transaction.update(doubtRef, {
        status: 'resolved',
        solverId: solverId,
        resolvedAt: serverTimestamp()
      });
    });

    return { success: true, bonusEarned: BONUS_KP };
  }

  // --- Mock Mode Transaction ---
  const doubts = mockStore.getStoredDoubts();
  const dIndex = doubts.findIndex(d => d.id === doubtId);
  if (dIndex === -1) throw new Error('Doubt not found');
  if (doubts[dIndex].status === 'resolved') throw new Error('Doubt is already resolved');

  const users = mockStore.getStoredUsers();
  const sIndex = users.findIndex(u => u.uid === solverId);
  const aIndex = users.findIndex(u => u.uid === askerUser.uid);

  if (sIndex === -1) throw new Error('Solver user not found');

  const stakedPoints = Number(doubts[dIndex].stakedPoints) || 0;
  const totalEarned = stakedPoints + BONUS_KP;

  // Credit solver
  users[sIndex].kpBalance += totalEarned;
  users[sIndex].totalSolved = (users[sIndex].totalSolved || 0) + 1;
  users[sIndex].reputation = (users[sIndex].reputation || 0) + 5;

  // Update asker stats
  if (aIndex !== -1) {
    users[aIndex].totalAccepted = (users[aIndex].totalAccepted || 0) + 1;
    users[aIndex].reputation = (users[aIndex].reputation || 0) + 2;
  }

  // Update doubt status
  doubts[dIndex].status = 'resolved';
  doubts[dIndex].solverId = solverId;
  doubts[dIndex].resolvedAt = new Date().toISOString();

  mockStore.saveUsers(users);
  mockStore.saveDoubts(doubts);

  return { success: true, bonusEarned: BONUS_KP, totalEarned };
};
