import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, fetch details from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Use onSnapshot for real-time updates to user profile
        const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser({ uid: firebaseUser.uid, ...docSnap.data() });
          } else {
            // If document doesn't exist yet (might happen during signup), 
            // we'll wait for the signup process to create it
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
          }
          setIsAuthenticated(true);
          setLoading(false);
        });

        return () => unsubscribeDoc();
      } else {
        // User is signed out
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const login = async () => {
    // This is now handled by onAuthStateChanged after Firebase Sign In
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = async (updatedData) => {
    if (!user?.uid) return;
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, updatedData, { merge: true });
  };

  return (
    <UserContext.Provider value={{ user, isAuthenticated, loading, login, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};
