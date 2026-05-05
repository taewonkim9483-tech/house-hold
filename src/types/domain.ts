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
  createdAt: string;
}

export interface Receipt {
  id: string;
  groupId: string;
  userId: string;
  storeName: string;
  purchasedAt: string;
  totalAmount: number;
  imageUrl: string | null;
  items: ReceiptItem[];
  createdAt: string;
}

export interface ReceiptItem {
  id: string;
  receiptId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  category: string | null;
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
