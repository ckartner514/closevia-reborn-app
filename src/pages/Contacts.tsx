import { useState, useEffect } from "react";
import { supabase, Contact } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

type ContactComment = {
  id: string;
  contact_id: string;
  text: string;
  created_at: string;
  user_id: string;
};

const ContactsPage = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactComments, setContactComments] = useState<ContactComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editedContact, setEditedContact] = useState<Partial<Contact>>({});
  const [lastInteractionDate, setLastInteractionDate] = useState<Date | undefined>(undefined);
  const [contactDrawerOpen, setContactDrawerOpen] = useState(false);
  const [newContactOpen, setNewContactOpen] = useState(false);
  const [newContact, setNewContact] = useState<Partial<Contact>>({
    name: "",
    company: "",
    email: "",
    phone: "",
  });
  const [isCreatingContact, setIsCreatingContact] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchContacts();
  }, [user]);

  useEffect(() => {
    if (selectedContact) {
      fetchContactComments(selectedContact.id);
      
      if (selectedContact.last_interaction) {
        setLastInteractionDate(parseISO(selectedContact.last_interaction));
      } else {
        setLastInteractionDate(undefined);
      }
      
      setEditedContact({
        name: selectedContact.name,
        company: selectedContact.company,
        email: selectedContact.email,
        phone: selectedContact.phone,
        last_interaction: selectedContact.last_interaction,
      });
    }
  }, [selectedContact]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user!.id)
        .order("name", { ascending: true });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  const fetchContactComments = async (contactId: string) => {
    try {
      setCommentLoading(true);
      const { data, error } = await supabase
        .from("contact_comments")
        .select("*")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      console.log("Fetched comments:", data);
      setContactComments(data || []);
    } catch (error) {
      console.error("Error fetching contact comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedContact) return;

    try {
      setCommentLoading(true);
      const { data, error } = await supabase
        .from("contact_comments")
        .insert([
          {
            contact_id: selectedContact.id,
            text: newComment,
            user_id: user!.id,
          },
        ])
        .select();

      if (error) throw error;
      setContactComments([data[0], ...contactComments]);
      setNewComment("");
      toast.success("Comment added successfully");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      setCommentLoading(true);
      const { error } = await supabase
        .from("contact_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
      setContactComments(contactComments.filter(comment => comment.id !== commentId));
      toast.success("Comment deleted successfully");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleUpdateContact = async () => {
    if (!selectedContact) return;

    try {
      setIsEditingContact(true);
      const { error } = await supabase
        .from("contacts")
        .update({
          name: editedContact.name,
          company: editedContact.company,
          email: editedContact.email,
          phone: editedContact.phone,
          last_interaction: lastInteractionDate ? lastInteractionDate.toISOString() : null,
        })
        .eq("id", selectedContact.id);

      if (error) throw error;
      
      setContacts(contacts.map(contact => 
        contact.id === selectedContact.id 
          ? { 
              ...contact, 
              ...editedContact, 
              last_interaction: lastInteractionDate ? lastInteractionDate.toISOString() : null 
            }
          : contact
      ));
      
      setSelectedContact({
        ...selectedContact,
        ...editedContact,
        last_interaction: lastInteractionDate ? lastInteractionDate.toISOString() : null
      });
      
      toast.success("Contact updated successfully");
    } catch (error) {
      console.error("Error updating contact:", error);
      toast.error("Failed to update contact");
    } finally {
      setIsEditingContact(false);
    }
  };
  
  const handleCreateContact = async () => {
    if (!newContact.name) {
      toast.error("Contact name is required");
      return;
    }
    
    try {
      setIsCreatingContact(true);
      
      const contactData = {
        name: newContact.name,
        company: newContact.company || '',
        email: newContact.email || '',
        phone: newContact.phone || '',
        user_id: user!.id,
        last_interaction: new Date().toISOString().split('T')[0],
      };
      
      const { data, error } = await supabase
        .from("contacts")
        .insert([contactData])
        .select();

      if (error) throw error;
      
      setContacts([...contacts, data[0]]);
      
      setNewContact({
        name: "",
        company: "",
        email: "",
        phone: "",
      });
      
      setNewContactOpen(false);
      
      toast.success("Contact created successfully");
    } catch (error) {
      console.error("Error creating contact:", error);
      toast.error("Failed to create contact");
    } finally {
      setIsCreatingContact(false);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchQuery.toLowerCase();
    return (
      contact.name.toLowerCase().includes(searchLower) ||
      (contact.company && contact.company.toLowerCase().includes(searchLower)) ||
      (contact.email && contact.email.toLowerCase().includes(searchLower)) ||
      (contact.phone && contact.phone.toLowerCase().includes(searchLower))
    );
  });

  const ContactDetail = () => (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input 
              value={editedContact.name || ""}
              onChange={(e) => setEditedContact({ ...editedContact, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Company</label>
            <Input 
              value={editedContact.company || ""}
              onChange={(e) => setEditedContact({ ...editedContact, company: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input 
              type="email"
              value={editedContact.email || ""}
              onChange={(e) => setEditedContact({ ...editedContact, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone</label>
            <Input 
              value={editedContact.phone || ""}
              onChange={(e) => setEditedContact({ ...editedContact, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Last Interaction</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !lastInteractionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {lastInteractionDate ? format(lastInteractionDate, "PPP") : "No date set"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={lastInteractionDate}
                  onSelect={setLastInteractionDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <Button
          className="w-full mt-4"
          onClick={handleUpdateContact}
          disabled={isEditingContact}
        >
          {isEditingContact ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
      
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-medium">Comments</h3>
        
        <div className="flex gap-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1"
            key="comment-textarea"
          />
          <Button 
            onClick={handleAddComment} 
            disabled={!newComment.trim() || commentLoading}
          >
            {commentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
          </Button>
        </div>
        
        <div className="space-y-4 max-h-[300px] overflow-y-auto">
          {contactComments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No comments yet</p>
          ) : (
            contactComments.map((comment) => (
              <div key={comment.id} className="border rounded-md p-3 bg-background">
                <div className="flex justify-between items-start">
                  <p className="whitespace-pre-wrap">{comment.text}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {format(parseISO(comment.created_at), "PPP p")}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="page-title">Contacts</h1>
        
        <Dialog open={newContactOpen} onOpenChange={setNewContactOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Contact</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input 
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Company</label>
                <Input 
                  value={newContact.company}
                  onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                  placeholder="Acme Inc."
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input 
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input 
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="(123) 456-7890"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                onClick={handleCreateContact}
                disabled={!newContact.name || isCreatingContact}
              >
                {isCreatingContact ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Contact"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-lg text-muted-foreground">No contacts found</p>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2">
              Try adjusting your search query
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead>Last Interaction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => {
                const handleRowClick = () => {
                  setSelectedContact(contact);
                  if (isMobile) {
                    setContactDrawerOpen(true);
                  }
                };
                
                return (
                  <TableRow
                    key={contact.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={handleRowClick}
                  >
                    <TableCell>{contact.name}</TableCell>
                    <TableCell>{contact.company}</TableCell>
                    <TableCell className="hidden md:table-cell">{contact.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{contact.phone}</TableCell>
                    <TableCell>
                      {contact.last_interaction 
                        ? format(parseISO(contact.last_interaction), "PP") 
                        : "Not set"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      
      {selectedContact && !isMobile && (
        <Dialog open={!!selectedContact} onOpenChange={(open) => !open && setSelectedContact(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedContact.name}</DialogTitle>
            </DialogHeader>
            <ContactDetail />
          </DialogContent>
        </Dialog>
      )}
      
      {isMobile && (
        <Drawer open={contactDrawerOpen} onOpenChange={setContactDrawerOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{selectedContact?.name}</DrawerTitle>
              <DrawerDescription>{selectedContact?.company}</DrawerDescription>
            </DrawerHeader>
            <div className="px-4">
              {selectedContact && <ContactDetail />}
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
};

export default ContactsPage;
