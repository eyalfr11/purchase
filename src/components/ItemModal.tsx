import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Trash2,
  Calculator,
  AlertCircle,
  PackageCheck,
  TrendingDown,
  Lock,
  Layers,
  Clock
} from 'lucide-react';
import { Item, ComputedItem } from '../types';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Partial<Item>) => Promise<void>;
  onDelete?: (item: ComputedItem) => Promise<void>;
  item: ComputedItem | null;
  isSaving: boolean;
  isManager: boolean;
  isAdmin: boolean;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  item,
  isSaving,
  isManager,
  isAdmin
}) => {
  const isEdit = !!item;

  const [code, setCode] = useState('');
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('');
  const [series, setSeries] = useState('');
  const [stock, setStock] = useState(0);
  const [custOrd, setCustOrd] = useState(0);
  const [resOrd, setResOrd] = useState(0);
  const [poImp, setPoImp] = useState(0);
  const [shipImp, setShipImp] = useState(0);
  const [leadTime, setLeadTime] = useState(90);
  const [avg3, setAvg3] = useState(0);
  const [avg6, setAvg6] = useState(0);
  const [avg12, setAvg12] = useState(0);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (item) {
      setCode(item.code || '');
      setDesc(item.desc || '');
      setCat(item.cat || '');
      setSeries(item.series || '');
      setStock(item.stock || 0);
      setCustOrd(item.cust_ord || 0);
      setResOrd(item.res_ord || 0);
      setPoImp(item.po_imp || 0);
      setShipImp(item.ship_imp || 0);
      setLeadTime(item.lead_time || 90);
      setAvg3(item.avg3 || 0);
      setAvg6(item.avg6 || 0);
      setAvg12(item.avg12 || 0);
      setNotes(item.notes || '');
    } else {
      setCode('');
      setDesc('');
      setCat('');
      setSeries('');
      setStock(0);
      setCustOrd(0);
      setResOrd(0);
      setPoImp(0);
      setShipImp(0);
      setLeadTime(90);
      setAvg3(0);
      setAvg6(0);
      setAvg12(0);
      setNotes('');
    }
    setErrorMsg('');
  }, [item, isOpen]);

  if (!isOpen) return null;

  // Real-time calculation preview
  const liveNetAvail = stock - custOrd - resOrd + poImp + shipImp;
  const liveExpectedConsumption = (leadTime / 30.0) * Math.max(0, avg6);
  const liveShortfall = liveExpectedConsumption - liveNetAvail;
  const liveRec = liveShortfall > 0 ? Math.round(liveShortfall) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManager) return;

    if (!code.trim()) {
      setErrorMsg('נא להזין מק״ט פריט תקין');
      return;
    }
    if (!desc.trim()) {
      setErrorMsg('נא להזין תיאור לפריט');
      return;
    }

    try {
      setErrorMsg('');
      await onSave({
        id: item?.id || code.trim(),
        code: code.trim(),
        desc: desc.trim(),
        cat: cat.trim(),
        series: series.trim(),
        stock: Number(stock) || 0,
        cust_ord: Number(custOrd) || 0,
        res_ord: Number(resOrd) || 0,
        po_imp: Number(poImp) || 0,
        ship_imp: Number(shipImp) || 0,
        lead_time: Number(leadTime) || 90,
        avg3: Number(avg3) || 0,
        avg6: Number(avg6) || 0,
        avg12: Number(avg12) || 0,
        notes: notes.trim()
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'שגיאה בשמירת הפריט');
    }
  };

  const handleDelete = async () => {
    if (!item || !onDelete || !isAdmin) return;
    const confirmed = window.confirm(`האם אתה בטוח שברצונך למחוק את פריט ${item.code} (${item.desc}) ממסד הנתונים?`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDelete(item);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'שגיאה במחיקת הפריט');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-mono font-bold text-sm">
              #
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {item ? `${item.code} - ${item.desc}` : 'הוספת פריט'}
                </h3>
                {!isManager && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>צפייה בלבד</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {isManager ? 'עריכת כמויות מלאי, זמני אספקה וצריכה' : 'פירוט מלאי, נוסחת רכש וצריכה'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Calculation Cards: Net Available + Recommended Quantity */}
        <div className="px-5 py-3 bg-indigo-50/40 border-b border-indigo-100 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          {/* Net Available Card */}
          <div className="p-2.5 bg-white rounded-xl border border-indigo-100 shadow-2xs">
            <div className="text-[11px] text-slate-500 font-medium">מלאי זמין נטו:</div>
            <div className={`text-base font-bold num-cell mt-0.5 ${liveNetAvail < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {liveNetAvail.toLocaleString()} יח'
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              מצאי פחות הזמנות ועוד רכש בדרך
            </div>
          </div>

          {/* Recommended PO Card */}
          <div className="p-2.5 bg-white rounded-xl border border-indigo-100 shadow-2xs">
            <div className="text-[11px] text-indigo-700 font-medium">המלצת רכש להזמנה:</div>
            <div className="text-base font-bold text-indigo-600 num-cell mt-0.5">
              {liveRec > 0 ? `${liveRec.toLocaleString()} יח'` : 'אין צורך ברכש'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              צריכה צפויה: {Math.round(liveExpectedConsumption).toLocaleString()} יח'
            </div>
          </div>

          {/* Lead time & Monthly rate Card */}
          <div className="p-2.5 bg-white rounded-xl border border-indigo-100 shadow-2xs col-span-2 sm:col-span-1">
            <div className="text-[11px] text-slate-500 font-medium">אספקה וצריכה:</div>
            <div className="text-xs font-semibold text-slate-800 mt-0.5">
              {leadTime} ימים ({Math.round((leadTime / 30) * 10) / 10} חודשים)
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              קצב צריכה: {avg6.toLocaleString()} יח'/חודש
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Basic details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                מק״ט פריט
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                disabled
                className="w-full text-xs sm:text-sm bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 font-mono font-bold text-slate-800 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                תיאור פריט
              </label>
              <input
                type="text"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                disabled={!isManager}
                className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">קטגוריה</label>
              <input
                type="text"
                value={cat}
                onChange={e => setCat(e.target.value)}
                disabled={!isManager}
                placeholder="שטיחים ודשא / למינציה / פרקט"
                className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">סדרה</label>
              <input
                type="text"
                value={series}
                onChange={e => setSeries(e.target.value)}
                disabled={!isManager}
                placeholder="רויאל / הלבטיק / מטריקס"
                className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-600"
              />
            </div>
          </div>

          {/* Section 2: Stock metrics */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 mb-2">נתוני מלאי והזמנות</h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">מצאי פיזי</label>
                <input
                  type="number"
                  value={stock}
                  onChange={e => setStock(parseFloat(e.target.value) || 0)}
                  disabled={!isManager}
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-600"
                />
              </div>
              <div>
                <label className="block text-[11px] text-rose-600 mb-1">הזמנות לקוח (-)</label>
                <input
                  type="number"
                  value={custOrd}
                  onChange={e => setCustOrd(parseFloat(e.target.value) || 0)}
                  disabled={!isManager}
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-600"
                />
              </div>
              <div>
                <label className="block text-[11px] text-amber-700 mb-1">שמורות (-)</label>
                <input
                  type="number"
                  value={resOrd}
                  onChange={e => setResOrd(parseFloat(e.target.value) || 0)}
                  disabled={!isManager}
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-600"
                />
              </div>
              <div>
                <label className="block text-[11px] text-emerald-700 mb-1">הזמנות רכש (+)</label>
                <input
                  type="number"
                  value={poImp}
                  onChange={e => setPoImp(parseFloat(e.target.value) || 0)}
                  disabled={!isManager}
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-600"
                />
              </div>
              <div>
                <label className="block text-[11px] text-emerald-700 mb-1">משלוחי יבוא (+)</label>
                <input
                  type="number"
                  value={shipImp}
                  onChange={e => setShipImp(parseFloat(e.target.value) || 0)}
                  disabled={!isManager}
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Consumption & Lead time */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 mb-2">זמן אספקה וצריכה ממוצעת</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">אספקה (ימים)</label>
                <input
                  type="number"
                  min="0"
                  value={leadTime}
                  onChange={e => setLeadTime(parseFloat(e.target.value) || 0)}
                  disabled={!isManager}
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-600"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">צריכה (3 חודשים)</label>
                <input
                  type="number"
                  value={avg3}
                  onChange={e => setAvg3(parseFloat(e.target.value) || 0)}
                  disabled={!isManager}
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-indigo-700 mb-1">
                  צריכה (6 חודשים)
                </label>
                <input
                  type="number"
                  value={avg6}
                  onChange={e => setAvg6(parseFloat(e.target.value) || 0)}
                  disabled={!isManager}
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-600"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">צריכה (12 חודשים)</label>
                <input
                  type="number"
                  value={avg12}
                  onChange={e => setAvg12(parseFloat(e.target.value) || 0)}
                  disabled={!isManager}
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              הערות פנימיות ועדכוני ספק
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={!isManager}
              placeholder="רשום הערות פנימיות למעקב..."
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-600"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
            <div>
              {isAdmin && isEdit && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting || isSaving}
                  className="px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 border border-rose-200 transition cursor-pointer disabled:opacity-50"
                  title="מחק פריט זה ממסד הנתונים לצמיתות"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'מוחק...' : 'מחק פריט'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-medium transition cursor-pointer"
              >
                {isManager ? 'ביטול' : 'סגור'}
              </button>

              {isManager && (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'שומר במסד הנתונים...' : 'שמור שינויים'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
