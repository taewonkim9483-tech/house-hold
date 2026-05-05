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
          display_name: string;
          lang: 'ko' | 'ja';
          created_at: string;
        };
        Insert: {
          id?: string;
          display_name: string;
          lang?: 'ko' | 'ja';
          created_at?: string;
        };
        Update: {
          display_name?: string;
          lang?: 'ko' | 'ja';
        };
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          name?: string;
        };
        Relationships: [];
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: 'owner' | 'member';
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: 'owner' | 'member';
          joined_at?: string;
        };
        Update: {
          role?: 'owner' | 'member';
        };
        Relationships: [];
      };
      group_invites: {
        Row: {
          id: string;
          group_id: string;
          token: string;
          created_by: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          token?: string;
          created_by: string;
          expires_at?: string;
          created_at?: string;
        };
        Update: {
          expires_at?: string;
        };
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      lang: 'ko' | 'ja';
      budget_period: 'weekly' | 'monthly';
    };
    CompositeTypes: Record<string, never>;
  };
}
