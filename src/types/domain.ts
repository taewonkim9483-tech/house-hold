export type Locale = 'ko' | 'ja';

export interface User {
  id: string;
  email: string;
  lang: Locale;
  groupId: string | null;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'owner' | 'member';
  joinedAt: string;
  displayName?: string;
}

export interface GroupInvite {
  id: string;
  groupId: string;
  token: string;
  createdBy: string;
  expiresAt: string;
  createdAt: string;
}

export interface Category {
  id: string;
  groupId: string | null;
  nameKo: string;
  nameJa: string;
  icon: string;
  isSystem: boolean;
  sortOrder: number;
}

export type UnitType = 'per_100g' | 'per_100ml' | 'per_count' | 'per_g' | 'per_ml';

export interface Receipt {
  id: string;
  groupId: string;
  uploadedBy: string;
  storeName: string;
  purchasedAt: string;
  totalAmount: number;
  taxAmount: number | null;
  imageUrl: string | null;
  createdAt: string;
}

export interface ReceiptItem {
  id: string;
  receiptId: string;
  name: string;
  categoryId: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  unitType: UnitType;
  weightG: number | null;
  volumeMl: number | null;
  pricePer100: number | null;
}

/** Gemini API 분석 결과 (저장 전 미리보기용) */
export interface AnalyzedItem {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  category: string;
  tags: string[];
  unitType: UnitType;
  weightG: number | null;
  volumeMl: number | null;
  pricePer100: number | null;
}

export interface AnalyzedReceipt {
  storeName: string;
  purchasedAt: string;
  totalAmount: number;
  taxAmount: number | null;
  items: AnalyzedItem[];
}

export interface Budget {
  id: string;
  groupId: string;
  period: 'weekly' | 'monthly';
  category: string | null;
  amount: number;
  year: number;
  weekOrMonth: number;
}

export interface PriceRecord {
  productName: string;
  storeName: string;
  unitPrice: number;
  purchasedAt: string;
}
