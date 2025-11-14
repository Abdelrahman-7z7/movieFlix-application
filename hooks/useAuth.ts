import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        console.log("🔐 Initializing auth...");

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (sessionError) {
          console.error("❌ Error getting session:", sessionError);
          setError(sessionError.message);
          setLoading(false);
          return;
        }

        console.log(
          "✅ Session retrieved:",
          session ? `User: ${session.user?.email}` : "No session",
        );

        setSession(session);
        setUser(session?.user ?? null);
        setError(null);
      } catch (err: any) {
        console.error("❌ Unexpected error in auth initialization:", err);
        setError(err.message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log(
        `🔄 Auth state changed: ${event}`,
        currentSession ? `User: ${currentSession.user?.email}` : "No user",
      );

      if (!isMounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
      setError(null);
    });

    // Cleanup
    return () => {
      console.log("🧹 Cleaning up auth listener");
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    session,
    isAuthenticated: !!user,
    loading,
    error,
  };
};
