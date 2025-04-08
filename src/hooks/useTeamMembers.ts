import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";

export type TeamMember = {
  id: string;
  email: string;
  full_name: string;
  role: string;
};

export type OrgInfo = {
  id: string;
  name: string;
  userRole: string;
};

export const useTeamMembers = (user: User | null) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentOrg, setCurrentOrg] = useState<OrgInfo | null>(null);

  // Get current organization and role
  useEffect(() => {
    if (!user) return;

    const fetchOrgInfo = async () => {
      try {
        const { data, error } = await supabase
          .from("user_organizations")
          .select(
            `
            role,
            org_id,
            organizations (
              id,
              name
            )
          `
          )
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        if (data && typeof data.organizations === 'object' && data.organizations !== null) {
          const org = data.organizations as { id: string; name: string };

          setCurrentOrg({
            id: data.org_id,
            name: org.name,
            userRole: data.role
          });
        }
      } catch (error) {
        console.error("Error fetching organization:", error);
      }
    };

    fetchOrgInfo();
  }, [user]);

  // Fetch team members when org is available
  useEffect(() => {
    if (!currentOrg) return;

    const fetchMembers = async () => {
      try {
        setLoading(true);

        const { data: orgUsers, error: orgError } = await supabase
          .from("user_organizations")
          .select("user_id, role")
          .eq("org_id", currentOrg.id);

        if (orgError) throw orgError;

        if (!orgUsers || orgUsers.length === 0) {
          setMembers([]);
          return;
        }

        const memberPromises = orgUsers.map(async (orgUser) => {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", orgUser.user_id)
            .single();

          if (profileError && profileError.code !== "PGRST116") {
            console.error("Error fetching profile:", profileError);
          }

          let email = "Unknown email";
          try {
            const { data: userData } = await supabase
              .from("profiles")
              .select("id")
              .eq("id", orgUser.user_id)
              .single();

            if (userData) {
              email = orgUser.user_id;
            }
          } catch (error) {
            console.error("Error fetching user:", error);
          }

          return {
            id: orgUser.user_id,
            email: email,
            full_name: profileData?.full_name || "",
            role: orgUser.role,
          };
        });

        const resolvedMembers = await Promise.all(memberPromises);
        setMembers(resolvedMembers);
      } catch (error) {
        console.error("Error fetching team members:", error);
        toast.error("Failed to load team members");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [currentOrg]);

  const inviteMember = async (email: string, role: "admin" | "viewer") => {
    if (!currentOrg) return false;

    try {
      const { data: existingInvite, error: checkError } = await supabase
        .from("invitations")
        .select("id")
        .eq("org_id", currentOrg.id)
        .eq("email", email)
        .eq("accepted", false)
        .single();

      if (checkError && checkError.code !== "PGRST116") throw checkError;

      if (existingInvite) {
        toast.error("An invitation has already been sent to this email");
        return false;
      }

      const { error } = await supabase.from("invitations").insert({
        email,
        org_id: currentOrg.id,
        role,
      });

      if (error) throw error;

      toast.success("Invitation sent successfully");
      return true;
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to send invitation");
      return false;
    }
  };

  return {
    members,
    loading,
    currentOrg,
    inviteMember,
  };
};
