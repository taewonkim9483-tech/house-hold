// Supabase CLI로 자동 생성 예정: supabase gen types typescript --project-id <id> > src/types/database.ts
// 현재는 플레이스홀더

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          lang: 'ko' | 'ja';
          group_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          lang?: 'ko' | 'ja';
          group_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          lang?: 'ko' | 'ja';
          group_id?: string | null;
          updated_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          name?: string;
        };
      };
      receipts: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          store_name: string;
          purchased_at: string;
          total_amount: number;
          image_url: string | null;
          raw_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          store_name: string;
          purchased_at: string;
          total_amount: number;
          image_url?: string | null;
          raw_text?: string | null;
          created_at?: string;
        };
        Update: {
          store_name?: string;
          purchased_at?: string;
          total_amount?: number;
          image_url?: string | null;
          raw_text?: string | null;
        };
      };
      receipt_items: {
        Row: {
          id: string;
          receipt_id: string;
          product_name: string;
          quantity: number;
          unit_price: number;
          amount: number;
          category: string | null;
        };
        Insert: {
          id?: string;
          receipt_id: string;
          product_name: string;
          quantity: number;
          unit_price: number;
          amount: number;
          category?: string | null;
        };
        Update: {
          product_name?: string;
          quantity?: number;
          unit_price?: number;
          amount?: number;
          category?: string | null;
        };
      };
      budgets: {
        Row: {
          id: string;
          group_id: string;
          period: 'weekly' | 'monthly';
          category: string | null;
          amount: number;
          year: number;
          week_or_month: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          period: 'weekly' | 'monthly';
          category?: string | null;
          amount: number;
          year: number;
          week_or_month: number;
          created_at?: string;
        };
        Update: {
          amount?: number;
          category?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      lang: 'ko' | 'ja';
      budget_period: 'weekly' | 'monthly';
    };
  };
}
