import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { X, Shield, ShieldCheck, ShieldAlert, User, UserCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const usersCollection = collection(db, 'users');
    const unsubscribe = onSnapshot(
      usersCollection,
      snapshot => {
        const list: UserProfile[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          list.push({
            uid: docSnap.id,
            email: data.email || '',
            displayName: data.displayName || 'משתמש',
            photoURL: data.photoURL,
            role: data.role || 'viewer',
            createdAt: data.createdAt || '',
            updatedAt: data.updatedAt || '',
          });
        });
        setUsers(list);
        setLoading(false);
      },
      err => {
        console.error('Error fetching users:', err);
        setErrorMsg('שגיאה בטעינת רשימת המשתמשים');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRoleChange = async (targetUser: UserProfile, newRole: UserRole) => {
    if (targetUser.role === newRole) return;
    setUpdatingUid(targetUser.uid);
    setErrorMsg('');

    try {
      const now = new Date().toISOString();
      const userRef = doc(db, 'users', targetUser.uid);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: now
      });

      // Synchronize marker documents for Zero-Trust Firestore Security Rules
      const adminRef = doc(db, 'admins', targetUser.uid);
      const managerRef = doc(db, 'managers', targetUser.uid);

      if (newRole === 'admin') {
        await setDoc(adminRef, { email: targetUser.email, grantedAt: now });
        await setDoc(managerRef, { email: targetUser.email, grantedAt: now });
      } else if (newRole === 'manager') {
        try { await deleteDoc(adminRef); } catch { /* ignore if absent */ }
        await setDoc(managerRef, { email: targetUser.email, grantedAt: now });
      } else {
        // viewer
        try { await deleteDoc(adminRef); } catch { /* ignore */ }
        try { await deleteDoc(managerRef); } catch { /* ignore */ }
      }
    } catch (err: unknown) {
      console.error('Error changing role:', err);
      setErrorMsg(err instanceof Error ? err.message : 'שגיאה בעדכון הרשאת המשתמש');
    } finally {
      setUpdatingUid(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">ניהול הרשאות ומשתמשים (RBAC)</h3>
              <p className="text-xs text-slate-500">
                הגדר תפקידים ורמות גישה למשתמשים במערכת
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Roles Legend Banner */}
        <div className="px-5 py-3 bg-indigo-50/50 border-b border-indigo-100 text-xs text-slate-700 space-y-1.5">
          <div className="font-semibold text-indigo-900">הסבר על תפקידי המערכת:</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="p-2 bg-white rounded-lg border border-indigo-100">
              <span className="font-bold text-rose-700 block mb-0.5">מנהל מערכת (Admin)</span>
              <span>גישה מלאה: ניהול הרשאות, מחיקת פריטים, עריכה וסנכרון קטלוג.</span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-indigo-100">
              <span className="font-bold text-amber-700 block mb-0.5">מנהל רכש (Manager)</span>
              <span>עריכת מלאים, שינוי זמני אספקה, הוספת פריטים וטעינת CSV.</span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-indigo-100">
              <span className="font-bold text-slate-700 block mb-0.5">צפייה (Viewer)</span>
              <span>צפייה בדשבורד, סינון נתונים, הרצת נוסחאות וייצוא לאקסל.</span>
            </div>
          </div>
        </div>

        {/* User list */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs">טוען משתמשים...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              עדיין אין משתמשים רשומים במערכת
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {users.map(u => {
                const isCurrent = u.uid === currentUser?.uid;
                const isBootstrapAdmin = u.email?.toLowerCase() === 'eyalfr@gmail.com';

                return (
                  <div
                    key={u.uid}
                    className="p-3 bg-white flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm border border-slate-200">
                        {u.displayName?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                          <span>{u.displayName}</span>
                          {isCurrent && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              אתה
                            </span>
                          )}
                          {isBootstrapAdmin && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                              יוצר מערכת ראשי
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">{u.email}</div>
                      </div>
                    </div>

                    {/* Role Dropdown */}
                    <div className="flex items-center gap-2">
                      {updatingUid === u.uid ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                      ) : (
                        <select
                          value={u.role}
                          disabled={isBootstrapAdmin}
                          onChange={e => handleRoleChange(u, e.target.value as UserRole)}
                          className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 cursor-pointer"
                        >
                          <option value="admin">מנהל מערכת (Admin)</option>
                          <option value="manager">מנהל רכש (Manager)</option>
                          <option value="viewer">צפייה בלבד (Viewer)</option>
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-end bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
