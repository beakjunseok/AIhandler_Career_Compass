import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      recommendations: {
        Row: {
          id: string;
          created_at: string;
          user_interests: string;
          user_subjects: string;
          user_career_goal: string;
          user_grade: string;
          result_json: string;
        };
        Insert: {
          user_interests: string;
          user_subjects: string;
          user_career_goal: string;
          user_grade: string;
          result_json: string;
        };
      };
    };
  };
};
