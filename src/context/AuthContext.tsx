import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, loginWithGoogle, logoutUser, handleFirestoreError, OperationType } from '../firebase';
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
        if (isBootstrapAdmin) {
          currentRole = 'admin';
        } else if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          if (data?.role === 'admin' || data?.role === 'manager' || data?.role === 'viewer') {
            currentRole = data.role;
          }
        }

        const now = new Date().toISOString();
        const profileData: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'משתמש',
          photoURL: currentUser.photoURL || undefined,
          role: currentRole,
          createdAt: userDocSnap.exists() ? (userDocSnap.data().createdAt || now) : now,
          updatedAt: now,
        };

        // If user document does not exist yet or role needs initial sync
        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, profileData);
        }

        // If user is bootstrap admin, ensure the admin marker document exists
        if (isBootstrapAdmin) {
          const adminDocRef = doc(db, 'admins', currentUser.uid);
          const adminSnap = await getDoc(adminDocRef);
          if (!adminSnap.exists()) {
            await setDoc(adminDocRef, {
              email: currentUser.email,
              grantedAt: now,
            });
          }
        }

        setProfile(profileData);
        setRole(currentRole);
      } catch (err) {
        console.error('Error syncing user profile:', err);
        // Fallback for UI if rules or offline
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
      console.error('Failed to sign in:', err);
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
