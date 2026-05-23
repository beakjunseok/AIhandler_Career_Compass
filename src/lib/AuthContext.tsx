import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type AuthState = {
  session: Session | null;
  user: User | null;
  displayName: string | null;
  displayGrade: string | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signUp: (username: string, password: string, grade: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

const SYNTH_EMAIL_DOMAIN = "dreampath.local";

function nameToSyntheticEmail(rawName: string): string {
  const trimmed = rawName.trim().toLowerCase();
  const utf8 = unescape(encodeURIComponent(trimmed));
  const encoded = btoa(utf8)
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${encoded}@${SYNTH_EMAIL_DOMAIN}`;
}

function readMeta<T = string>(user: User | null, key: string): T | null {
  if (!user) return null;
  const meta = user.user_metadata as Record<string, unknown> | null;
  const v = meta?.[key];
  return (v as T) ?? null;
}

function readDisplayName(user: User | null): string | null {
  if (!user) return null;
  const name = readMeta<string>(user, "display_name");
  if (typeof name === "string" && name.length > 0) return name;
  if (user.email && !user.email.endsWith(`@${SYNTH_EMAIL_DOMAIN}`)) return user.email;
  return null;
}

function readDisplayGrade(user: User | null): string | null {
  const g = readMeta<string>(user, "grade");
  return typeof g === "string" && g.length > 0 ? g : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn: AuthState["signIn"] = async (username, password) => {
    const cleaned = username.trim();
    if (!cleaned) return { error: "사용자명을 입력해주세요." };
    const { error } = await supabase.auth.signInWithPassword({
      email: nameToSyntheticEmail(cleaned),
      password,
    });
    if (error) return { error: "사용자명 또는 비밀번호가 올바르지 않습니다." };
    return { error: null };
  };

  const signUp: AuthState["signUp"] = async (username, password, grade) => {
    const cleaned = username.trim();
    if (!cleaned) return { error: "사용자명을 입력해주세요." };
    if (cleaned.length > 40) return { error: "사용자명은 40자 이하여야 합니다." };
    if (!["1", "2", "3"].includes(grade)) return { error: "학년을 선택해주세요." };

    const { error } = await supabase.auth.signUp({
      email: nameToSyntheticEmail(cleaned),
      password,
      options: {
        data: { display_name: cleaned, grade },
      },
    });
    if (error) {
      if (/already|registered|exists/i.test(error.message)) {
        return { error: "이미 사용 중인 사용자명입니다." };
      }
      return { error: error.message };
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthCtx.Provider
      value={{
        session,
        user: session?.user ?? null,
        displayName: readDisplayName(session?.user ?? null),
        displayGrade: readDisplayGrade(session?.user ?? null),
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
