import React from 'react';
import {
  LayoutDashboard,
  Database,
  Users,
  Settings,
  LogOut,
  Boxes,
  PanelRightClose,
  PanelRightOpen,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavItemKey = 'dashboard' | 'data_management' | 'user_management' | 'settings';

interface SidebarProps {
  activeTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse
}) => {
  const { user, profile, role, isAdmin, isManager, signOut } = useAuth();

  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return { text: 'מנהל', color: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'manager':
        return { text: 'רכש', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      default:
        return { text: 'צפייה', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const roleBadge = getRoleBadge();

  const navItems: {
    key: NavItemKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    visible: boolean;
    badge?: string;
  }[] = [
    {
      key: 'dashboard',
      label: 'דשבורד רכש',
      icon: LayoutDashboard,
      visible: true
    },
    {
      key: 'data_management',
      label: 'ניהול נתונים',
      icon: Database,
      visible: isManager,
      badge: 'יבוא/יצוא'
    },
    {
      key: 'user_management',
      label: 'ניהול משתמשים',
      icon: Users,
      visible: isAdmin,
      badge: 'הרשאות'
    },
    {
      key: 'settings',
      label: 'הגדרות',
      icon: Settings,
      visible: isAdmin
    }
  ];

  const visibleNavItems = navItems.filter(item => item.visible);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 right-0 h-screen bg-sky-100 border-l border-sky-300 z-50 flex flex-col transition-all duration-200 ease-in-out ${
          isCollapsed ? 'md:w-16 w-52' : 'w-52'
        } ${
          isOpenMobile ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header: Logo & Collapse Toggle */}
        <div className={`p-3 border-b border-sky-300 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <Boxes className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-900 leading-tight truncate">
                  דוח המלצת רכש
                </div>
                <div className="text-[10px] text-sky-800 font-medium truncate">מלאי וסנכרון ענן</div>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0" title="דוח המלצת רכש">
              <Boxes className="w-4 h-4" />
            </div>
          )}

          {/* Desktop Collapse/Expand Button */}
          <button
            onClick={onToggleCollapse}
            type="button"
            className="hidden md:flex p-1.5 rounded-lg text-sky-800 hover:text-slate-900 hover:bg-sky-200 transition cursor-pointer"
            title={isCollapsed ? 'הרחב תפריט צד' : 'כווץ תפריט צד (רווח מרבי לטבלה)'}
          >
            {isCollapsed ? <PanelRightOpen className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            type="button"
            className="md:hidden p-1 text-sky-800 hover:text-slate-900 rounded-lg hover:bg-sky-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {!isCollapsed && (
            <div className="px-2.5 py-1 text-[10px] font-bold text-sky-900 uppercase tracking-wider">
              תפריט
            </div>
          )}

          {visibleNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;

            return (
              <button
                key={item.key}
                onClick={() => {
                  onSelectTab(item.key);
                  onCloseMobile();
                }}
                type="button"
                title={item.label}
                className={`w-full flex items-center rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isCollapsed
                    ? 'justify-center p-2.5'
                    : 'justify-between px-3 py-2'
                } ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-800 hover:bg-sky-200/80 hover:text-slate-950'
                }`}
              >
                <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : ''}`}>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-sky-800'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge && !isActive && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-sky-200 text-sky-900 font-semibold border border-sky-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer: User Details & Logout Button */}
        <div className="p-2 border-t border-sky-300 bg-sky-200/50">
          {!isCollapsed ? (
            <div className="flex items-center justify-between gap-1.5 p-1.5 rounded-xl bg-white border border-sky-300 shadow-2xs">
              {/* Avatar & User Details */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'משתמש'}
                    className="w-7 h-7 rounded-full border border-sky-200 object-cover shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-200 shrink-0">
                    {(profile?.displayName || user?.email || 'U')[0].toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1 text-right">
                  <div className="text-[11px] font-bold text-slate-900 truncate">
                    {profile?.displayName || user?.email?.split('@')[0]}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-[9px] px-1 py-0.2 rounded font-medium border ${roleBadge.color}`}>
                      {roleBadge.text}
                    </span>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={signOut}
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
                title="התנתק מהמערכת"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-1">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'משתמש'}
                  className="w-7 h-7 rounded-full border border-sky-200 object-cover"
                  title={`${profile?.displayName || user?.email} (${roleBadge.text})`}
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-200"
                  title={`${profile?.displayName || user?.email} (${roleBadge.text})`}
                >
                  {(profile?.displayName || user?.email || 'U')[0].toUpperCase()}
                </div>
              )}

              <button
                onClick={signOut}
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                title="התנתק מהמערכת"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
