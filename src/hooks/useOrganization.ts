
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Organization, TeamMember, Invitation, UserRole } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";

export const useOrganization = () => {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingInvite, setLoadingInvite] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOrganizationData();
    }
  }, [user]);

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);
      
      // Fetch the user's role and organization
      const { data: userOrgData, error: userOrgError } = await supabase
        .from("user_organizations")
        .select("*, organization:org_id(*)")
        .eq("user_id", user!.id)
        .single();

      if (userOrgError) {
        console.error("Error fetching user organization:", userOrgError);
        throw userOrgError;
      }

      // Set the user's role and organization
      setUserRole(userOrgData.role as UserRole);
      setOrganization(userOrgData.organization);

      // Fetch team members for the organization
      const { data: members, error: membersError } = await supabase
        .from("user_organizations")
        .select(`
          id,
          user_id,
          org_id,
          role,
          created_at,
          user:user_id(
            email
          ),
          profile:user_id(
            full_name
          )
        `)
        .eq("org_id", userOrgData.org_id);

      if (membersError) {
        console.error("Error fetching team members:", membersError);
        throw membersError;
      }

      // Format team members with profile information
      const formattedMembers = members.map((member: any) => ({
        id: member.id,
        user_id: member.user_id,
        org_id: member.org_id,
        role: member.role,
        created_at: member.created_at,
        profile: {
          full_name: member.profile?.full_name || 'Unnamed User',
          email: member.user?.email || '',
        }
      }));

      setTeamMembers(formattedMembers);

      // Fetch pending invitations if the user is an admin
      if (userOrgData.role === 'admin') {
        const { data: invites, error: invitesError } = await supabase
          .from("invitations")
          .select("*")
          .eq("org_id", userOrgData.org_id)
          .eq("accepted", false);

        if (invitesError) {
          console.error("Error fetching invitations:", invitesError);
          throw invitesError;
        }

        setPendingInvitations(invites);
      }
    } catch (error) {
      console.error("Error fetching organization data:", error);
      toast.error("Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  const inviteTeamMember = async (email: string, role: UserRole) => {
    if (!organization) return false;
    
    try {
      setLoadingInvite(true);
      
      // Check if the email is already a team member
      const isMember = teamMembers.some(member => 
        member.profile?.email.toLowerCase() === email.toLowerCase()
      );
      
      if (isMember) {
        toast.error("This email is already a team member");
        return false;
      }
      
      // Check if the email already has a pending invitation
      const isPending = pendingInvitations.some(
        invite => invite.email.toLowerCase() === email.toLowerCase()
      );
      
      if (isPending) {
        toast.error("This email already has a pending invitation");
        return false;
      }

      // Create invitation
      const { data, error } = await supabase
        .from("invitations")
        .insert({
          email: email.toLowerCase(),
          org_id: organization.id,
          role,
        })
        .select();

      if (error) {
        console.error("Error inviting team member:", error);
        throw error;
      }

      // Update the invitations list
      setPendingInvitations([...pendingInvitations, data[0]]);
      
      toast.success(`Invitation sent to ${email}`);
      return true;
    } catch (error: any) {
      console.error("Error inviting team member:", error);
      toast.error(error.message || "Failed to invite team member");
      return false;
    } finally {
      setLoadingInvite(false);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("invitations")
        .delete()
        .eq("id", invitationId);

      if (error) {
        console.error("Error canceling invitation:", error);
        throw error;
      }

      // Update the invitations list
      setPendingInvitations(
        pendingInvitations.filter(invite => invite.id !== invitationId)
      );
      
      toast.success("Invitation cancelled");
      return true;
    } catch (error: any) {
      console.error("Error canceling invitation:", error);
      toast.error(error.message || "Failed to cancel invitation");
      return false;
    }
  };

  const updateTeamMemberRole = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from("user_organizations")
        .update({ role: newRole })
        .eq("user_id", userId)
        .eq("org_id", organization?.id);

      if (error) {
        console.error("Error updating team member role:", error);
        throw error;
      }

      // Update local state
      setTeamMembers(
        teamMembers.map(member => 
          member.user_id === userId ? { ...member, role: newRole } : member
        )
      );
      
      toast.success("Team member role updated");
      return true;
    } catch (error: any) {
      console.error("Error updating team member role:", error);
      toast.error(error.message || "Failed to update team member role");
      return false;
    }
  };

  const removeTeamMember = async (userId: string) => {
    try {
      // Don't allow removing yourself
      if (userId === user!.id) {
        toast.error("You cannot remove yourself from the organization");
        return false;
      }

      const { error } = await supabase
        .from("user_organizations")
        .delete()
        .eq("user_id", userId)
        .eq("org_id", organization?.id);

      if (error) {
        console.error("Error removing team member:", error);
        throw error;
      }

      // Update local state
      setTeamMembers(teamMembers.filter(member => member.user_id !== userId));
      
      toast.success("Team member removed");
      return true;
    } catch (error: any) {
      console.error("Error removing team member:", error);
      toast.error(error.message || "Failed to remove team member");
      return false;
    }
  };

  const updateOrganizationName = async (name: string) => {
    if (!organization) return false;
    
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ name })
        .eq("id", organization.id);

      if (error) {
        console.error("Error updating organization name:", error);
        throw error;
      }

      // Update local state
      setOrganization({ ...organization, name });
      
      toast.success("Organization name updated");
      return true;
    } catch (error: any) {
      console.error("Error updating organization name:", error);
      toast.error(error.message || "Failed to update organization name");
      return false;
    }
  };

  return {
    organization,
    teamMembers,
    pendingInvitations,
    userRole,
    loading,
    loadingInvite,
    inviteTeamMember,
    cancelInvitation,
    updateTeamMemberRole,
    removeTeamMember,
    updateOrganizationName,
    refreshData: fetchOrganizationData
  };
};
