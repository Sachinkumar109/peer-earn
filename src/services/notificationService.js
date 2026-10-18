import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

import {
  db,
  isFirebaseConfigured
} from '../firebase/config';

import * as mockStore from './mockStorage';

const SIX_HOURS = 6 * 60 * 60 * 1000;

/*
===========================================================
TIME HELPER
===========================================================
*/

const getDateValue = (value) => {
  if (!value) return null;

  if (value?.toDate) {
    return value.toDate();
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
};


/*
===========================================================
SUBJECT MATCHING
===========================================================
*/

const normalizeSubject = (subject = '') => {
  return String(subject)
    .toLowerCase()
    .trim();
};

const subjectsMatch = (doubtSubject, userSubjects = []) => {
  const doubt = normalizeSubject(doubtSubject);

  if (!doubt) return false;

  return userSubjects.some((subject) => {
    const userSubject = normalizeSubject(subject);

    if (!userSubject) return false;

    /*
      Computer Science should also match common
      programming-related doubts.
    */

    if (userSubject === 'computer science') {
      return (
        doubt === 'computer science' ||
        doubt.includes('computer') ||
        doubt.includes('programming') ||
        doubt.includes('coding') ||
        doubt === 'c++' ||
        doubt === 'c' ||
        doubt === 'java' ||
        doubt === 'python'
      );
    }

    return doubt === userSubject;
  });
};


/*
===========================================================
CHECK WHETHER DOUBT IS 6+ HOURS OLD
===========================================================
*/

export const isDoubtOlderThanSixHours = (doubt) => {
  if (!doubt) return false;

  const createdDate = getDateValue(doubt.createdAt);

  if (!createdDate) return false;

  return (
    Date.now() - createdDate.getTime() >= SIX_HOURS
  );
};


/*
===========================================================
NOTIFICATION OBJECT
===========================================================
*/

const buildNotification = (doubt) => {
  const notificationId = `${doubt.id}_6hour`;

  return {
    id: notificationId,
    type: 'old_doubt',
    doubtId: doubt.id,
    subject: doubt.subject || 'Academic',
    title: `New ${doubt.subject || 'academic'} doubt needs help`,
    message:
      `This doubt has been waiting for more than 6 hours. ` +
      `Help your peer and earn ${Number(doubt.remainingPoints ?? doubt.stakedPoints ?? 0)} KP.`,
    askerName: doubt.askerName || 'A student',
    unread: true,
    createdAt: new Date().toISOString()
  };
};


/*
===========================================================
MOCK MODE
===========================================================
*/

const createMockNotification = (
  userProfile,
  doubt
) => {
  const users = mockStore.getStoredUsers();

  const userIndex = users.findIndex(
    (user) => user.uid === userProfile.uid
  );

  if (userIndex === -1) {
    return false;
  }

  const user = users[userIndex];

  const notifications = Array.isArray(user.notifications)
    ? user.notifications
    : [];

  const notificationId = `${doubt.id}_6hour`;

  /*
    IMPORTANT:
    Do not create the same notification twice.
  */

  const alreadyExists = notifications.some(
    (notification) =>
      notification.id === notificationId
  );

  if (alreadyExists) {
    return false;
  }

  const notification = buildNotification(doubt);

  user.notifications = [
    notification,
    ...notifications
  ];

  users[userIndex] = user;

  mockStore.saveUsers(users);

  return true;
};


/*
===========================================================
CHECK OPEN DOUBTS FOR CURRENT USER
===========================================================
*/

export const checkSixHourNotifications = async (
  userProfile,
  doubts = []
) => {
  if (!userProfile?.uid) {
    return;
  }

  const userSubjects = Array.isArray(
    userProfile.subjects
  )
    ? userProfile.subjects
    : [];

  if (userSubjects.length === 0) {
    return;
  }

  const eligibleDoubts = doubts.filter((doubt) => {
    /*
      Only open doubts.
    */

    if (doubt.status !== 'open') {
      return false;
    }

    /*
      Never notify the person who asked it.
    */

    if (doubt.askerId === userProfile.uid) {
      return false;
    }

    /*
      If this user is already the solver,
      don't notify them.
    */

    if (doubt.solverId === userProfile.uid) {
      return false;
    }

    /*
      Must be at least 6 hours old.
    */

    if (!isDoubtOlderThanSixHours(doubt)) {
      return false;
    }

    /*
      Subject must match.
    */

    if (
      !subjectsMatch(
        doubt.subject,
        userSubjects
      )
    ) {
      return false;
    }

    return true;
  });

  if (eligibleDoubts.length === 0) {
    return;
  }

  /*
  =========================================================
  FIREBASE MODE

  We create the notification under the CURRENT USER.

  This means a student only writes to their own
  notification collection.
  =========================================================
  */

  if (
    isFirebaseConfigured &&
    db
  ) {
    for (const doubt of eligibleDoubts) {
      const notificationId =
        `${doubt.id}_6hour`;

      const notificationRef = doc(
        db,
        'users',
        userProfile.uid,
        'notifications',
        notificationId
      );

      try {
        await setDoc(
          notificationRef,
          {
            ...buildNotification(doubt),
            createdAt: serverTimestamp()
          },
          {
            merge: false
          }
        );
      } catch (error) {
        /*
          If the notification already exists,
          don't break the rest of the application.
        */

        console.warn(
          'Notification creation skipped:',
          error
        );
      }
    }

    return;
  }

  /*
  =========================================================
  MOCK MODE
  =========================================================
  */

  for (const doubt of eligibleDoubts) {
    createMockNotification(
      userProfile,
      doubt
    );
  }
};


/*
===========================================================
SUBSCRIBE TO CURRENT USER NOTIFICATIONS
===========================================================
*/

export const subscribeToNotifications = (
  userId,
  callback
) => {
  if (!userId) {
    callback([]);
    return () => {};
  }

  /*
  =========================================================
  FIREBASE
  =========================================================
  */

  if (
    isFirebaseConfigured &&
    db
  ) {
    const notificationsRef = collection(
      db,
      'users',
      userId,
      'notifications'
    );

    const notificationsQuery = query(
      notificationsRef,
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notifications =
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data()
          }));

        callback(notifications);
      },
      (error) => {
        console.error(
          'Notification subscription error:',
          error
        );

        callback([]);
      }
    );
  }

  /*
  =========================================================
  MOCK MODE
  =========================================================
  */

  const readMockNotifications = () => {
    const users =
      mockStore.getStoredUsers();

    const user = users.find(
      (item) =>
        item.uid === userId
    );

    callback(
      Array.isArray(user?.notifications)
        ? user.notifications
        : []
    );
  };

  readMockNotifications();

  return mockStore.subscribeToStorageEvents(
    (event) => {
      if (
        event.type === 'USERS_UPDATED' ||
        event.type === 'RESET_DATA' ||
        event.type === 'AUTH_STATE_CHANGED'
      ) {
        readMockNotifications();
      }
    }
  );
};


/*
===========================================================
MARK NOTIFICATION AS READ
===========================================================
*/

export const markNotificationAsRead = async (
  userId,
  notificationId
) => {
  if (!userId || !notificationId) {
    return;
  }

  /*
  =========================================================
  FIREBASE
  =========================================================
  */

  if (
    isFirebaseConfigured &&
    db
  ) {
    const notificationRef = doc(
      db,
      'users',
      userId,
      'notifications',
      notificationId
    );

    await updateDoc(
      notificationRef,
      {
        unread: false
      }
    );

    return;
  }

  /*
  =========================================================
  MOCK
  =========================================================
  */

  const users =
    mockStore.getStoredUsers();

  const userIndex = users.findIndex(
    (user) =>
      user.uid === userId
  );

  if (userIndex === -1) {
    return;
  }

  const notifications =
    Array.isArray(
      users[userIndex].notifications
    )
      ? users[userIndex].notifications
      : [];

  users[userIndex].notifications =
    notifications.map(
      (notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              unread: false
            }
          : notification
    );

  mockStore.saveUsers(users);
};