import React from 'react';
import { Layers, AlertCircle, Eye } from 'lucide-react';

interface KpiCardsProps {
  totalItems: number;
  needOrderCount: number;
  shownCount: number;
  totalRecQty?: number;
  totalNetAvail?: number;
  negativeStockCount?: number;
}

function formatNum(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return Math.round(n).toLocaleString('en-US');
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  totalItems,
  needOrderCount,
  shownCount
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* 1. Total items */}
      <div className="bg-white/90 rounded-xl p-3 border border-sky-200/90 shadow-2xs flex items-center justify-between">
        <div>
          <div className="text-[11px] text-sky-900 font-bold">סה"כ פריטים</div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 num-cell mt-0.5">
            {formatNum(totalItems)}
          </div>
        </div>
        <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
          <Layers className="w-4 h-4" />
        </div>
      </div>

      {/* 2. Items needing order */}
      <div className="bg-white/90 rounded-xl p-3 border border-indigo-200/90 shadow-2xs flex items-center justify-between">
        <div>
          <div className="text-[11px] text-indigo-900 font-bold">דורשים הזמנה</div>
          <div className="text-lg sm:text-xl font-bold text-indigo-600 num-cell mt-0.5">
            {formatNum(needOrderCount)}
          </div>
        </div>
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
          <AlertCircle className="w-4 h-4" />
        </div>
      </div>

      {/* 3. Currently shown in table */}
      <div className="bg-white/90 rounded-xl p-3 border border-sky-200/90 shadow-2xs flex items-center justify-between">
        <div>
          <div className="text-[11px] text-sky-900 font-bold">מוצג בטבלה כעת</div>
          <div className="text-lg sm:text-xl font-bold text-slate-800 num-cell mt-0.5">
            {formatNum(shownCount)}
          </div>
        </div>
        <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
          <Eye className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

