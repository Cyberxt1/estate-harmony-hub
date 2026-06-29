import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "super_admin"
  | "estate_admin"
  | "community_chairman"
  | "community_secretary"
  | "treasurer"
  | "chief_security_officer"
  | "security_officer"
  | "resident"
  | "household_member"
  | "domestic_staff";

const adminRoles: AppRole[] = [
  "community_chairman",
  "community_secretary",
  "chief_security_officer",
  "super_admin",
  "estate_admin",
  "treasurer",
];

export interface Profile {
  id: string;
  estate_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  avatar_url: string | null;
  resident_type: "landlord" | "tenant" | null;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  onboarding_data: Record<string, unknown>;
  status: string;
}

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  hasRole: (role: AppRole) => boolean;
  isAdmin: boolean;
  isSecurity: boolean;
  primaryRole: AppRole;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async (u: User | null) => {
      if (!u) {
        setProfile(null);
        setRoles([]);
        return;
      }
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", u.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", u.id),
      ]);
      if (!mounted) return;
      setProfile(p as Profile | null);
      setRoles(((r ?? []) as { role: AppRole }[]).map((x) => x.role));
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const initialUser = data.session?.user ?? null;
      setUser(initialUser);
      load(initialUser).finally(() => mounted && setLoading(false));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      const next = session?.user ?? null;
      setUser(next);
      setTimeout(() => void load(next), 0);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const hasRole = (r: AppRole) => roles.includes(r);
  const isAdmin = roles.some((role) => adminRoles.includes(role));
  const isSecurity = hasRole("security_officer") || hasRole("chief_security_officer");
  const primaryRole: AppRole = isAdmin
    ? (roles.find((role) => adminRoles.includes(role)) ?? "estate_admin")
    : isSecurity
      ? "security_officer"
      : (roles[0] ?? "resident");

  return createElement(
    AuthContext.Provider,
    {
      value: { user, profile, roles, hasRole, isAdmin, isSecurity, primaryRole, loading },
    },
    children,
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = "/";
}
