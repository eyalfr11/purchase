import React, { useState } from 'react';
import {
  Boxes,
  ShieldCheck,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  HelpCircle,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthGate: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset, loading } = useAuth();

  // Mode: 'email' or 'google'
  const [activeTab, setActiveTab] = useState<'email' | 'google'>('email');

  // In email mode: 'login' or 'register' or 'forgot'
  const [emailMode, setEmailMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDomainError, setIsDomainError] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedDomain, setCopiedDomain] = useState(false);

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  const parseAuthError = (err: unknown): { message: string; isDomain: boolean } => {
    const raw = err instanceof Error ? err.message : String(err);
    console.error('Auth error:', raw);

    if (raw.includes('auth/unauthorized-domain')) {
      return {
        message: `הדומיין הנוכחי (${currentDomain}) עדיין אינו מורשה ב-Firebase Authentication. יש להוסיף אותו ב-Firebase Console כדי לאפשר כניסה עם חשבון Google.`,
        isDomain: true
      };
    }
    if (raw.includes('auth/user-not-found') || raw.includes('auth/wrong-password') || raw.includes('auth/invalid-credential')) {
      return { message: 'כתובת הדוא״ל או הסיסמה שהוזנו אינם נכונים.', isDomain: false };
    }
    if (raw.includes('auth/email-already-in-use')) {
      return { message: 'כתובת דוא״ל זו כבר רשומה במערכת. אנא התחבר במקום להירשם.', isDomain: false };
    }
    if (raw.includes('auth/weak-password')) {
      return { message: 'הסיסמה חלשה מדי. נדרשים לפחות 6 תווים.', isDomain: false };
    }
    if (raw.includes('auth/invalid-email')) {
      return { message: 'כתובת דוא״ל לא תקינה.', isDomain: false };
    }
    if (raw.includes('auth/popup-closed-by-user')) {
      return { message: 'חלון ההתחברות של Google נסגר לפני השלמת הפעולה.', isDomain: false };
    }
    if (raw.includes('auth/popup-blocked')) {
      return { message: 'הדפדפן חסם את החלון הקופץ של Google. אנא אשר חלונות קופצים בדפדפן ונסה שוב.', isDomain: false };
    }

    return { message: raw || 'שגיאה בהתחברות. אנא נסה שוב.', isDomain: false };
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    setIsDomainError(false);
    setSuccessMsg('');
    try {
      await signInWithGoogle();
    } catch (err) {
      const parsed = parseAuthError(err);
      setErrorMsg(parsed.message);
      setIsDomainError(parsed.isDomain);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsDomainError(false);
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('נא להזין כתובת דוא״ל');
      return;
    }

    if (emailMode === 'forgot') {
      setIsSubmitting(true);
      try {
        await sendPasswordReset(email);
        setSuccessMsg(`קישור לאיפוס סיסמה נשלח אל ${email}. אנא בדוק את תיבת הדואר שלך.`);
      } catch (err) {
        const parsed = parseAuthError(err);
        setErrorMsg(parsed.message);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!password) {
      setErrorMsg('נא להזין סיסמה');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    setIsSubmitting(true);
    try {
      if (emailMode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, displayName.trim() || undefined);
      }
    } catch (err) {
      const parsed = parseAuthError(err);
      setErrorMsg(parsed.message);
      setIsDomainError(parsed.isDomain);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyDomainToClipboard = () => {
    if (currentDomain) {
      navigator.clipboard.writeText(currentDomain);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden" dir="rtl">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 relative z-10 text-center">
        {/* App Icon */}
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 mx-auto flex items-center justify-center text-white shadow-lg shadow-indigo-600/25 mb-4">
          <Boxes className="w-7 h-7" />
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-1.5">
          דוח המלצת רכש ומלאי
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mb-5 leading-relaxed max-w-sm mx-auto">
          מערכת ארגונית מאובטחת לניהול מלאי, חישוב המלצות רכש מבוססות צריכה וסנכרון נתונים בענן.
        </p>

        {/* Tab Switcher: Email vs Google */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('email');
              setErrorMsg('');
              setIsDomainError(false);
            }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'email'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-indigo-600" />
            <span>דוא״ל וסיסמה (כל כתובת)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('google');
              setErrorMsg('');
              setIsDomainError(false);
            }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'google'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {/* Google mini icon */}
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>חשבון Google</span>
          </button>
        </div>

        {/* Domain Error Notice Banner (when on Netlify or external domain) */}
        {isDomainError && (
          <div className="p-4 mb-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs text-right space-y-2.5 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>נדרש אישור דומיין ב-Firebase Console עבור כניסת Google</span>
            </div>

            <p className="text-amber-800 leading-relaxed">
              האתר מופעל כעת מהכתובת:
              <span className="font-mono bg-amber-100/90 text-amber-950 px-2 py-0.5 rounded mx-1 select-all font-bold">
                {currentDomain}
              </span>
            </p>

            <div className="bg-white/80 p-3 rounded-xl border border-amber-200 text-slate-700 space-y-1.5">
              <div className="font-semibold text-slate-900">איך מאשרים את הדומיין ב-2 דקות:</div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 pr-1">
                <li>היכנס אל <strong>Firebase Console</strong> ובחר בפרויקט שלך.</li>
                <li>עבור אל <strong>Authentication</strong> בתפריט הצד.</li>
                <li>בחר בלשונית <strong>Settings</strong> ולחץ על <strong>Authorized domains</strong>.</li>
                <li>לחץ על <strong>Add domain</strong> והדבק את הדומיין של Netlify.</li>
              </ol>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={copyDomainToClipboard}
                className="px-3 py-1.5 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedDomain ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>הדומיין הועתק ללוח!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>העתק דומיין: {currentDomain}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('email');
                  setErrorMsg('');
                  setIsDomainError(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition cursor-pointer mr-auto"
              >
                התחבר בדוא״ל במקום (פועל מיידית)
              </button>
            </div>
          </div>
        )}

        {/* Error message (non-domain error) */}
        {errorMsg && !isDomainError && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-right">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        {/* Success message */}
        {successMsg && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 text-right">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="flex-1">{successMsg}</span>
          </div>
        )}

        {/* TAB 1: EMAIL & PASSWORD AUTH */}
        {activeTab === 'email' && (
          <div>
            {/* Mode Switch: Login / Register / Forgot */}
            {emailMode !== 'forgot' ? (
              <div className="flex items-center justify-center gap-4 mb-4 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setEmailMode('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`font-bold transition pb-1 border-b-2 cursor-pointer ${
                    emailMode === 'login'
                      ? 'text-indigo-600 border-indigo-600'
                      : 'text-slate-400 border-transparent hover:text-slate-600'
                  }`}
                >
                  כניסה לחשבון קיים
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmailMode('register');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`font-bold transition pb-1 border-b-2 cursor-pointer ${
                    emailMode === 'register'
                      ? 'text-indigo-600 border-indigo-600'
                      : 'text-slate-400 border-transparent hover:text-slate-600'
                  }`}
                >
                  יצירת חשבון חדש
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-700">איפוס סיסמה למשתמש</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmailMode('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                >
                  חזרה לכניסה
                </button>
              </div>
            )}

            <form onSubmit={handleEmailSubmit} className="space-y-3.5 text-right">
              {/* Display name field (Registration only) */}
              {emailMode === 'register' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    שם מלא / כינוי
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="ישראל ישראלי"
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                    />
                  </div>
                </div>
              )}

              {/* Email field */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  כתובת דוא״ל (כל דוא״ל - עבודה / פרטי)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="user@company.com"
                    dir="ltr"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-right"
                  />
                </div>
              </div>

              {/* Password field (not for forgot mode) */}
              {emailMode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      סיסמה
                    </label>
                    {emailMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setEmailMode('forgot');
                          setErrorMsg('');
                          setSuccessMsg('');
                        }}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                      >
                        שכחת סיסמה?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="לפחות 6 תווים"
                      dir="ltr"
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-9 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-right"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || isSubmitting}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {emailMode === 'login' && (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>התחבר למערכת</span>
                      </>
                    )}
                    {emailMode === 'register' && (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>צור חשבון והתחבר</span>
                      </>
                    )}
                    {emailMode === 'forgot' && (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>שלח קישור איפוס סיסמה</span>
                      </>
                    )}
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: GOOGLE AUTH */}
        {activeTab === 'google' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              כניסה בלחיצה אחת עם חשבון Google של הארגון או חשבון פרטי.
            </p>

            <button
              onClick={handleGoogleLogin}
              disabled={loading || isSubmitting}
              type="button"
              className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm flex items-center justify-center gap-3 transition shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>התחבר באמצעות חשבון Google</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Security / RBAC Info Box */}
        <div className="mt-5 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-right">
          <div className="flex items-center gap-2 text-slate-800 text-xs font-semibold mb-1.5">
            <Lock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>הרשאות ורמות גישה (RBAC)</span>
          </div>
          <ul className="text-[11px] text-slate-500 space-y-1 list-none pr-1">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>משתמש חדש מקבל הרשאת צפייה (Viewer) לדשבורד</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>הרשאות עריכה, ניהול נתונים ומנהל ניתנות דרך מנהל המערכת</span>
            </li>
          </ul>
        </div>

        {/* Footer info */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>חיבור מאובטח באמצעות Firebase Authentication</span>
        </div>
      </div>
    </div>
  );
};
