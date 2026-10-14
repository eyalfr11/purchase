export type UserRole = 'admin' | 'manager' | 'viewer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string; // Firestore document ID or item code
  code: string;
  desc: string;
  cat?: string;
  series?: string;
  stock: number;
  cust_ord: number;
  res_ord: number;
  po_imp: number;
  ship_imp: number;
  lead_time: number;
  avg3: number;
  avg6: number;
  avg12: number;
  erp_rec: number;
  has_erp_rec: boolean;
  notes?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ComputedItem extends Item {
  netAvail: number;
  expectedConsumption: number;
  calcRec: number;
  stockStatus: 'critical' | 'warning' | 'ok' | 'surplus';
}

export type FormulaMode = 'avg6' | 'avg3' | 'avg12';
export type ViewFilterMode = 'all' | 'need_order' | 'negative_stock' | 'has_stock';

export interface AuditLogEntry {
  id?: string;
  action: string;
  itemCode?: string;
  details: string;
  userId: string;
  userEmail: string;
  timestamp: string;
}
