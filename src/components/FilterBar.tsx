import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { FormulaMode, ViewFilterMode } from '../types';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: ViewFilterMode;
  onViewModeChange: (mode: ViewFilterMode) => void;
  formulaMode: FormulaMode;
  onFormulaModeChange: (mode: FormulaMode) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: string[];
  safetyBuffer: number;
  onSafetyBufferChange: (buffer: number) => void;
  onResetFilters: () => void;
  isFiltered: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  formulaMode,
  onFormulaModeChange,
  selectedCategory,
  onCategoryChange,
  categories,
  safetyBuffer,
  onSafetyBufferChange,
  onResetFilters,
  isFiltered
}) => {
  return (
    <div className="bg-white/90 rounded-xl px-3 py-2 border border-sky-200/90 shadow-2xs">
      {/* Single Unified Row for all Search, Sort & Filters */}
      <div className="flex items-center gap-2 w-full flex-wrap xl:flex-nowrap">
        {/* 1. Search Box (Flexible width) */}
        <div className="relative flex-1 min-w-[160px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="חיפוש לפי מק״ט או תיאור..."
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg pr-8 pl-6 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              title="נקה חיפוש"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* 2. View Mode Filter */}
        <select
          value={viewMode}
          onChange={e => onViewModeChange(e.target.value as ViewFilterMode)}
          className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shrink-0"
        >
          <option value="all">הצג את כל הפריטים</option>
          <option value="need_order">רק דורשים הזמנה</option>
          <option value="negative_stock">רק מלאי זמין שלילי</option>
          <option value="has_stock">רק פריטים במלאי</option>
        </select>

        {/* 3. Category Selector */}
        {categories.length > 0 && (
          <select
            value={selectedCategory}
            onChange={e => onCategoryChange(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer max-w-[150px] shrink-0 truncate"
          >
            <option value="">כל הקטגוריות ({categories.length})</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        )}

        {/* 4. Formula Mode Selector */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap hidden sm:inline">
            חישוב:
          </span>
          <select
            value={formulaMode}
            onChange={e => onFormulaModeChange(e.target.value as FormulaMode)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shrink-0"
          >
            <option value="avg6">צריכה 6 חודשים (קובץ)</option>
            <option value="avg3">צריכה 3 חודשים</option>
            <option value="avg12">צריכה 12 חודשים</option>
          </select>
        </div>

        {/* 5. Safety Buffer Selector */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap hidden sm:inline">
            מקדם:
          </span>
          <select
            value={safetyBuffer}
            onChange={e => onSafetyBufferChange(Number(e.target.value))}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shrink-0"
            title="מקדם ביטחון לזמן אספקה"
          >
            <option value={0}>ביטחון: 0%</option>
            <option value={10}>ביטחון: +10%</option>
            <option value={20}>ביטחון: +20%</option>
            <option value={30}>ביטחון: +30%</option>
          </select>
        </div>

        {/* 6. Clear Filters Button (When active) */}
        {isFiltered && (
          <button
            onClick={onResetFilters}
            type="button"
            className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer transition shrink-0 whitespace-nowrap"
            title="נקה את כל הסינונים"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">איפוס</span>
          </button>
        )}
      </div>
    </div>
  );
};
