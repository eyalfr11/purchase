import React, { useState } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { parseCSVText } from '../utils/csv';
import { Item } from '../types';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCommitImport: (items: Partial<Item>[], mode: 'merge' | 'replace') => Promise<void>;
  isImporting: boolean;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onCommitImport,
  isImporting
}) => {
  const [parsedData, setParsedData] = useState<Partial<Item>[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const text = (evt.target?.result as string) || '';
        const items = parseCSVText(text);
        if (items.length === 0) {
          setErrorMsg('לא זוהו פריטים תקינים בקובץ. ודא שהקובץ תואם למבנה ה-CSV המקובל.');
          setParsedData([]);
        } else {
          setParsedData(items);
        }
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'שגיאה בפענוח קובץ ה-CSV');
        setParsedData([]);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleCommit = async () => {
    if (parsedData.length === 0) return;
    try {
      await onCommitImport(parsedData, importMode);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'שגיאה בעדכון מסד הנתונים');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">טעינת קובץ CSV למסד הנתונים</h3>
              <p className="text-xs text-slate-500">
                ייבוא נתונים מקובץ דוח רכש חיצוני, סנכרון מלאים וצריכה
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

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-6 text-center transition bg-slate-50/50">
            <input
              type="file"
              id="csvFileInput"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="csvFileInput"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-slate-800">
                {fileName ? fileName : 'לחץ לבחירת קובץ CSV מהמחשב'}
              </div>
              <div className="text-xs text-slate-500">
                תומך בקבצי CSV ו-TXT בקידוד UTF-8 או ANSI
              </div>
            </label>
          </div>

          {/* Preview of Parsed Items */}
          {parsedData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  זוהו בהצלחה {parsedData.length} פריטים בקובץ
                </span>
                <span className="text-slate-500">תצוגה מקדימה של 3 פריטים ראשונים</span>
              </div>

              {/* Sample Table */}
              <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs max-h-36">
                <table className="w-full text-right border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                    <tr>
                      <th className="p-2 border-b">מק"ט</th>
                      <th className="p-2 border-b">תיאור</th>
                      <th className="p-2 border-b">מצאי</th>
                      <th className="p-2 border-b">אספקה</th>
                      <th className="p-2 border-b">צריכה (6)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedData.slice(0, 3).map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 font-mono font-medium">{it.code}</td>
                        <td className="p-2 truncate max-w-[180px]">{it.desc}</td>
                        <td className="p-2 num-cell">{it.stock}</td>
                        <td className="p-2 num-cell">{it.lead_time}</td>
                        <td className="p-2 num-cell">{it.avg6}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Import Mode Selection */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="text-xs font-semibold text-slate-800">אופן עדכון מסד הנתונים:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label
                    className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                      importMode === 'merge'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-medium'
                        : 'border-slate-200 hover:bg-white text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div>עדכון ומיזוג פריטים (מומלץ)</div>
                      <div className="text-[11px] text-slate-500 font-normal">
                        מעדכן מלאים וצריכה בפריטים קיימים ומוסיף פריטים חדשים
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                      importMode === 'replace'
                        ? 'border-rose-600 bg-rose-50/50 text-rose-950 font-medium'
                        : 'border-slate-200 hover:bg-white text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <div>דריסה מלאה של הקטלוג</div>
                      <div className="text-[11px] text-slate-500 font-normal">
                        מחליף את נתוני הקטלוג כולו לפי תוכן הקובץ החדש
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-200 text-xs sm:text-sm font-medium transition cursor-pointer"
          >
            ביטול
          </button>
          <button
            type="button"
            disabled={parsedData.length === 0 || isImporting}
            onClick={handleCommit}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <span>{isImporting ? 'שומר במסד הנתונים...' : `ייבא ${parsedData.length} פריטים`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
