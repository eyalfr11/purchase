import React, { useState } from 'react';
import { Menu, Database, Info, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { NavItemKey } from './Sidebar';

interface HeaderProps {
  activeTab: NavItemKey;
  totalItemsCount: number;
  isDbConnected: boolean;
  onOpenMobileSidebar: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebarCollapse: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  totalItemsCount,
  isDbConnected,
  onOpenMobileSidebar,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
}) => {
  const [showFormulaTooltip, setShowFormulaTooltip] = useState(false);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'דשבורד המלצת רכש ומלאי',
          subtitle: 'ניהול ובקרה על פריטים, צריכה ממוצעת וחישוב כמויות רכש מומלצות'
        };
      case 'data_management':
        return {
          title: 'ניהול נתונים, יבוא ויצוא',
          subtitle: 'טעינת קובץ CSV, ייצוא דוחות לאקסל וסנכרון מסד הנתונים'
        };
      case 'user_management':
        return {
          title: 'ניהול משתמשים והרשאות',
          subtitle: 'הגדרת תפקידים ורמות גישה (RBAC) לעובדי ומנהלי הארגון'
        };
      case 'settings':
        return {
          title: 'הגדרות מערכת',
          subtitle: 'קביעת נוסחאות ברירת מחדל, מקדמי ביטחון ופרטי המערכת'
        };
      default:
        return {
          title: 'דוח המלצת רכש',
          subtitle: ''
        };
    }
  };

  const pageInfo = getPageTitle();

  return (
    <header className="bg-sky-100 border-b border-sky-300 sticky top-0 z-20 shadow-2xs">
      <div className="w-full px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Right side: Menu Toggle & Page Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={onOpenMobileSidebar}
            type="button"
            className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            title="פתח תפריט ניווט"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop sidebar toggle button */}
          <button
            onClick={onToggleSidebarCollapse}
            type="button"
            className="hidden md:flex p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            title={isSidebarCollapsed ? 'הרחב תפריט צד' : 'סגור / כווץ תפריט צד (רווח מקסימלי לטבלה)'}
          >
            {isSidebarCollapsed ? (
              <PanelRightOpen className="w-4 h-4 text-indigo-600" />
            ) : (
              <PanelRightClose className="w-4 h-4" />
            )}
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {pageInfo.title}
              </h1>

              {activeTab === 'dashboard' && (
                <>
                  <span className="text-[11px] px-2 py-0.2 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                    {totalItemsCount} פריטים
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded-md font-medium border ${
                      isDbConnected
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    <Database className="w-3 h-3" />
                    {isDbConnected ? 'מסד נתונים מקוון' : 'מתחבר...'}
                  </span>
                </>
              )}
            </div>

            <p className="text-[11px] text-slate-500 hidden sm:block">
              {pageInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Left side: Clean formula indicator if on dashboard */}
        {activeTab === 'dashboard' && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFormulaTooltip(!showFormulaTooltip)}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
              title="הסבר על נוסחת חישוב הרכש"
            >
              <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="hidden lg:inline">
                נוסחה: <span className="font-semibold text-slate-700">((אספקה ÷ 30) × צריכה) − מלאי זמין</span>
              </span>
              <span className="lg:hidden">נוסחה</span>
            </button>

            {showFormulaTooltip && (
              <div className="absolute top-8 left-0 z-50 w-80 sm:w-96 p-3.5 bg-slate-900 text-white text-xs rounded-xl shadow-xl space-y-1.5 border border-slate-700 leading-relaxed text-right">
                <div className="font-semibold text-indigo-300">נוסחת חישוב המלצת רכש:</div>
                <p>
                  <strong>מלאי זמין נטו:</strong> מצאי במחסן − (הזמנות לקוח + שמורות) + (הזמנות רכש + משלוחי יבוא בדרך).
                </p>
                <p>
                  <strong>צריכה צפויה לזמן אספקה:</strong> (זמן אספקה בימים ÷ 30) × צריכה ממוצעת חודשית.
                </p>
                <p>
                  <strong>כמות מומלצת להזמנה:</strong> החוסר הנדרש כדי לכסות את זמן האספקה עד להגעת המשלוח.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
