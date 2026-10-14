import React, { useState } from 'react';
import {
  Settings,
  Save,
  Sliders,
  Database,
  ShieldCheck,
  CheckCircle2,
  Building,
  Bell
} from 'lucide-react';
import { FormulaMode } from '../types';

interface SettingsViewProps {
  formulaMode: FormulaMode;
  onFormulaModeChange: (mode: FormulaMode) => void;
  safetyBuffer: number;
  onSafetyBufferChange: (buffer: number) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  formulaMode,
  onFormulaModeChange,
  safetyBuffer,
  onSafetyBufferChange
}) => {
  const [companyName, setCompanyName] = useState('מערך לוגיסטיקה ורכש');
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-2 sm:p-4">
      {savedMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>ההגדרות נשמרו בהצלחה!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Calculation parameters */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">פרמטרי ברירת מחדל לחישוב רכש</h2>
              <p className="text-xs text-slate-500">
                קביעת תקופת צריכה ומקדמי ביטחון החלים על כלל המערכת
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                נוסחת צריכה ממוצעת ברירת מחדל
              </label>
              <select
                value={formulaMode}
                onChange={e => onFormulaModeChange(e.target.value as FormulaMode)}
                className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="avg6">צריכה ממוצעת 6 חודשים (קובץ / ERP מומלץ)</option>
                <option value="avg3">צריכה ממוצעת 3 חודשים (תגובה מהירה לשינויי ביקוש)</option>
                <option value="avg12">צריכה ממוצעת 12 חודשים (שנתי מלא ויציב)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                קובע את קצב הצריכה החודשי לפיו מחושב החוסר הצפוי עד הגעת ההזמנה.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                מקדם ביטחון לזמן אספקה (Safety Buffer)
              </label>
              <select
                value={safetyBuffer}
                onChange={e => onSafetyBufferChange(Number(e.target.value))}
                className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value={0}>0% (חישוב לפי ימי אספקה מקוריים)</option>
                <option value={10}>+10% (מרווח קל למניעת צווארי בקבוק)</option>
                <option value={20}>+20% (מרווח מומלץ למוצרי יבוא ימי)</option>
                <option value={30}>+30% (מלאי ביטחון מוגבר לתקופות עומס)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                מגדיל את זמן האספקה המשוער כדי לכסות עיכובים בלוגיסטיקה ובשילוח.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: General Info */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Building className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">פרטי ארגון ומחלקה</h2>
              <p className="text-xs text-slate-500">
                פרטים שיוצגו בראש הדוחות ובייצוא קבצי אקסל
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                שם הארגון / מחלקת רכש
              </label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                התראות מלאי קריטי
              </label>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <span>הדגשת מלאי שלילי באדום בולט</span>
                <span className="text-emerald-600 font-semibold">פעיל תמיד</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Cloud Database & Architecture Details */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Database className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">תשתית מסד הנתונים בענן (Cloud Firestore)</h2>
              <p className="text-xs text-slate-500">
                פרטי הפרויקט המקושר ומערך האבטחה
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Firebase Project ID</span>
              <span className="font-mono font-bold text-slate-800">cultivated-notch-dwgw1</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block mb-0.5">מערך אבטחה והרשאות</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero-Trust ABAC Security Rules</span>
              </span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>שמור שינויים</span>
          </button>
        </div>
      </form>
    </div>
  );
};
