import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { X, History, RefreshCw, AlertCircle, FileText, CheckCircle2, UserCheck } from 'lucide-react';
import { db } from '../firebase';
import { AuditLogEntry } from '../types';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const logsQuery = query(
      collection(db, 'audit_logs'),
      orderBy('timestamp', 'desc'),
      limit(50)
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
            timestamp: d.timestamp || '',
          });
        });
        setLogs(list);
        setLoading(false);
      },
      err => {
        console.error('Error fetching audit logs:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">יומן שינויים ופעולות (Audit Trail)</h3>
              <p className="text-xs text-slate-500">
                מעקב שקוף אחר עדכוני מלאי, שינויי זמני אספקה וטעינת קבצים
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
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs">טוען יומן שינויים...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              טרם נרשמו פעולות במסד הנתונים
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
              {logs.map(log => {
                const badge = getActionBadge(log.action);
                const dateStr = log.timestamp ? new Date(log.timestamp).toLocaleString('he-IL') : '-';

                return (
                  <div key={log.id} className="p-3 bg-white hover:bg-slate-50 transition flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md font-semibold border ${badge.color}`}>
                          {badge.text}
                        </span>
                        {log.itemCode && (
                          <span className="font-mono font-bold text-slate-800">
                            מק"ט {log.itemCode}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">{dateStr}</span>
                    </div>
                    <div className="text-slate-700 mt-0.5">{log.details}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      בוצע ע"י: {log.userEmail || log.userId}
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
