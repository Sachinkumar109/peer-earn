// Local simulation engine with real-time multi-tab synchronization
// Ensures hackathon demo works immediately out of the box with 100% reliability

const STORAGE_KEYS = {
  USERS: 'peerearn_users',
  DOUBTS: 'peerearn_doubts',
  MESSAGES: 'peerearn_messages',
  CURRENT_USER_ID: 'peerearn_current_user_id'
};

const INITIAL_USERS = [
  {
    uid: 'user_aarav',
    name: 'Aarav Sharma',
    email: 'aarav@peerearn.edu',
    password: 'password123',
    classLevel: '12th',
    subjects: ['Physics', 'Mathematics', 'Chemistry'],
    reputation: 15,
    totalSolved: 3,
    totalAccepted: 2,
    kpBalance: 120,
    role: 'student',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    uid: 'user_priya',
    name: 'Priya Patel',
    email: 'priya@peerearn.edu',
    password: 'password123',
    classLevel: '12th',
    subjects: ['Physics', 'Biology', 'Chemistry'],
    reputation: 28,
    totalSolved: 6,
    totalAccepted: 1,
    kpBalance: 165,
    role: 'student',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    uid: 'user_rohan',
    name: 'Rohan Gupta',
    email: 'rohan@college.edu',
    password: 'password123',
    classLevel: 'college',
    subjects: ['Computer Science', 'Mathematics'],
    reputation: 42,
    totalSolved: 9,
    totalAccepted: 4,
    kpBalance: 210,
    role: 'student',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
  }
];

const INITIAL_DOUBTS = [
  {
    id: 'doubt_1',
    askerId: 'user_aarav',
    askerName: 'Aarav Sharma',
    text: 'How does Faraday\'s law of electromagnetic induction apply to mutual induction between two coaxial solenoids?',
    subject: 'Physics',
    classLevel: '12th',
    stakedPoints: 25,
    status: 'open',
    solverId: null,
    solverName: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    resolvedAt: null
  },
  {
    id: 'doubt_2',
    askerId: 'user_rohan',
    askerName: 'Rohan Gupta',
    text: 'Need help understanding worst-case O(n^2) behavior in QuickSort and how randomized pivot selection prevents it.',
    subject: 'Computer Science',
    classLevel: 'college',
    stakedPoints: 30,
    status: 'open',
    solverId: null,
    solverName: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
    resolvedAt: null
  },
  {
    id: 'doubt_3',
    askerId: 'user_priya',
    askerName: 'Priya Patel',
    text: 'How does Le Chatelier\'s principle predict equilibrium shift when inert gas is added at constant volume vs constant pressure?',
    subject: 'Chemistry',
    classLevel: '12th',
    stakedPoints: 20,
    status: 'open',
    solverId: null,
    solverName: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    resolvedAt: null
  }
];

const INITIAL_MESSAGES = {
  doubt_1: [
    {
      id: 'msg_1',
      senderId: 'user_aarav',
      senderName: 'Aarav Sharma',
      text: 'Hey everyone! I understand self-induction, but I am confused how the flux linkage is calculated when one coil is inside another.',
      sentAt: new Date(Date.now() - 1000 * 60 * 34).toISOString()
    }
  ]
};

// Real-time broadcast channel for multi-tab synchronization
const channel = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel('peerearn_events') 
  : null;

const listeners = new Set();

export const notifySubscribers = (event) => {
  if (channel) {
    channel.postMessage(event);
  }
  listeners.forEach(cb => {
    try {
      cb(event);
    } catch (e) {
      console.error(e);
    }
  });
};

if (channel) {
  channel.onmessage = (e) => {
    listeners.forEach(cb => {
      try {
        cb(e.data);
      } catch (err) {
        console.error(err);
      }
    });
  };
}

export const subscribeToStorageEvents = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

export const getStoredUsers = () => {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  return JSON.parse(data);
};

export const saveUsers = (users) => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  notifySubscribers({ type: 'USERS_UPDATED' });
};

export const getStoredDoubts = () => {
  const data = localStorage.getItem(STORAGE_KEYS.DOUBTS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.DOUBTS, JSON.stringify(INITIAL_DOUBTS));
    return INITIAL_DOUBTS;
  }
  return JSON.parse(data);
};

export const saveDoubts = (doubts) => {
  localStorage.setItem(STORAGE_KEYS.DOUBTS, JSON.stringify(doubts));
  notifySubscribers({ type: 'DOUBTS_UPDATED' });
};

export const getStoredMessages = (doubtId) => {
  const allMessages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || 'null');
  if (!allMessages) {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(INITIAL_MESSAGES));
    return INITIAL_MESSAGES[doubtId] || [];
  }
  return allMessages[doubtId] || [];
};

export const saveMessage = (doubtId, message) => {
  const allMessages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '{}');
  if (!allMessages[doubtId]) {
    allMessages[doubtId] = [];
  }
  allMessages[doubtId].push(message);
  localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(allMessages));
  notifySubscribers({ type: 'MESSAGES_UPDATED', doubtId });
};

export const getStoredCurrentUser = () => {
  const uid = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
  if (!uid) return null;
  const users = getStoredUsers();
  return users.find(u => u.uid === uid) || null;
};

export const setStoredCurrentUser = (userOrId) => {
  if (!userOrId) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
  } else {
    const uid = typeof userOrId === 'string' ? userOrId : userOrId.uid;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, uid);
  }
  notifySubscribers({ type: 'AUTH_STATE_CHANGED' });
};

export const resetToInitialData = () => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(STORAGE_KEYS.DOUBTS, JSON.stringify(INITIAL_DOUBTS));
  localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(INITIAL_MESSAGES));
  notifySubscribers({ type: 'RESET_DATA' });
};
