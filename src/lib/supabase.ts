import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

export type Database = {
  public: {
    Tables: {
      recommendations: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          user_interests: string;
          user_subjects: string;
          user_career_goal: string;
          user_grade: string;
          result_json: unknown;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          user_interests: string;
          user_subjects: string;
          user_career_goal: string;
          user_grade: string;
          result_json: unknown;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          user_interests?: string;
          user_subjects?: string;
          user_career_goal?: string;
          user_grade?: string;
          result_json?: unknown;
        };
        Relationships: [];
      };
      research_suggestions: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          target_department: string;
          career_goal: string;
          user_grade: string;
          interest_topic: string;
          result_json: unknown;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          target_department: string;
          career_goal: string;
          user_grade: string;
          interest_topic: string;
          result_json: unknown;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          target_department?: string;
          career_goal?: string;
          user_grade?: string;
          interest_topic?: string;
          result_json?: unknown;
        };
        Relationships: [];
      };
      journal_memos: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
          subject: string;
          summary: string;
          books: string | null;
          future_research: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
          subject: string;
          summary: string;
          books?: string | null;
          future_research?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
          subject?: string;
          summary?: string;
          books?: string | null;
          future_research?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
