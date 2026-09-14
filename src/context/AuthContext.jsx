import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase/config';
import * as mockStore from '../services/mockStorage';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth
  useEffect(() => {
    if (isFirebaseConfigured && auth && db) {
      const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          setCurrentUser(firebaseUser);
          // Subscribe to real-time profile updates
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              setUserProfile({ uid: firebaseUser.uid, ...docSnap.data() });
            } else {
              setUserProfile(null);
            }
          });
          setLoading(false);
          return () => unsubscribeProfile();
        } else {
          setCurrentUser(null);
          setUserProfile(null);
          setLoading(false);
        }
      });
      return () => unsubscribeAuth();
    } else {
      // Mock mode initialization
      const syncMockUser = () => {
        const user = mockStore.getStoredCurrentUser();
        if (user) {
          setCurrentUser({ uid: user.uid, email: user.email });
          setUserProfile(user);
        } else {
          // Default to student Aarav if first visit so demo is immediately accessible
          const users = mockStore.getStoredUsers();
          const defaultUser = users[0];
          mockStore.setStoredCurrentUser(defaultUser.uid);
          setCurrentUser({ uid: defaultUser.uid, email: defaultUser.email });
          setUserProfile(defaultUser);
        }
        setLoading(false);
      };

      syncMockUser();

      const unsubStorage = mockStore.subscribeToStorageEvents((event) => {
        if (event.type === 'AUTH_STATE_CHANGED' || event.type === 'USERS_UPDATED' || event.type === 'RESET_DATA') {
          const user = mockStore.getStoredCurrentUser();
          if (user) {
            setCurrentUser({ uid: user.uid, email: user.email });
            setUserProfile({ ...user });
          } else {
            setCurrentUser(null);
            setUserProfile(null);
          }
        }
      });

      return () => unsubStorage();
    }
  }, []);

  // Signup
  const signup = async ({ name, email, password, classLevel, subjects = [] }) => {
    if (isFirebaseConfigured && auth && db) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const profileData = {
        uid: cred.user.uid,
        name,
        email,
        classLevel,
        subjects,
        reputation: 0,
        totalSolved: 0,
        totalAccepted: 0,
        kpBalance: 100, // Starts with 100 KP
        role: 'student',
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, 'users', cred.user.uid), profileData);
      setUserProfile(profileData);
      return cred.user;
    }

    // Mock Mode Signup
    const users = mockStore.getStoredUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists.');
    }
    const newUid = 'user_' + Date.now();
    const newUser = {
      uid: newUid,
      name,
      email,
      password,
      classLevel,
      subjects,
      reputation: 0,
      totalSolved: 0,
      totalAccepted: 0,
      kpBalance: 100,
      role: 'student',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    mockStore.saveUsers(users);
    mockStore.setStoredCurrentUser(newUid);
    setCurrentUser({ uid: newUid, email });
    setUserProfile(newUser);
    return newUser;
  };

  // Login
  const login = async (email, password) => {
    if (isFirebaseConfigured && auth) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return cred.user;
    }

    // Mock Mode Login
    const users = mockStore.getStoredUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!found) {
      throw new Error('Invalid email or user not found.');
    }
    if (found.password && found.password !== password) {
      throw new Error('Incorrect password.');
    }
    mockStore.setStoredCurrentUser(found.uid);
    setCurrentUser({ uid: found.uid, email: found.email });
    setUserProfile(found);
    return found;
  };

  // Logout
  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
      return;
    }
    mockStore.setStoredCurrentUser(null);
    setCurrentUser(null);
    setUserProfile(null);
  };

  // Switch demo user (for hackathon multi-student testing on one screen or tab)
  const switchDemoUser = (uid) => {
    const users = mockStore.getStoredUsers();
    const found = users.find(u => u.uid === uid);
    if (found) {
      mockStore.setStoredCurrentUser(found.uid);
      setCurrentUser({ uid: found.uid, email: found.email });
      setUserProfile(found);
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    logout,
    switchDemoUser,
    isLiveFirebase: isFirebaseConfigured
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
