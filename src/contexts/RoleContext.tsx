
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { UserRole } from "@/lib/types";

interface RoleContextType {
  userRole: UserRole | null;
  isAdmin: boolean;
  isViewer: boolean;
  loading: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserRole();
    } else {
      setUserRole(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserRole = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("user_organizations")
        .select("role")
        .eq("user_id", user!.id)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        setUserRole(null);
      } else {
        setUserRole(data.role as UserRole);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleContext.Provider
      value={{
        userRole,
        isAdmin: userRole === "admin",
        isViewer: userRole === "viewer",
        loading
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
