
import { useState } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserRole } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Check, Edit, Loader2, Mail, Trash, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function TeamManagement() {
  const { organization, teamMembers, pendingInvitations, userRole, loading, loadingInvite, inviteTeamMember, cancelInvitation, updateTeamMemberRole, removeTeamMember, updateOrganizationName } = useOrganization();
  const { user } = useAuth();
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("viewer");
  const [orgNameEdit, setOrgNameEdit] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  
  const isAdmin = userRole === "admin";

  const handleInviteSubmit = async () => {
    if (!inviteEmail.trim()) return;
    
    const success = await inviteTeamMember(inviteEmail, inviteRole);
    if (success) {
      setInviteEmail("");
      setInviteRole("viewer");
      setOpenInviteDialog(false);
    }
  };

  const handleSaveOrgName = async () => {
    if (!newOrgName.trim() || newOrgName === organization?.name) {
      setOrgNameEdit(false);
      return;
    }
    
    const success = await updateOrganizationName(newOrgName);
    if (success) {
      setOrgNameEdit(false);
    }
  };

  const startEditingOrgName = () => {
    setNewOrgName(organization?.name || "");
    setOrgNameEdit(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <CardTitle>Team Management</CardTitle>
            <CardDescription>
              Manage your organization and team members
            </CardDescription>
          </div>
          {isAdmin && (
            <Dialog open={openInviteDialog} onOpenChange={setOpenInviteDialog}>
              <DialogTrigger asChild>
                <Button className="mt-4 md:mt-0">
                  <Mail className="mr-2 h-4 w-4" />
                  Invite Team Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your organization.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as UserRole)}>
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {inviteRole === "admin" 
                        ? "Admins can create and edit all data, and invite team members." 
                        : "Viewers can only view data, but cannot create or edit."}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenInviteDialog(false)}>Cancel</Button>
                  <Button onClick={handleInviteSubmit} disabled={!inviteEmail.trim() || loadingInvite}>
                    {loadingInvite ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>Send Invitation</>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="members" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="members">Team Members</TabsTrigger>
            <TabsTrigger value="organization">Organization</TabsTrigger>
            {isAdmin && <TabsTrigger value="invitations">Pending Invitations</TabsTrigger>}
          </TabsList>
          
          {/* Team Members Tab */}
          <TabsContent value="members">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.profile?.full_name || "Unnamed User"}
                      {member.user_id === user?.id && <span className="ml-2 text-xs text-muted-foreground">(You)</span>}
                    </TableCell>
                    <TableCell>{member.profile?.email}</TableCell>
                    <TableCell>
                      {isAdmin && member.user_id !== user?.id ? (
                        <Select 
                          value={member.role} 
                          onValueChange={(value) => updateTeamMemberRole(member.user_id, value as UserRole)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="capitalize">{member.role}</span>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        {member.user_id !== user?.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove this team member? They will lose access to your organization's data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => removeTeamMember(member.user_id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {teamMembers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 4 : 3} className="text-center py-8 text-muted-foreground">
                      No team members found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
          
          {/* Organization Tab */}
          <TabsContent value="organization">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Organization Information</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Organization Name</Label>
                    <div className="flex items-center">
                      {orgNameEdit ? (
                        <>
                          <Input
                            id="org-name"
                            value={newOrgName}
                            onChange={(e) => setNewOrgName(e.target.value)}
                            className="max-w-sm"
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={handleSaveOrgName} 
                            className="ml-2"
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setOrgNameEdit(false)} 
                            className="ml-1"
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="text-lg">{organization?.name}</span>
                          {isAdmin && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={startEditingOrgName} 
                              className="ml-2"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Your Role</Label>
                    <div>
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 capitalize">
                        {userRole}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Organization Permissions</h3>
                <div className="space-y-4">
                  <div className="bg-muted rounded-md p-4">
                    <h4 className="font-medium mb-2">Admin Role</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                      <li>Create, edit and delete contacts, proposals, and invoices</li>
                      <li>Invite new team members</li>
                      <li>Manage team member roles</li>
                      <li>Access all organization data</li>
                    </ul>
                  </div>
                  
                  <div className="bg-muted rounded-md p-4">
                    <h4 className="font-medium mb-2">Viewer Role</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                      <li>View contacts, proposals, and invoices</li>
                      <li>Cannot create, edit, or delete data</li>
                      <li>Cannot invite or manage team members</li>
                      <li>Access all organization data in read-only mode</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Pending Invitations Tab (Admin only) */}
          {isAdmin && (
            <TabsContent value="invitations">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Invited</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">{invitation.email}</TableCell>
                      <TableCell className="capitalize">{invitation.role}</TableCell>
                      <TableCell>
                        {new Date(invitation.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => cancelInvitation(invitation.id)}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {pendingInvitations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No pending invitations
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
