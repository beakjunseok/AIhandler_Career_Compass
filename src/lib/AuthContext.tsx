import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type AuthState = {
  session: Session | null;
  user: User | null;
  displayName: string | null;
  loading: boolean;
  signIn: (name: string, password: string) => Promise<{ error: string | null }>;
  signUp: (name: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

const SYNTH_EMAIL_DOMAIN = "dreampath.local";

function nameToSyntheticEmail(rawName: string): string {
  const trimmed = rawName.trim().toLowerCase();
  // base64url-encode so non-ASCII (e.g. Korean) names stay valid in email syntax
  const utf8 = unescape(encodeURIComponent(trimmed));
  const encoded = btoa(utf8)
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${encoded}@${SYNTH_EMAIL_DOMAIN}`;
}

function readDisplayName(user: User | null): string | null {
  if (!user) return null;
  const meta = user.user_metadata as { display_name?: unknown } | null;
  const name = meta?.display_name;
  if (typeof name === "string" && name.length > 0) return name;
  // Fallback for legacy real-email accounts
  if (user.email && !user.email.endsWith(`@${SYNTH_EMAIL_DOMAIN}`)) {
    return user.email;
  }
  return null;
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

  const signIn: AuthState["signIn"] = async (name, password) => {
    const cleaned = name.trim();
    if (!cleaned) return { error: "이름을 입력해주세요." };
    const { error } = await supabase.auth.signInWithPassword({
      email: nameToSyntheticEmail(cleaned),
      password,
    });
    if (error) {
      // Supabase returns "Invalid login credentials" for both wrong name and wrong password
      return { error: "이름 또는 비밀번호가 올바르지 않습니다." };
    }
    return { error: null };
  };

  const signUp: AuthState["signUp"] = async (name, password) => {
    const cleaned = name.trim();
    if (!cleaned) return { error: "이름을 입력해주세요." };
    if (cleaned.length > 40) return { error: "이름은 40자 이하여야 합니다." };
    const { error } = await supabase.auth.signUp({
      email: nameToSyntheticEmail(cleaned),
      password,
      options: {
        data: { display_name: cleaned },
      },
    });
    if (error) {
      if (/already|registered|exists/i.test(error.message)) {
        return { error: "이미 사용 중인 이름입니다." };
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
