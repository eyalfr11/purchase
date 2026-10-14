import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  UserCheck
} from 'lucide-react';
import { db } from '../firebase';
import { UserProfile, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';

export const UserManagementView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
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
  }, []);

  const handleRoleChange = async (targetUser: UserProfile, newRole: UserRole) => {
    if (targetUser.role === newRole) return;
    setUpdatingUid(targetUser.uid);
    setErrorMsg('');
    setSuccessMsg('');

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

      setSuccessMsg(`הרשאת המשתמש ${targetUser.email} עודכנה ל-${newRole === 'admin' ? 'מנהל מערכת' : newRole === 'manager' ? 'מנהל רכש' : 'צפייה בלבד'}`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: unknown) {
      console.error('Error changing role:', err);
      setErrorMsg(err instanceof Error ? err.message : 'שגיאה בעדכון הרשאת המשתמש');
    } finally {
      setUpdatingUid(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      u.email.toLowerCase().includes(q) ||
      u.displayName.toLowerCase().includes(q)
    );
  });

  const adminsCount = users.filter(u => u.role === 'admin').length;
  const managersCount = users.filter(u => u.role === 'manager').length;
  const viewersCount = users.filter(u => u.role === 'viewer').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-2 sm:p-4">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">סה"כ משתמשים רשומים</div>
          <div className="text-2xl font-bold text-slate-900 num-cell mt-1">
            {users.length}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-rose-100 bg-rose-50/20 shadow-2xs">
          <div className="text-xs text-rose-700 font-medium">מנהלי מערכת (Admins)</div>
          <div className="text-2xl font-bold text-rose-600 num-cell mt-1">
            {adminsCount}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-amber-100 bg-amber-50/20 shadow-2xs">
          <div className="text-xs text-amber-700 font-medium">מנהלי רכש (Managers)</div>
          <div className="text-2xl font-bold text-amber-600 num-cell mt-1">
            {managersCount}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">צפייה בלבד (Viewers)</div>
          <div className="text-2xl font-bold text-slate-700 num-cell mt-1">
            {viewersCount}
          </div>
        </div>
      </div>

      {/* Roles Legend Box */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900">מדריך רמות הרשאה (RBAC)</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-rose-700 block">מנהל מערכת (Admin)</span>
            <p>שליטה מלאה: ניהול משתמשים והרשאות, שינוי הגדרות, מחיקת פריטים, עריכת מלאים, טעינת קבצי CSV וסנכרון קטלוג.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-amber-700 block">מנהל רכש (Manager)</span>
            <p>גישה לדשבורד וניהול נתונים: עריכת כמויות מלאי, שינוי זמני אספקה, הוספת פריטים חדשים, וטעינת קבצי CSV.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-700 block">צפייה בלבד (Viewer - ברירת מחדל)</span>
            <p>משתמש רשום יוגדר כברירת מחדל עם הרשאת קריאה בלבד: צפייה בדשבורד, סינון וייצוא לאקסל ללא גישה לשאר התפריטים.</p>
          </div>
        </div>
      </div>

      {/* User List Table */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">רשימת משתמשי המערכת</h2>
            <p className="text-xs text-slate-500">
              שינוי הרשאה מעדכן מיידית את מסד הנתונים ואת חוקי האבטחה
            </p>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="חיפוש לפי שם או מייל..."
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex justify-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            לא נמצאו משתמשים התואמים לחיפוש
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {filteredUsers.map(u => {
              const isCurrent = u.uid === currentUser?.uid;
              const isBootstrapAdmin = u.email?.toLowerCase() === 'eyalfr@gmail.com';

              return (
                <div
                  key={u.uid}
                  className="p-3.5 bg-white flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm border border-slate-200">
                      {u.displayName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <span>{u.displayName}</span>
                        {isCurrent && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                            החשבון שלך
                          </span>
                        )}
                        {isBootstrapAdmin && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                            מנהל מייסד
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{u.email}</div>
                    </div>
                  </div>

                  {/* Role Selector */}
                  <div className="flex items-center gap-2">
                    {updatingUid === u.uid ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                    ) : (
                      <select
                        value={u.role}
                        disabled={isBootstrapAdmin}
                        onChange={e => handleRoleChange(u, e.target.value as UserRole)}
                        className={`text-xs rounded-xl px-3 py-1.5 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 cursor-pointer border ${
                          u.role === 'admin'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : u.role === 'manager'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
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
    </div>
  );
};
