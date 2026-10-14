import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  addDoc
} from 'firebase/firestore';
import { db, testConnection } from './firebase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Item, ComputedItem, FormulaMode, ViewFilterMode } from './types';
import { INITIAL_ITEMS } from './data/initialItems';
import { Sidebar, NavItemKey } from './components/Sidebar';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { FilterBar } from './components/FilterBar';
import { DataTable } from './components/DataTable';
import { ItemModal } from './components/ItemModal';
import { DataManagementView } from './components/DataManagementView';
import { UserManagementView } from './components/UserManagementView';
import { SettingsView } from './components/SettingsView';
import { AuthGate } from './components/AuthGate';
import { CheckCircle2, AlertCircle, RefreshCw, Database } from 'lucide-react';

function DashboardApp() {
  const { user, profile, role, isAdmin, isManager, loading: authLoading } = useAuth();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<NavItemKey>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Firestore items state
  const [dbItems, setDbItems] = useState<Item[]>([]);
  const [hasLoadedDb, setHasLoadedDb] = useState<boolean>(false);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);

  // Filter & Calculation State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewFilterMode>('all');
  const [formulaMode, setFormulaMode] = useState<FormulaMode>('avg6');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [safetyBuffer, setSafetyBuffer] = useState<number>(0);

  // Modals & Action States
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ComputedItem | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // 1. Enforce RBAC Tab Permissions:
  // If user is a viewer (read-only), only 'dashboard' is accessible.
  useEffect(() => {
    if (!isManager && activeTab === 'data_management') {
      setActiveTab('dashboard');
    }
    if (!isAdmin && (activeTab === 'user_management' || activeTab === 'settings')) {
      setActiveTab('dashboard');
    }
  }, [role, activeTab, isManager, isAdmin]);

  // 2. Validate connection on mount
  useEffect(() => {
    testConnection().then(connected => {
      setIsDbConnected(connected);
    });
  }, []);

  // 3. Real-time sync with Firestore /items collection
  useEffect(() => {
    const itemsCollection = collection(db, 'items');
    const unsubscribe = onSnapshot(
      itemsCollection,
      snapshot => {
        setIsDbConnected(true);
        const list: Item[] = [];
        snapshot.forEach(docSnap => {
          const d = docSnap.data();
          list.push({
            id: docSnap.id,
            code: d.code || docSnap.id,
            desc: d.desc || '',
            cat: d.cat || '',
            series: d.series || '',
            stock: Number(d.stock) || 0,
            cust_ord: Number(d.cust_ord) || 0,
            res_ord: Number(d.res_ord) || 0,
            po_imp: Number(d.po_imp) || 0,
            ship_imp: Number(d.ship_imp) || 0,
            lead_time: Number(d.lead_time) || 90,
            avg3: Number(d.avg3) || 0,
            avg6: Number(d.avg6) || 0,
            avg12: Number(d.avg12) || 0,
            erp_rec: Number(d.erp_rec) || 0,
            has_erp_rec: !!d.has_erp_rec,
            notes: d.notes || '',
            updatedAt: d.updatedAt,
            updatedBy: d.updatedBy,
          });
        });
        setDbItems(list);
        setHasLoadedDb(true);
      },
      err => {
        console.error('Firestore items onSnapshot error:', err);
        setHasLoadedDb(true);
      }
    );

    return () => unsubscribe();
  }, []);

  // Active items source: Firestore if populated, otherwise initial catalog
  const activeItems: Item[] = useMemo(() => {
    if (dbItems.length > 0) return dbItems;
    return INITIAL_ITEMS;
  }, [dbItems]);

  const isUsingLocalInitial = dbItems.length === 0;

  // Log audit helper
  const logAudit = async (action: string, details: string, itemCode?: string) => {
    try {
      if (!user) return;
      await addDoc(collection(db, 'audit_logs'), {
        action,
        details,
        itemCode: itemCode || null,
        userId: user.uid,
        userEmail: user.email || 'משתמש',
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Could not write audit log:', e);
    }
  };

  // 4. Compute recommendations & metrics for all items
  const computedItems: ComputedItem[] = useMemo(() => {
    const safetyMultiplier = 1 + safetyBuffer / 100.0;

    return activeItems.map(item => {
      const netAvail = item.stock - item.cust_ord - item.res_ord + item.po_imp + item.ship_imp;

      let monthlyRate = Math.max(0, item.avg6);
      if (formulaMode === 'avg3') monthlyRate = Math.max(0, item.avg3);
      else if (formulaMode === 'avg12') monthlyRate = Math.max(0, item.avg12);

      const effectiveLeadTime = item.lead_time * safetyMultiplier;
      const expectedConsumption = (effectiveLeadTime / 30.0) * monthlyRate;
      const rawShortfall = expectedConsumption - netAvail;

      let calcRec = 0;
      if (formulaMode === 'avg6' && safetyBuffer === 0 && item.has_erp_rec) {
        calcRec = item.erp_rec;
      } else if (rawShortfall > 0) {
        calcRec = Math.round(rawShortfall);
      }

      let stockStatus: ComputedItem['stockStatus'] = 'ok';
      if (netAvail < 0) {
        stockStatus = 'critical';
      } else if (calcRec > 0) {
        stockStatus = 'warning';
      }

      return {
        ...item,
        netAvail,
        expectedConsumption,
        calcRec,
        stockStatus
      };
    });
  }, [activeItems, formulaMode, safetyBuffer]);

  // Unique categories for filtering
  const categories = useMemo(() => {
    const set = new Set<string>();
    activeItems.forEach(i => {
      if (i.cat) set.add(i.cat);
    });
    return Array.from(set).sort();
  }, [activeItems]);

  // Filter pipeline
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return computedItems.filter(item => {
      if (q) {
        const matchCode = item.code.toLowerCase().includes(q);
        const matchDesc = item.desc.toLowerCase().includes(q);
        if (!matchCode && !matchDesc) return false;
      }

      if (viewMode === 'need_order' && item.calcRec <= 0) return false;
      if (viewMode === 'negative_stock' && item.netAvail >= 0) return false;
      if (viewMode === 'has_stock' && item.stock <= 0) return false;

      if (selectedCategory && item.cat !== selectedCategory) return false;

      return true;
    });
  }, [computedItems, searchQuery, viewMode, selectedCategory]);

  // KPI calculations
  const totalItemsCount = activeItems.length;
  const needOrderItems = computedItems.filter(i => i.calcRec > 0);
  const needOrderCount = needOrderItems.length;
  const totalRecQty = needOrderItems.reduce((acc, i) => acc + i.calcRec, 0);
  const totalNetAvail = computedItems.reduce((acc, i) => acc + i.netAvail, 0);
  const negativeStockCount = computedItems.filter(i => i.netAvail < 0).length;
  const shownCount = filteredItems.length;

  // Actions
  const handleEditItem = (item: ComputedItem) => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (itemData: Partial<Item>) => {
    if (!itemData.code) return;
    setIsSaving(true);
    const itemId = itemData.id || itemData.code;

    try {
      const now = new Date().toISOString();
      const payload: Partial<Item> = {
        ...itemData,
        updatedAt: now,
        updatedBy: user?.email || 'מערכת'
      };

      await setDoc(doc(db, 'items', itemId), payload, { merge: true });
      await logAudit(
        'edit_item',
        `עודכן פריט מק"ט ${itemData.code} (${itemData.desc}), מצאי: ${itemData.stock}, אספקה: ${itemData.lead_time} ימים`,
        itemData.code
      );
      showToast(`הפריט ${itemData.code} נשמר בהצלחה במסד הנתונים`);
    } catch (err: unknown) {
      console.error('Save item error:', err);
      showToast(err instanceof Error ? err.message : 'שגיאה בשמירת הפריט', 'error');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (item: ComputedItem) => {
    if (!isAdmin) {
      showToast('רק מנהל מערכת מורשה למחוק פריטים', 'error');
      return;
    }
    const confirmDelete = window.confirm(`האם אתה בטוח שברצונך למחוק את פריט ${item.code} (${item.desc})?`);
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, 'items', item.id || item.code));
      await logAudit('delete_item', `נמחק פריט מק"ט ${item.code}`, item.code);
      showToast(`פריט ${item.code} נמחק בהצלחה`);
    } catch (err: unknown) {
      console.error('Delete item error:', err);
      showToast('שגיאה במחיקת הפריט', 'error');
    }
  };

  // Seed 164 initial items
  const handleSeedInitialData = async () => {
    if (!isManager) {
      showToast('יש להתחבר כמנהל כדי לסנכרן פריטים', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const batchSize = 400;
      for (let i = 0; i < INITIAL_ITEMS.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = INITIAL_ITEMS.slice(i, i + batchSize);
        chunk.forEach(item => {
          const ref = doc(db, 'items', item.code);
          batch.set(ref, {
            ...item,
            updatedAt: new Date().toISOString(),
            updatedBy: user?.email || 'סנכרון ראשוני'
          });
        });
        await batch.commit();
      }

      await logAudit('seed_initial', `סונכרנו ${INITIAL_ITEMS.length} פריטים ראשוניים לענן`);
      showToast(`סונכרנו בהצלחה ${INITIAL_ITEMS.length} פריטים למסד הנתונים!`);
    } catch (err: unknown) {
      console.error('Seed error:', err);
      showToast('שגיאה בסנכרון פריטים', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Commit CSV Import
  const handleCommitImport = async (parsedItems: Partial<Item>[], mode: 'merge' | 'replace') => {
    if (!isManager) {
      showToast('רק מנהל מורשה לטעון קובצי CSV', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const batchSize = 400;
      for (let i = 0; i < parsedItems.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = parsedItems.slice(i, i + batchSize);
        chunk.forEach(it => {
          if (!it.code) return;
          const ref = doc(db, 'items', it.code);
          batch.set(
            ref,
            {
              ...it,
              updatedAt: now,
              updatedBy: user?.email || 'ייבוא CSV'
            },
            { merge: mode === 'merge' }
          );
        });
        await batch.commit();
      }

      await logAudit(
        'import_csv',
        `נטענו ${parsedItems.length} פריטים מקובץ CSV במצב ${mode === 'merge' ? 'מיזוג ועדכון' : 'דריסה'}`
      );
      showToast(`נטענו ועודכנו ${parsedItems.length} פריטים במסד הנתונים!`);
    } catch (err: unknown) {
      console.error('Import error:', err);
      showToast('שגיאה בטעינת הנתונים למסד הנתונים', 'error');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setViewMode('all');
    setSelectedCategory('');
    setSafetyBuffer(0);
  };

  const isFiltered = Boolean(searchQuery || viewMode !== 'all' || selectedCategory || safetyBuffer !== 0);

  // If auth is loading, show clean loader
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-3" dir="rtl">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
        <span className="text-sm font-medium">מאמת נתוני משתמש ומסד נתונים...</span>
      </div>
    );
  }

  // Requirement: Unregistered / unauthenticated users cannot see content
  if (!user) {
    return <AuthGate />;
  }

  return (
    <div className="min-h-screen flex bg-slate-100/60 text-slate-900" dir="rtl">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-5 left-5 z-50 px-4 py-2.5 rounded-xl shadow-lg border text-xs sm:text-sm font-medium flex items-center gap-2 transition-all ${
            toastMsg.type === 'success'
              ? 'bg-slate-900 text-white border-slate-700'
              : 'bg-rose-600 text-white border-rose-500'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-300" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Modern Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Clean Header (no duplicate buttons, no add item button, no user name) */}
        <Header
          activeTab={activeTab}
          totalItemsCount={totalItemsCount}
          isDbConnected={isDbConnected}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Tab 1: Purchase Dashboard (דשבורד רכש) */}
        {activeTab === 'dashboard' && (
          <main className="flex-1 w-full px-3 sm:px-6 py-3.5 space-y-3 flex flex-col">
            {/* Local catalog notice if unseeded */}
            {isUsingLocalInitial && isManager && (
              <div className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-200 shrink-0" />
                  <span>
                    <strong>164 פריטי קטלוג מוצגים כעת.</strong> ניתן לסנכרן אותם לצמיתות למסד הנתונים בענן בעמוד "ניהול נתונים".
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('data_management')}
                  type="button"
                  className="px-3 py-1 rounded-lg bg-white text-indigo-700 font-semibold text-xs hover:bg-indigo-50 transition cursor-pointer"
                >
                  מעבר לניהול נתונים
                </button>
              </div>
            )}

            {/* Top section above table - Solid Light Blue Background */}
            <div className="bg-sky-100 border border-sky-300 rounded-2xl p-4 space-y-3 shadow-2xs">
              {/* KPI Cards */}
              <KpiCards
                totalItems={totalItemsCount}
                needOrderCount={needOrderCount}
                totalRecQty={totalRecQty}
                shownCount={shownCount}
                totalNetAvail={totalNetAvail}
                negativeStockCount={negativeStockCount}
              />

              {/* Filter Bar */}
              <FilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                formulaMode={formulaMode}
                onFormulaModeChange={setFormulaMode}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                categories={categories}
                safetyBuffer={safetyBuffer}
                onSafetyBufferChange={setSafetyBuffer}
                onResetFilters={handleResetFilters}
                isFiltered={isFiltered}
              />
            </div>

            {/* Interactive Data Table */}
            <DataTable
              items={filteredItems}
              isManager={isManager}
              isAdmin={isAdmin}
              onRowClick={handleEditItem}
            />
          </main>
        )}

        {/* Tab 2: Data Management (ניהול נתונים - יבוא, יצוא, סנכרון) */}
        {activeTab === 'data_management' && (
          <main className="flex-1 w-full py-4 overflow-y-auto">
            <DataManagementView
              items={computedItems}
              onCommitImport={handleCommitImport}
              onSeedInitialData={handleSeedInitialData}
              isProcessing={isSaving}
              isDbConnected={isDbConnected}
            />
          </main>
        )}

        {/* Tab 3: User Management (ניהול משתמשים והרשאות) */}
        {activeTab === 'user_management' && (
          <main className="flex-1 w-full py-4 overflow-y-auto">
            <UserManagementView />
          </main>
        )}

        {/* Tab 4: Settings (הגדרות) */}
        {activeTab === 'settings' && (
          <main className="flex-1 w-full py-4 overflow-y-auto">
            <SettingsView
              formulaMode={formulaMode}
              onFormulaModeChange={setFormulaMode}
              safetyBuffer={safetyBuffer}
              onSafetyBufferChange={setSafetyBuffer}
            />
          </main>
        )}
      </div>

      {/* Item Details & Actions Modal (opened on row click) */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
        item={editingItem}
        isSaving={isSaving}
        isManager={isManager}
        isAdmin={isAdmin}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardApp />
    </AuthProvider>
  );
}
