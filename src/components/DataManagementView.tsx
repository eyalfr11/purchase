import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  Download,
  Database,
  RefreshCw,
  History,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Item, ComputedItem, AuditLogEntry } from '../types';
import { parseCSVText, exportItemsToCsv } from '../utils/csv';
import { useAuth } from '../context/AuthContext';

interface DataManagementViewProps {
  items: ComputedItem[];
  onCommitImport: (items: Partial<Item>[], mode: 'merge' | 'replace') => Promise<void>;
  onSeedInitialData: () => Promise<void>;
  isProcessing: boolean;
  isDbConnected: boolean;
}

export const DataManagementView: React.FC<DataManagementViewProps> = ({
  items,
  onCommitImport,
  onSeedInitialData,
  isProcessing,
  isDbConnected
}) => {
  const { user } = useAuth();

  // Import State
  const [parsedData, setParsedData] = useState<Partial<Item>[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importError, setImportError] = useState<string>('');
  const [importSuccess, setImportSuccess] = useState<string>('');

  // Export State
  const [exportFilter, setExportFilter] = useState<'all' | 'need_order'>('all');

  // Audit Logs State
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(true);

  useEffect(() => {
    const logsQuery = query(
      collection(db, 'audit_logs'),
      orderBy('timestamp', 'desc'),
      limit(25)
    );

    const unsubscribe = onSnapshot(
      logsQuery,
      snapshot => {
        const list: AuditLogEntry[] = [];
        snapshot.forEach(docSnap => {
          const d = docSnap.data();
          list.push({
            id: docSnap.id,
            action: d.action || '',
            itemCode: d.itemCode,
            details: d.details || '',
            userId: d.userId || '',
            userEmail: d.userEmail || '',
            timestamp: d.timestamp || ''
          });
        });
        setLogs(list);
        setLoadingLogs(false);
      },
      err => {
        console.error('Audit logs error:', err);
        setLoadingLogs(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError('');
    setImportSuccess('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const text = (evt.target?.result as string) || '';
        const parsed = parseCSVText(text);
        if (parsed.length === 0) {
          setImportError('לא זוהו פריטים תקינים בקובץ. אנא בדוק את מבנה ה-CSV.');
          setParsedData([]);
        } else {
          setParsedData(parsed);
        }
      } catch (err: unknown) {
        setImportError(err instanceof Error ? err.message : 'שגיאה בפענוח קובץ ה-CSV');
        setParsedData([]);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleExecuteImport = async () => {
    if (parsedData.length === 0) return;
    setImportError('');
    setImportSuccess('');

    try {
      await onCommitImport(parsedData, importMode);
      setImportSuccess(`נטענו ועודכנו ${parsedData.length} פריטים בהצלחה במסד הנתונים!`);
      setParsedData([]);
      setFileName('');
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'שגיאה בעדכון מסד הנתונים');
    }
  };

  const handleExecuteExport = () => {
    const toExport = exportFilter === 'need_order'
      ? items.filter(i => i.calcRec > 0)
      : items;

    exportItemsToCsv(
      toExport,
      `דוח_המלצת_רכש_${exportFilter === 'need_order' ? 'הזמנות_בלבד' : 'מלא'}_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'edit_item':
        return { text: 'עריכת פריט', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'create_item':
        return { text: 'הוספת פריט', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'delete_item':
        return { text: 'מחיקת פריט', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'import_csv':
        return { text: 'טעינת CSV', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'seed_initial':
        return { text: 'סנכרון ראשוני', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { text: action, color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-2 sm:p-4">
      {/* Top Cards: Status summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">פריטים במאגר הענן</div>
            <div className="text-2xl font-bold text-slate-900 num-cell mt-1">
              {items.length.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>מסונכרן בזמן אמת עם Firestore</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">פריטים הדורשים הזמנה</div>
            <div className="text-2xl font-bold text-indigo-600 num-cell mt-1">
              {items.filter(i => i.calcRec > 0).length.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              סה"כ {items.filter(i => i.calcRec > 0).reduce((acc, i) => acc + i.calcRec, 0).toLocaleString()} יח'
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">סנכרון ראשוני לקטלוג</div>
            <div className="text-xs text-slate-600 mt-1">
              טעינת 164 פריטי הבסיס למסד הנתונים
            </div>
          </div>
          <button
            onClick={onSeedInitialData}
            disabled={isProcessing}
            type="button"
            className="mt-2 w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? 'מסנכרן נתונים...' : 'סנכרון 164 פריטים'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Import & Export Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: CSV Import */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">טעינת קובץ נתונים (CSV)</h2>
              <p className="text-xs text-slate-500">
                ייבוא נתונים מקובץ דוח רכש חיצוני, סנכרון מלאים וצריכה
              </p>
            </div>
          </div>

          {importSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{importSuccess}</span>
            </div>
          )}

          {importError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{importError}</span>
            </div>
          )}

          {/* File Picker */}
          <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-5 text-center transition bg-slate-50/60">
            <input
              type="file"
              id="csvFileInputDataMgmt"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="csvFileInputDataMgmt"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
              <span className="text-xs sm:text-sm font-semibold text-slate-800">
                {fileName ? fileName : 'לחץ לבחירת קובץ CSV או גרור לכאן'}
              </span>
              <span className="text-[11px] text-slate-400">
                תומך בקבצי CSV ו-TXT בקידוד עברית (UTF-8)
              </span>
            </label>
          </div>

          {/* If file parsed */}
          {parsedData.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  זוהו {parsedData.length} פריטים בקובץ
                </span>
                <span className="text-slate-400">מוכן לשמירה</span>
              </div>

              {/* Mode Selection */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label
                  className={`p-2.5 rounded-xl border cursor-pointer transition flex items-start gap-2 ${
                    importMode === 'merge'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-medium'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="mgmtImportMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="font-semibold">מיזוג ועדכון פריטים</div>
                    <div className="text-[10px] text-slate-500">מעדכן פריטים קיימים ומוסיף חדשים</div>
                  </div>
                </label>

                <label
                  className={`p-2.5 rounded-xl border cursor-pointer transition flex items-start gap-2 ${
                    importMode === 'replace'
                      ? 'border-rose-600 bg-rose-50/50 text-rose-950 font-medium'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="mgmtImportMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <div className="font-semibold">דריסת כל הקטלוג</div>
                    <div className="text-[10px] text-slate-500">מחליף את כל נתוני הקטלוג בתוכן הקובץ</div>
                  </div>
                </label>
              </div>

              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isProcessing}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <span>{isProcessing ? 'שומר במסד הנתונים...' : `שמור ${parsedData.length} פריטים בענן`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Section 2: CSV Export */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">ייצוא קובץ נתונים (CSV / Excel)</h2>
                <p className="text-xs text-slate-500">
                  הורדת הדוח בקידוד עברית מלא (UTF-8 עם BOM) לפתיחה נקייה באקסל
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block font-semibold text-slate-700">בחר תוכן לייצוא:</label>
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-2 ${
                    exportFilter === 'all'
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-medium'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="exportFilterOption"
                    value="all"
                    checked={exportFilter === 'all'}
                    onChange={() => setExportFilter('all')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>כל הקטלוג ({items.length} פריטים)</span>
                </label>

                <label
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-2 ${
                    exportFilter === 'need_order'
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-medium'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="exportFilterOption"
                    value="need_order"
                    checked={exportFilter === 'need_order'}
                    onChange={() => setExportFilter('need_order')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>רק פריטים לרכש ({items.filter(i => i.calcRec > 0).length})</span>
                </label>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExecuteExport}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>הורד קובץ אקסל (CSV) עכשיו</span>
          </button>
        </div>
      </div>

      {/* Section 3: Embedded Audit Trail */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">יומן שינויים ופעולות אחרונות (Audit Trail)</h2>
              <p className="text-xs text-slate-500">
                תיעוד מלא של מי ביצע עדכון, ייבוא או סנכרון במסד הנתונים
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {logs.length} רשומות אחרונות
          </span>
        </div>

        {loadingLogs ? (
          <div className="py-8 flex justify-center text-slate-400 text-xs">
            טוען יומן שינויים...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            עדיין לא נרשמו פעולות במערכת
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
            {logs.slice(0, 10).map(log => {
              const badge = getActionBadge(log.action);
              const dateStr = log.timestamp ? new Date(log.timestamp).toLocaleString('he-IL') : '-';

              return (
                <div key={log.id} className="p-3 bg-white hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2 py-0.5 rounded-md font-semibold border ${badge.color}`}>
                      {badge.text}
                    </span>
                    {log.itemCode && (
                      <span className="font-mono font-bold text-slate-800">
                        {log.itemCode}
                      </span>
                    )}
                    <span className="text-slate-700">{log.details}</span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0">
                    <span className="font-mono">{log.userEmail}</span>
                    <span>{dateStr}</span>
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
