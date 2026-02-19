"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { Loader2, ShieldX } from "lucide-react";

const ORG_CHART_URL =
  process.env.NEXT_PUBLIC_ORG_CHART_URL || "http://localhost:5173";

export interface UserProfile {
  full_name: string | null;
  job_title: string | null;
  profile_photo_url: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        window.location.href = `${ORG_CHART_URL}/login`;
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("is_executive, is_super_admin, full_name, job_title, profile_photo_url")
        .eq("id", user.id)
        .single();

      setUser(user);
      setIsAuthorized((profileData?.is_executive ?? false) || (profileData?.is_super_admin ?? false));
      setProfile({
        full_name: profileData?.full_name ?? null,
        job_title: profileData?.job_title ?? null,
        profile_photo_url: profileData?.profile_photo_url ?? null,
      });
    } catch (err) {
      console.error("Auth check failed:", err);
      window.location.href = `${ORG_CHART_URL}/login`;
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 w-full max-w-md text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <ShieldX className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h1>
          <p className="text-sm text-slate-600 mb-6">
            The KPI Dashboard is only available to executives and super admins.
          </p>
          <a
            href={ORG_CHART_URL}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors"
          >
            ← Back to Org Chart
          </a>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
