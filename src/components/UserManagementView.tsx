import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut as secondarySignOut,
  updateProfile
} from 'firebase/auth';
import {
  UserPlus,
  ShieldCheck,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Trash2,
  X,
  Mail,
  Lock,
  User,
  Shield
} from 'lucide-react';
import { db } from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';

export const UserManagementView: React.FC = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Add User Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState<boolean>(false);
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newDisplayName, setNewDisplayName] = useState<string>('');
  const [newRole, setNewRole] = useState<UserRole>('viewer');
  const [isCreatingUser, setIsCreatingUser] = useState<boolean>(false);
  const [addUserError, setAddUserError] = useState<string>('');

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

  const handleDeleteUser = async (targetUser: UserProfile) => {
    if (targetUser.email.toLowerCase() === 'eyalfr@gmail.com') {
      setErrorMsg('לא ניתן למחוק את חשבון המנהל המייסד');
      return;
    }

    if (!window.confirm(`האם למחוק את המשתמש ${targetUser.email} (${targetUser.displayName})?`)) {
      return;
    }

    setUpdatingUid(targetUser.uid);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await deleteDoc(doc(db, 'users', targetUser.uid));
      try { await deleteDoc(doc(db, 'admins', targetUser.uid)); } catch {}
      try { await deleteDoc(doc(db, 'managers', targetUser.uid)); } catch {}

      setSuccessMsg(`המשתמש ${targetUser.email} הוסר בהצלחה ממערכת ההרשאות`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: unknown) {
      console.error('Error deleting user:', err);
      setErrorMsg(err instanceof Error ? err.message : 'שגיאה בהסרת המשתמש');
    } finally {
      setUpdatingUid(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError('');

    if (!newEmail.trim() || !newPassword.trim()) {
      setAddUserError('יש להזין כתובת דוא״ל וסיסמה');
      return;
    }

    if (newPassword.length < 6) {
      setAddUserError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    setIsCreatingUser(true);
    try {
      // Use secondary app so admin's active session is uninterrupted
      let secondaryApp;
      if (!getApps().some(a => a.name === 'SecondaryAdminApp')) {
        secondaryApp = initializeApp(firebaseConfig, 'SecondaryAdminApp');
      } else {
        secondaryApp = getApp('SecondaryAdminApp');
      }
      const secondaryAuth = getAuth(secondaryApp);

      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmail.trim(), newPassword.trim());
      const newUid = userCredential.user.uid;

      const formattedName = newDisplayName.trim() || newEmail.trim().split('@')[0];
      await updateProfile(userCredential.user, { displayName: formattedName });

      const now = new Date().toISOString();
      const userProfilePayload: UserProfile = {
        uid: newUid,
        email: newEmail.trim(),
        displayName: formattedName,
        role: newRole,
        createdAt: now,
        updatedAt: now
      };

      // Save user profile directly to Firestore
      await setDoc(doc(db, 'users', newUid), userProfilePayload);

      // Save marker documents if admin or manager
      if (newRole === 'admin') {
        await setDoc(doc(db, 'admins', newUid), { email: newEmail.trim(), grantedAt: now });
        await setDoc(doc(db, 'managers', newUid), { email: newEmail.trim(), grantedAt: now });
      } else if (newRole === 'manager') {
        await setDoc(doc(db, 'managers', newUid), { email: newEmail.trim(), grantedAt: now });
      }

      // Sign out secondary auth cleanly
      await secondarySignOut(secondaryAuth);

      setSuccessMsg(`משתמש חדש נוצר בהצלחה: ${newEmail.trim()} (${newRole === 'admin' ? 'מנהל מערכת' : newRole === 'manager' ? 'מנהל רכש' : 'צפייה בלבד'})`);
      setTimeout(() => setSuccessMsg(''), 5000);

      // Reset form & close modal
      setNewEmail('');
      setNewPassword('');
      setNewDisplayName('');
      setNewRole('viewer');
      setIsAddUserOpen(false);
    } catch (err: unknown) {
      console.error('Create user error:', err);
      const raw = err instanceof Error ? err.message : String(err);
      if (raw.includes('auth/email-already-in-use')) {
        setAddUserError('כתובת דוא״ל זו כבר קיימת במערכת');
      } else if (raw.includes('auth/invalid-email')) {
        setAddUserError('כתובת דוא״ל לא תקינה');
      } else {
        setAddUserError(raw || 'שגיאה ביצירת המשתמש');
      }
    } finally {
      setIsCreatingUser(false);
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
            <p>שליטה מלאה: ניהול משתמשים והרשאות, יצירת משתמשים חדשים, שינוי הגדרות, מחיקת פריטים, עריכת מלאים וטעינת CSV.</p>
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

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search box */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="חיפוש לפי שם או מייל..."
                className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Add User Button (Admins only) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setIsAddUserOpen(true);
                  setAddUserError('');
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 transition shadow-sm cursor-pointer shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>הוסף משתמש חדש</span>
              </button>
            )}
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

                  {/* Actions: Role Selector & Delete */}
                  <div className="flex items-center gap-2">
                    {updatingUid === u.uid ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                    ) : (
                      <>
                        <select
                          value={u.role}
                          disabled={isBootstrapAdmin || !isAdmin}
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

                        {isAdmin && !isBootstrapAdmin && !isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            title="הסר משתמש"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADD USER MODAL */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in">
            <button
              type="button"
              onClick={() => setIsAddUserOpen(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">הוספת משתמש חדש למערכת</h3>
                <p className="text-xs text-slate-500">יצירת חשבון והגדרת הרשאות גישה מראש</p>
              </div>
            </div>

            {addUserError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{addUserError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-right">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  שם מלא / כינוי
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={newDisplayName}
                    onChange={e => setNewDisplayName(e.target.value)}
                    placeholder="ישראל ישראלי"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  כתובת דוא״ל
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="user@company.com"
                    dir="ltr"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  סיסמה ראשונית (לפחות 6 תווים)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  רמת הרשאה (RBAC)
                </label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                  >
                    <option value="viewer">צפייה בלבד (Viewer)</option>
                    <option value="manager">מנהל רכש (Manager)</option>
                    <option value="admin">מנהל מערכת (Admin)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 transition shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {isCreatingUser ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>צור משתמש</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

