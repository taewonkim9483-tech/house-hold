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
      categories: {
        Row: {
          id: string;
          group_id: string | null;
          name_ko: string;
          name_ja: string;
          icon: string;
          is_system: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          group_id?: string | null;
          name_ko: string;
          name_ja: string;
          icon: string;
          is_system?: boolean;
          sort_order?: number;
        };
        Update: {
          name_ko?: string;
          name_ja?: string;
          icon?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      tags: {
        Row: { id: string; name: string; created_at: string };
        Insert: { id?: string; name: string; created_at?: string };
        Update: { name?: string };
        Relationships: [];
      };
      receipts: {
        Row: {
          id: string;
          group_id: string;
          uploaded_by: string;
          store_name: string;
          purchased_at: string;
          total_amount: number;
          tax_amount: number | null;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          uploaded_by: string;
          store_name: string;
          purchased_at: string;
          total_amount: number;
          tax_amount?: number | null;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          store_name?: string;
          purchased_at?: string;
          total_amount?: number;
          tax_amount?: number | null;
          image_url?: string | null;
        };
        Relationships: [];
      };
      receipt_items: {
        Row: {
          id: string;
          receipt_id: string;
          name: string;
          category_id: string | null;
          quantity: number;
          unit_price: number;
          subtotal: number;
          unit_type: 'per_100g' | 'per_100ml' | 'per_count' | 'per_g' | 'per_ml';
          weight_g: number | null;
          volume_ml: number | null;
          price_per_100: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          receipt_id: string;
          name: string;
          category_id?: string | null;
          quantity?: number;
          unit_price: number;
          subtotal: number;
          unit_type?: 'per_100g' | 'per_100ml' | 'per_count' | 'per_g' | 'per_ml';
          weight_g?: number | null;
          volume_ml?: number | null;
          price_per_100?: number | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          category_id?: string | null;
          quantity?: number;
          unit_price?: number;
          subtotal?: number;
          unit_type?: 'per_100g' | 'per_100ml' | 'per_count' | 'per_g' | 'per_ml';
          weight_g?: number | null;
          volume_ml?: number | null;
          price_per_100?: number | null;
        };
        Relationships: [];
      };
      item_tags: {
        Row: { item_id: string; tag_id: string };
        Insert: { item_id: string; tag_id: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      budget_weeks: {
        Row: {
          id: string;
          budget_id: string;
          week_start: string;
          week_end: string;
          base_amount: number;
          spent_amount: number;
          status: 'open' | 'pending_close' | 'closed';
          created_at: string;
        };
        Insert: {
          id?: string;
          budget_id: string;
          week_start: string;
          week_end: string;
          base_amount: number;
          spent_amount?: number;
          status?: 'open' | 'pending_close' | 'closed';
          created_at?: string;
        };
        Update: {
          spent_amount?: number;
          status?: 'open' | 'pending_close' | 'closed';
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
