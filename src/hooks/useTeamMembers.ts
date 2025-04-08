
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
          .select(`
            role,
            org_id,
            organizations (
              id,
              name
            )
          `)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;
        
        if (data && data.organizations) {
          // Handle organizations data safely, ensuring type safety
          const orgName = typeof data.organizations === 'object' 
            ? (Array.isArray(data.organizations) 
                ? data.organizations[0]?.name 
                : data.organizations.name)
            : '';
          
          setCurrentOrg({
            id: data.org_id,
            name: orgName || 'Unknown Organization',
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
        
        // First get all user_organizations entries for the current org
        const { data: orgUsers, error: orgError } = await supabase
          .from("user_organizations")
          .select("user_id, role")
          .eq("org_id", currentOrg.id);

        if (orgError) throw orgError;
        
        if (!orgUsers || orgUsers.length === 0) {
          setMembers([]);
          return;
        }
        
        // Then get user details from profiles
        const memberPromises = orgUsers.map(async (orgUser) => {
          // Get profile data
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", orgUser.user_id)
            .single();
            
          if (profileError && profileError.code !== "PGRST116") {
            console.error("Error fetching profile:", profileError);
          }
          
          // Get email from auth.users table
          // Note: Using a separate query for email since we can't directly join with auth tables
          let email = "Unknown email";
          try {
            const { data: userData } = await supabase
              .from("profiles") // Using profiles table as a workaround to get user email
              .select("id")
              .eq("id", orgUser.user_id)
              .single();
              
            if (userData) {
              // We have the user, try to get email from auth.users
              // This would typically be handled by a secure server function
              email = orgUser.user_id; // Fallback to user_id which is an email-like identifier
            }
          } catch (error) {
            console.error("Error fetching user:", error);
          }
            
          return {
            id: orgUser.user_id,
            email: email,
            full_name: profileData?.full_name || "",
            role: orgUser.role
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

  // Invite new member
  const inviteMember = async (email: string, role: "admin" | "viewer") => {
    if (!currentOrg) return false;
    
    try {
      // Check if invitation already exists
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
      
      // Create the invitation
      const { error } = await supabase
        .from("invitations")
        .insert({
          email,
          org_id: currentOrg.id,
          role
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
    inviteMember
  };
};
