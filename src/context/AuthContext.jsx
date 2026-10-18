import React, {
  createContext,
  useContext,
  useState,
  useEffect
} from 'react';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  runTransaction
} from 'firebase/firestore';

import {
  auth,
  db,
  isFirebaseConfigured
} from '../firebase/config';

import * as mockStore from '../services/mockStorage';

import {
  KP_TRANSACTION_TYPES
} from '../services/kpHistoryService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {

  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------
  // NORMALIZE USER PROFILE
  // ---------------------------------------------------------

  const normalizeProfile = (profile) => {
    if (!profile) return null;

    return {
      ...profile,

      subjects:
        Array.isArray(profile.subjects)
          ? profile.subjects
          : [],

      notifications:
        Array.isArray(profile.notifications)
          ? profile.notifications
          : [],

      reputation:
        Number(profile.reputation) || 0,

      totalSolved:
        Number(profile.totalSolved) || 0,

      totalAccepted:
        Number(profile.totalAccepted) || 0,

      kpBalance:
        typeof profile.kpBalance === 'number'
          ? profile.kpBalance
          : Number(profile.kpBalance) || 100,

      role:
        profile.role || 'student'
    };
  };

  // ---------------------------------------------------------
  // CREATE MISSING FIREBASE PROFILE
  // ---------------------------------------------------------

  const createMissingProfile = async (firebaseUser) => {

    const userDocRef =
      doc(db, 'users', firebaseUser.uid);

    const profileData = {

      uid: firebaseUser.uid,

      name:
        firebaseUser.displayName ||
        firebaseUser.email?.split('@')[0] ||
        'Student',

      email:
        firebaseUser.email || '',

      classLevel: '',

      subjects: [],

      notifications: [],

      reputation: 0,

      totalSolved: 0,

      totalAccepted: 0,

      kpBalance: 100,

      role: 'student',

      createdAt: serverTimestamp()
    };

    await setDoc(
      userDocRef,
      profileData,
      { merge: true }
    );

    return normalizeProfile({
      ...profileData,
      uid: firebaseUser.uid,
      email: firebaseUser.email || ''
    });
  };

  // ---------------------------------------------------------
  // AUTH STATE LISTENER
  // ---------------------------------------------------------

  useEffect(() => {

    if (
      isFirebaseConfigured &&
      auth &&
      db
    ) {

      let unsubscribeProfile = null;

      const unsubscribeAuth =
        onAuthStateChanged(
          auth,
          async (firebaseUser) => {

            if (!firebaseUser) {

              if (unsubscribeProfile) {
                unsubscribeProfile();
                unsubscribeProfile = null;
              }

              setCurrentUser(null);
              setUserProfile(null);
              setLoading(false);

              return;
            }

            setCurrentUser(firebaseUser);

            const userDocRef =
              doc(
                db,
                'users',
                firebaseUser.uid
              );

            try {

              const firstSnap =
                await getDoc(userDocRef);

              if (firstSnap.exists()) {

                const profile = {
                  uid: firebaseUser.uid,
                  ...firstSnap.data()
                };

                setUserProfile(
                  normalizeProfile(profile)
                );

              } else {

                console.warn(
                  'User profile missing. Creating profile...'
                );

                const newProfile =
                  await createMissingProfile(
                    firebaseUser
                  );

                setUserProfile(newProfile);
              }

            } catch (error) {

              console.error(
                'Error loading user profile:',
                error
              );

              setUserProfile(null);
            }

            if (unsubscribeProfile) {
              unsubscribeProfile();
            }

            unsubscribeProfile =
              onSnapshot(
                userDocRef,

                (docSnap) => {

                  if (docSnap.exists()) {

                    const profile = {
                      uid: firebaseUser.uid,
                      ...docSnap.data()
                    };

                    setUserProfile(
                      normalizeProfile(profile)
                    );

                  } else {

                    console.warn(
                      'User profile document does not exist.'
                    );
                  }

                  setLoading(false);
                },

                (error) => {

                  console.error(
                    'Error listening to user profile:',
                    error
                  );

                  setLoading(false);
                }
              );
          }
        );

      return () => {

        unsubscribeAuth();

        if (unsubscribeProfile) {
          unsubscribeProfile();
        }
      };
    }

    // -------------------------------------------------------
    // MOCK MODE
    // -------------------------------------------------------

    const syncMockUser = () => {

      const user =
        mockStore.getStoredCurrentUser();

      if (user) {

        const normalizedUser =
          normalizeProfile(user);

        setCurrentUser({
          uid: normalizedUser.uid,
          email: normalizedUser.email
        });

        setUserProfile(normalizedUser);

      } else {

        const users =
          mockStore.getStoredUsers();

        const defaultUser =
          users[0];

        if (defaultUser) {

          mockStore.setStoredCurrentUser(
            defaultUser.uid
          );

          const normalizedUser =
            normalizeProfile(defaultUser);

          setCurrentUser({
            uid: normalizedUser.uid,
            email: normalizedUser.email
          });

          setUserProfile(normalizedUser);

        } else {

          setCurrentUser(null);
          setUserProfile(null);
        }
      }

      setLoading(false);
    };

    syncMockUser();

    const unsubStorage =
      mockStore.subscribeToStorageEvents(
        (event) => {

          if (
            event.type ===
              'AUTH_STATE_CHANGED' ||

            event.type ===
              'USERS_UPDATED' ||

            event.type ===
              'RESET_DATA'
          ) {
            syncMockUser();
          }
        }
      );

    return () => unsubStorage();

  }, []);

  // ---------------------------------------------------------
  // SIGN UP
  // ---------------------------------------------------------

  const signup = async ({
    name,
    email,
    password,
    classLevel,
    subjects = []
  }) => {

    if (
      isFirebaseConfigured &&
      auth &&
      db
    ) {

      const cred =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      const profileData = {

        uid: cred.user.uid,

        name,

        email,

        classLevel,

        subjects:
          Array.isArray(subjects)
            ? subjects
            : [],

        notifications: [],

        reputation: 0,

        totalSolved: 0,

        totalAccepted: 0,

        kpBalance: 100,

        role: 'student',

        createdAt: serverTimestamp()
      };

      await setDoc(
        doc(
          db,
          'users',
          cred.user.uid
        ),
        profileData
      );

      setUserProfile(
        normalizeProfile({
          ...profileData,
          uid: cred.user.uid,
          email
        })
      );

      return cred.user;
    }

    // -------------------------------------------------------
    // MOCK SIGNUP
    // -------------------------------------------------------

    const users =
      mockStore.getStoredUsers();

    if (
      users.some(
        (u) =>
          u.email &&
          u.email.toLowerCase() ===
            email.toLowerCase()
      )
    ) {

      throw new Error(
        'An account with this email already exists.'
      );
    }

    const newUid =
      'user_' + Date.now();

    const newUser = {

      uid: newUid,

      name,

      email,

      password,

      classLevel,

      subjects:
        Array.isArray(subjects)
          ? subjects
          : [],

      notifications: [],

      reputation: 0,

      totalSolved: 0,

      totalAccepted: 0,

      kpBalance: 100,

      role: 'student',

      createdAt:
        new Date().toISOString()
    };

    users.push(newUser);

    mockStore.saveUsers(users);

    mockStore.setStoredCurrentUser(
      newUid
    );

    setCurrentUser({
      uid: newUid,
      email
    });

    setUserProfile(
      normalizeProfile(newUser)
    );

    return newUser;
  };

  // ---------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------

  const login = async (
    email,
    password
  ) => {

    if (
      isFirebaseConfigured &&
      auth
    ) {

      const cred =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      return cred.user;
    }

    // -------------------------------------------------------
    // MOCK LOGIN
    // -------------------------------------------------------

    const users =
      mockStore.getStoredUsers();

    const found =
      users.find(
        (u) =>
          u.email &&
          u.email.toLowerCase() ===
            email.toLowerCase()
      );

    if (!found) {

      throw new Error(
        'Invalid email or user not found.'
      );
    }

    if (
      found.password &&
      found.password !== password
    ) {

      throw new Error(
        'Incorrect password.'
      );
    }

    const normalizedUser =
      normalizeProfile(found);

    mockStore.setStoredCurrentUser(
      found.uid
    );

    setCurrentUser({
      uid: found.uid,
      email: found.email
    });

    setUserProfile(normalizedUser);

    return found;
  };

  // ---------------------------------------------------------
  // FORGOT PASSWORD
  // ---------------------------------------------------------

  const forgotPassword = async (
    email
  ) => {

    if (
      !email ||
      !email.trim()
    ) {

      throw new Error(
        'Please enter your email address.'
      );
    }

    const cleanEmail =
      email.trim();

    if (
      isFirebaseConfigured &&
      auth
    ) {

      await sendPasswordResetEmail(
        auth,
        cleanEmail
      );

      return {
        success: true,

        message:
          'Password reset email sent successfully. Please check your inbox.'
      };
    }

    const users =
      mockStore.getStoredUsers();

    const found =
      users.find(
        (u) =>
          u.email &&
          u.email.toLowerCase() ===
            cleanEmail.toLowerCase()
      );

    if (!found) {

      throw new Error(
        'No account was found with this email.'
      );
    }

    throw new Error(
      'Password reset email is available only in Firebase mode.'
    );
  };

  // ---------------------------------------------------------
  // GOOGLE SIGN IN
  // ---------------------------------------------------------

  const signInWithGoogle =
    async () => {

      if (
        !isFirebaseConfigured ||
        !auth ||
        !db
      ) {

        throw new Error(
          'Google Sign-In requires Firebase configuration.'
        );
      }

      try {

        const provider =
          new GoogleAuthProvider();

        provider.addScope('profile');
        provider.addScope('email');

        const result =
          await signInWithPopup(
            auth,
            provider
          );

        const firebaseUser =
          result.user;

        const userDocRef =
          doc(
            db,
            'users',
            firebaseUser.uid
          );

        const userSnap =
          await getDoc(userDocRef);

        if (!userSnap.exists()) {

          const newProfile =
            await createMissingProfile(
              firebaseUser
            );

          setUserProfile(newProfile);

        } else {

          const profile = {
            uid: firebaseUser.uid,
            ...userSnap.data()
          };

          setUserProfile(
            normalizeProfile(profile)
          );
        }

        setCurrentUser(firebaseUser);

        return firebaseUser;

      } catch (error) {

        console.error(
          'Google Sign-In error:',
          error
        );

        throw error;
      }
    };

  // ---------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------

  const logout = async () => {

    if (
      isFirebaseConfigured &&
      auth
    ) {

      await signOut(auth);

      return;
    }

    mockStore.setStoredCurrentUser(null);

    setCurrentUser(null);
    setUserProfile(null);
  };

  // ---------------------------------------------------------
  // SWITCH DEMO USER
  // ---------------------------------------------------------

  const switchDemoUser = (
    uid
  ) => {

    const users =
      mockStore.getStoredUsers();

    const found =
      users.find(
        (u) => u.uid === uid
      );

    if (found) {

      const normalizedUser =
        normalizeProfile(found);

      mockStore.setStoredCurrentUser(
        found.uid
      );

      setCurrentUser({
        uid: found.uid,
        email: found.email
      });

      setUserProfile(
        normalizedUser
      );
    }
  };

  // =========================================================
  // REDEEM REWARD
  // =========================================================
  //
  // This function:
  //
  // 1. Checks the reward cost.
  // 2. Reads the latest wallet balance directly from Firebase.
  // 3. Rejects redemption if balance is insufficient.
  // 4. Deducts exactly the reward cost.
  // 5. Creates a KP History transaction.
  // 6. Performs both operations atomically.
  //
  // =========================================================

  const redeemReward = async (
    reward
  ) => {

    // -------------------------------------------------------
    // VALIDATE REWARD
    // -------------------------------------------------------

    if (!reward) {

      throw new Error(
        'Invalid reward.'
      );
    }

    const cost =
      Number(reward.cost);

    if (
      !Number.isFinite(cost) ||
      cost <= 0 ||
      !Number.isInteger(cost)
    ) {

      throw new Error(
        'Invalid reward cost.'
      );
    }

    const uid =
      currentUser?.uid ||
      userProfile?.uid;

    if (!uid) {

      throw new Error(
        'You must be logged in to redeem a reward.'
      );
    }

    // =======================================================
    // FIREBASE MODE
    // =======================================================

    if (
      isFirebaseConfigured &&
      db
    ) {

      const userRef =
        doc(
          db,
          'users',
          uid
        );

      // Create the history document reference BEFORE
      // starting the transaction.
      const historyRef =
        doc(
          collection(
            db,
            'kpTransactions'
          )
        );

      let previousBalance = 0;
      let newBalance = 0;

      await runTransaction(
        db,
        async (transaction) => {

          // -------------------------------------------------
          // IMPORTANT:
          // ALL READS MUST HAPPEN BEFORE WRITES.
          // -------------------------------------------------

          const userSnap =
            await transaction.get(
              userRef
            );

          if (!userSnap.exists()) {

            throw new Error(
              'User profile not found.'
            );
          }

          const userData =
            userSnap.data();

          previousBalance =
            Number(
              userData.kpBalance
            ) || 0;

          // -------------------------------------------------
          // CHECK BALANCE
          // -------------------------------------------------

          if (
            previousBalance < cost
          ) {

            throw new Error(
              `Insufficient KP balance. You have ${previousBalance} KP, but this reward costs ${cost} KP.`
            );
          }

          // -------------------------------------------------
          // CALCULATE NEW BALANCE
          // -------------------------------------------------

          newBalance =
            previousBalance - cost;

          // -------------------------------------------------
          // UPDATE USER WALLET
          // -------------------------------------------------

          transaction.update(
            userRef,
            {
              kpBalance: newBalance,
              updatedAt: serverTimestamp()
            }
          );

          // -------------------------------------------------
          // CREATE KP HISTORY ENTRY
          // -------------------------------------------------

          transaction.set(
            historyRef,
            {
              userId: uid,

              type:
                KP_TRANSACTION_TYPES.STORE_REDEMPTION,

              amount: -cost,

              title:
                'Store Redemption',

              description:
                `Redeemed ${reward.title || 'Store Reward'} for ${cost} KP.`,

              balanceAfter:
                newBalance,

              metadata: {

                rewardId:
                  reward.id || null,

                rewardTitle:
                  reward.title ||
                  'Store Reward',

                rewardCost:
                  cost,

                category:
                  reward.category ||
                  null
              },

              createdAt:
                serverTimestamp()
            }
          );
        }
      );

      // -----------------------------------------------------
      // UPDATE LOCAL PROFILE IMMEDIATELY
      // -----------------------------------------------------

      setUserProfile(
        (previousProfile) => {

          if (!previousProfile) {
            return previousProfile;
          }

          return normalizeProfile({
            ...previousProfile,
            kpBalance: newBalance
          });
        }
      );

      return {
        success: true,

        previousBalance,

        cost,

        newBalance,

        rewardId:
          reward.id || null,

        rewardTitle:
          reward.title ||
          'Store Reward'
      };
    }

    // =======================================================
    // MOCK MODE
    // =======================================================

    const users =
      mockStore.getStoredUsers();

    const userIndex =
      users.findIndex(
        (user) =>
          user.uid === uid
      );

    if (userIndex === -1) {

      throw new Error(
        'User profile not found.'
      );
    }

    const currentBalance =
      Number(
        users[userIndex].kpBalance
      ) || 0;

    if (
      currentBalance < cost
    ) {

      throw new Error(
        `Insufficient KP balance. You have ${currentBalance} KP, but this reward costs ${cost} KP.`
      );
    }

    const mockNewBalance =
      currentBalance - cost;

    users[userIndex] = {
      ...users[userIndex],
      kpBalance: mockNewBalance,
      updatedAt:
        new Date().toISOString()
    };

    mockStore.saveUsers(users);

    mockStore.setStoredCurrentUser(
      uid
    );

    const normalizedUser =
      normalizeProfile(
        users[userIndex]
      );

    setCurrentUser({
      uid: normalizedUser.uid,
      email: normalizedUser.email
    });

    setUserProfile(
      normalizedUser
    );

    return {
      success: true,

      previousBalance:
        currentBalance,

      cost,

      newBalance:
        mockNewBalance,

      rewardId:
        reward.id || null,

      rewardTitle:
        reward.title ||
        'Store Reward'
    };
  };

  // =========================================================
  // CONTEXT VALUE
  // =========================================================

  const value = {

    currentUser,

    userProfile,

    loading,

    signup,

    login,

    forgotPassword,

    signInWithGoogle,

    logout,

    switchDemoUser,

    // -------------------------------------------------------
    // NEW: STORE REDEMPTION
    // -------------------------------------------------------

    redeemReward,

    isLiveFirebase:
      isFirebaseConfigured,

    notifications:
      userProfile?.notifications || [],

    unreadNotificationCount:
      Array.isArray(
        userProfile?.notifications
      )
        ? userProfile.notifications.filter(
            (notification) =>
              !notification.read
          ).length
        : 0
  };

  return (
    <AuthContext.Provider
      value={value}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};