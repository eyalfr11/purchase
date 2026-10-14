import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, ExternalLink } from 'lucide-react';
import { ComputedItem } from '../types';

interface DataTableProps {
  items: ComputedItem[];
  isManager: boolean;
  isAdmin: boolean;
  onRowClick: (item: ComputedItem) => void;
}

type SortKey = keyof ComputedItem;

function formatNum(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return Math.round(n).toLocaleString('en-US');
}

export const DataTable: React.FC<DataTableProps> = ({
  items,
  onRowClick
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('calcRec');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];
    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortDir === 'asc' ? valA.localeCompare(valB, 'he') : valB.localeCompare(valA, 'he');
    }
    const numA = typeof valA === 'number' ? valA : 0;
    const numB = typeof valB === 'number' ? valB : 0;
    return sortDir === 'asc' ? numA - numB : numB - numA;
  });

  const renderSortIndicator = (key: SortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 opacity-50 shrink-0" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-indigo-600 font-bold shrink-0" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-600 font-bold shrink-0" />
    );
  };

  // 10 Columns totaling 100% width - SKU column removed to maximize space for larger readable fonts
  const columns: {
    key: SortKey;
    label: string;
    widthPercent: string;
    highlight?: boolean;
    headerTooltip?: string;
  }[] = [
    { key: 'desc', label: 'תאור פריט', widthPercent: '25%' },
    { key: 'stock', label: 'מצאי', widthPercent: '7%' },
    { key: 'cust_ord', label: 'הזמנות לקוח', widthPercent: '8%' },
    { key: 'res_ord', label: 'הזמנות שמורות', widthPercent: '8%' },
    { key: 'po_imp', label: 'הזמנות רכש', widthPercent: '7%' },
    { key: 'ship_imp', label: 'משלוחי יבוא', widthPercent: '8%' },
    { key: 'lead_time', label: 'זמן אספקה (ימים)', widthPercent: '8%' },
    { key: 'avg3', label: 'צריכה (3 ח\')', widthPercent: '7%', headerTooltip: 'צריכה ממוצעת 3 חודשים' },
    { key: 'avg6', label: 'צריכה (6 ח\')', widthPercent: '8%', headerTooltip: 'צריכה ממוצעת 6 חודשים' },
    { key: 'avg12', label: 'צריכה (12 ח\')', widthPercent: '7%', headerTooltip: 'צריכה ממוצעת 12 חודשים' },
    { key: 'calcRec', label: 'כמות מומלצת להזמנה', widthPercent: '15%', highlight: true }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex-1 flex flex-col min-h-0">
      {/* Table container: fits 100% width without horizontal scrollbar */}
      <div className="overflow-y-auto flex-1 w-full">
        <table className="w-full text-right border-collapse table-fixed">
          <colgroup>
            {columns.map(col => (
              <col key={col.key} style={{ width: col.widthPercent }} />
            ))}
          </colgroup>

          <thead className="bg-slate-100/95 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10 select-none shadow-2xs backdrop-blur-xs text-xs sm:text-[12.5px]">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  title={col.headerTooltip || `לחץ למיון לפי ${col.label}`}
                  className={`py-2 px-2 cursor-pointer hover:bg-slate-200/80 transition-colors align-middle ${
                    col.highlight ? 'bg-indigo-50/80 text-indigo-950 font-extrabold' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="whitespace-normal break-words leading-tight text-right flex-1">
                      {col.label}
                    </span>
                    {renderSortIndicator(col.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs sm:text-[13px]">
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-slate-300" />
                    <span>לא נמצאו פריטים התואמים לסינון החיפוש הנוכחי</span>
                  </div>
                </td>
              </tr>
            ) : (
              sortedItems.map((item, index) => {
                const needsOrder = item.calcRec > 0;
                const isOddRow = index % 2 === 1;

                // Distinct, clearly visible light blue background for alternating odd rows
                const rowBgColor = needsOrder
                  ? (isOddRow ? '#e0e7ff' : '#eef2ff')
                  : (isOddRow ? '#dbeafe' : '#ffffff');

                return (
                  <tr
                    key={item.id || item.code}
                    onClick={() => onRowClick(item)}
                    style={{ backgroundColor: rowBgColor }}
                    className="cursor-pointer transition-colors hover:brightness-95 group"
                    title={`מק"ט: ${item.code} | לחץ לפתיחת פרטי הפריט, חישוב מלאי זמין ופעולות`}
                  >
                    {/* Description (תיאור הפריט) */}
                    <td className="py-2 px-2.5 text-slate-900 overflow-hidden text-ellipsis whitespace-nowrap" title={item.desc}>
                      <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {item.desc}
                      </span>
                      {item.notes && (
                        <span className="text-[11px] text-slate-400 mr-2 italic">
                          ({item.notes})
                        </span>
                      )}
                    </td>

                    {/* Stock (מצאי) */}
                    <td className="py-2 px-2 num-cell text-slate-800 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                      {formatNum(item.stock)}
                    </td>

                    {/* Customer Orders */}
                    <td
                      className={`py-2 px-2 num-cell whitespace-nowrap overflow-hidden text-ellipsis ${
                        item.cust_ord > 0 ? 'text-rose-600 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      {formatNum(item.cust_ord)}
                    </td>

                    {/* Reserved Orders */}
                    <td
                      className={`py-2 px-2 num-cell whitespace-nowrap overflow-hidden text-ellipsis ${
                        item.res_ord > 0 ? 'text-amber-700 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      {formatNum(item.res_ord)}
                    </td>

                    {/* Import Purchase Orders */}
                    <td
                      className={`py-2 px-2 num-cell whitespace-nowrap overflow-hidden text-ellipsis ${
                        item.po_imp > 0 ? 'text-emerald-700 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      {formatNum(item.po_imp)}
                    </td>

                    {/* Import Shipments */}
                    <td
                      className={`py-2 px-2 num-cell whitespace-nowrap overflow-hidden text-ellipsis ${
                        item.ship_imp > 0 ? 'text-emerald-700 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      {formatNum(item.ship_imp)}
                    </td>

                    {/* Lead time */}
                    <td className="py-2 px-2 num-cell text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.lead_time}
                    </td>

                    {/* Consumption 3, 6, 12 */}
                    <td className="py-2 px-2 num-cell text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis">
                      {formatNum(item.avg3)}
                    </td>
                    <td className="py-2 px-2 num-cell text-slate-900 font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                      {formatNum(item.avg6)}
                    </td>
                    <td className="py-2 px-2 num-cell text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis">
                      {formatNum(item.avg12)}
                    </td>

                    {/* Recommended Quantity */}
                    <td
                      className={`py-2 px-2.5 num-cell font-bold whitespace-nowrap overflow-hidden text-ellipsis ${
                        needsOrder ? 'text-indigo-800 font-extrabold text-xs sm:text-[13px]' : 'text-slate-400'
                      }`}
                    >
                      {needsOrder ? (
                        <div className="flex items-center justify-between">
                          <span>{formatNum(item.calcRec)}</span>
                          <ExternalLink className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition shrink-0" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span>-</span>
                          <ExternalLink className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition shrink-0" />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
