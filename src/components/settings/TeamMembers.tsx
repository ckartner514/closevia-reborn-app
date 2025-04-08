
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

// Define types for team members and organization
type TeamMember = {
  id: string;
  email: string;
  full_name: string;
  role: string;
};

type CurrentOrgInfo = {
  id: string;
  name: string;
  userRole: string;
};

const InviteFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["admin", "viewer"], {
    required_error: "Please select a role",
  }),
});

export function TeamMembers() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [currentOrg, setCurrentOrg] = useState<CurrentOrgInfo | null>(null);

  const form = useForm<z.infer<typeof InviteFormSchema>>({
    resolver: zodResolver(InviteFormSchema),
    defaultValues: {
      email: "",
      role: "viewer",
    },
  });

  // Fetch the current organization and user's role
  useEffect(() => {
    if (!user) return;
    
    const fetchOrgAndRole = async () => {
      try {
        const { data: userOrg, error: userOrgError } = await supabase
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

        if (userOrgError) throw userOrgError;
        
        if (userOrg) {
          setCurrentOrg({
            id: userOrg.organizations.id,
            name: userOrg.organizations.name,
            userRole: userOrg.role
          });
        }
      } catch (error) {
        console.error("Error fetching organization info:", error);
      }
    };

    fetchOrgAndRole();
  }, [user]);

  // Fetch all members of the current organization
  useEffect(() => {
    if (!currentOrg) return;
    
    const fetchMembers = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from("user_organizations")
          .select(`
            role,
            user_id,
            auth.users (
              email
            ),
            profiles (
              full_name
            )
          `)
          .eq("org_id", currentOrg.id);

        if (error) throw error;

        const formattedMembers = data.map((item) => ({
          id: item.user_id,
          email: item.users.email,
          full_name: item.profiles?.full_name || "",
          role: item.role
        }));
        
        setMembers(formattedMembers);
      } catch (error) {
        console.error("Error fetching team members:", error);
        toast.error("Failed to load team members");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [currentOrg]);

  const handleInvite = async (values: z.infer<typeof InviteFormSchema>) => {
    if (!currentOrg) return;
    
    try {
      setInviting(true);
      
      // Check if user is already a member
      const { data: existingMember, error: checkError } = await supabase
        .from("user_organizations")
        .select("id, user_id")
        .eq("org_id", currentOrg.id)
        .eq("user_id", (await supabase.from("auth.users").select("id").eq("email", values.email).single()).data?.id)
        .maybeSingle();
      
      if (checkError && checkError.code !== "PGRST116") throw checkError;
      
      if (existingMember) {
        toast.error("This user is already a member of your organization");
        return;
      }
      
      // Check if invitation already exists
      const { data: existingInvite, error: inviteCheckError } = await supabase
        .from("invitations")
        .select("id")
        .eq("org_id", currentOrg.id)
        .eq("email", values.email)
        .eq("accepted", false)
        .maybeSingle();
        
      if (inviteCheckError && inviteCheckError.code !== "PGRST116") throw inviteCheckError;
      
      if (existingInvite) {
        toast.error("An invitation has already been sent to this email");
        return;
      }
      
      // Create the invitation
      const { error: inviteError } = await supabase
        .from("invitations")
        .insert({
          email: values.email,
          org_id: currentOrg.id,
          role: values.role
        });
        
      if (inviteError) throw inviteError;
      
      toast.success("Invitation sent successfully");
      form.reset();
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  if (!currentOrg) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Loading organization information...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>
          Manage members of {currentOrg.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="rounded-md border mb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                        No team members found
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>{member.full_name || "—"}</TableCell>
                        <TableCell className="capitalize">{member.role}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {currentOrg.userRole === "admin" && (
              <div className="p-4 border rounded-lg bg-muted/40">
                <h3 className="text-sm font-medium mb-3 flex items-center">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite New Member
                </h3>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleInvite)} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input placeholder="colleague@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button type="submit" disabled={inviting}>
                      {inviting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending Invitation...
                        </>
                      ) : (
                        "Send Invitation"
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
