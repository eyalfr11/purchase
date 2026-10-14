import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import {
  auth,
  db,
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  resetPassword,
  logoutUser
} from '../firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isManager: boolean;
  isViewer: boolean;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName?: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const BOOTSTRAP_ADMIN_EMAIL = 'eyalfr@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('viewer');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setProfile(null);
        setRole('viewer');
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        const isBootstrapAdmin = currentUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

        let currentRole: UserRole = 'viewer';
        let createdAt = new Date().toISOString();

        if (isBootstrapAdmin) {
          currentRole = 'admin';
        } else if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          if (data?.role === 'admin' || data?.role === 'manager' || data?.role === 'viewer') {
            currentRole = data.role;
          }
          if (data?.createdAt) {
            createdAt = data.createdAt;
          }
        } else if (currentUser.email) {
          // Check if admin pre-created a user profile with this email
          try {
            const q = query(collection(db, 'users'), where('email', '==', currentUser.email.toLowerCase()));
            const querySnap = await getDocs(q);
            if (!querySnap.empty) {
              const preDoc = querySnap.docs[0].data();
              if (preDoc?.role === 'admin' || preDoc?.role === 'manager' || preDoc?.role === 'viewer') {
                currentRole = preDoc.role;
              }
              if (preDoc?.createdAt) {
                createdAt = preDoc.createdAt;
              }
            }
          } catch (e) {
            console.warn('Could not query pre-created user by email:', e);
          }
        }

        const now = new Date().toISOString();
        const profileData: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'משתמש',
          role: currentRole,
          createdAt: createdAt,
          updatedAt: now,
        };

        if (currentUser.photoURL) {
          profileData.photoURL = currentUser.photoURL;
        }

        // Save or update user profile document in Firestore (never with undefined keys)
        await setDoc(userDocRef, profileData, { merge: true });

        // Synchronize marker documents for Zero-Trust Firestore Security Rules
        if (isBootstrapAdmin || currentRole === 'admin') {
          const adminDocRef = doc(db, 'admins', currentUser.uid);
          const managerDocRef = doc(db, 'managers', currentUser.uid);
          await setDoc(adminDocRef, { email: currentUser.email, grantedAt: now }, { merge: true });
          await setDoc(managerDocRef, { email: currentUser.email, grantedAt: now }, { merge: true });
        } else if (currentRole === 'manager') {
          const managerDocRef = doc(db, 'managers', currentUser.uid);
          await setDoc(managerDocRef, { email: currentUser.email, grantedAt: now }, { merge: true });
        }

        setProfile(profileData);
        setRole(currentRole);
      } catch (err) {
        console.error('Error syncing user profile:', err);
        const fallbackRole: UserRole = currentUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() ? 'admin' : 'viewer';
        setRole(fallbackRole);
        setProfile({
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || 'משתמש',
          role: fallbackRole,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Failed to sign in with Google:', err);
      throw err;
    }
  };

  const signInWithGoogle = signIn;

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await loginWithEmail(email, pass);
    } catch (err) {
      console.error('Failed to sign in with email:', err);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName?: string) => {
    try {
      await registerWithEmail(email, pass, displayName);
    } catch (err) {
      console.error('Failed to register with email:', err);
      throw err;
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await resetPassword(email);
    } catch (err) {
      console.error('Failed to send password reset:', err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Failed to sign out:', err);
      throw err;
    }
  };

  const isAdmin = role === 'admin';
  const isManager = role === 'manager' || role === 'admin';
  const isViewer = true; // All authenticated users have at least viewer role

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAdmin,
        isManager,
        isViewer,
        loading,
        signIn,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
