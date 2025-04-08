
import { useState, useEffect, useMemo } from "react";
import { supabase, Contact } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Plus } from "lucide-react";
import { parseISO, subDays } from "date-fns";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import ContactList from "@/components/contacts/ContactList";
import ContactDetails from "@/components/contacts/ContactDetails";
import CreateContactForm from "@/components/contacts/CreateContactForm";
import ContactFilters from "@/components/contacts/ContactFilters";
import { isWithinWeek, isWithinPast } from "@/utils/date-utils";

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
  
  // Basic filters
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [lastInteractionFilter, setLastInteractionFilter] = useState("all");
  
  // Derived data
  const [uniqueCompanies, setUniqueCompanies] = useState<string[]>([]);
  
  // UI state
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
    if (contacts.length > 0) {
      // Extract unique company names
      const companies = Array.from(new Set(
        contacts
          .map(contact => contact.company)
          .filter((company): company is string => !!company)
      )).sort();
      
      setUniqueCompanies(companies);
    }
  }, [contacts]);

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
        company_website: selectedContact.company_website || "",
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

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value);
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
      
      const updateData = {
        name: editedContact.name,
        company: editedContact.company,
        email: editedContact.email,
        phone: editedContact.phone,
        company_website: editedContact.company_website,
        last_interaction: lastInteractionDate ? lastInteractionDate.toISOString() : null,
      };
      
      console.log("Updating contact with data:", updateData);
      
      const { error } = await supabase
        .from("contacts")
        .update(updateData)
        .eq("id", selectedContact.id);

      if (error) throw error;
      
      setContacts(contacts.map(contact => 
        contact.id === selectedContact.id 
          ? { 
              ...contact, 
              ...updateData
            }
          : contact
      ));
      
      setSelectedContact({
        ...selectedContact,
        ...updateData
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

  const handleDeleteContact = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", contactId);

      if (error) throw error;
      
      setContacts(contacts.filter(contact => contact.id !== contactId));
      
      if (selectedContact && selectedContact.id === contactId) {
        setSelectedContact(null);
        if (isMobile) {
          setContactDrawerOpen(false);
        }
      }
      
      toast.success("Contact deleted successfully");
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to delete contact");
    }
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    if (isMobile) {
      setContactDrawerOpen(true);
    }
  };

  const handleEditedContactChange = (field: string, value: string) => {
    setEditedContact(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCompanyFilter("");
    setLastInteractionFilter("all");
  };

  // Filter contacts based on all criteria
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      // Filter by company
      if (companyFilter && contact.company !== companyFilter) {
        return false;
      }
      
      // Filter by last interaction
      if (lastInteractionFilter !== "all") {
        if (lastInteractionFilter === "thisWeek") {
          if (!isWithinWeek(contact.last_interaction)) {
            return false;
          }
        } else if (lastInteractionFilter === "last30Days") {
          if (!isWithinPast(contact.last_interaction, 30)) {
            return false;
          }
        } else if (lastInteractionFilter === "noInteraction") {
          if (contact.last_interaction) {
            return false;
          }
        }
      }
      
      // The search filtering is handled by the ContactList component
      return true;
    });
  }, [contacts, companyFilter, lastInteractionFilter]);

  const hasFilters = !!(
    companyFilter || 
    lastInteractionFilter !== "all" || 
    searchQuery
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
            
            <CreateContactForm
              newContact={newContact}
              setNewContact={setNewContact}
              isCreating={isCreatingContact}
              onCreateContact={handleCreateContact}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <ContactFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        companyFilter={companyFilter}
        setCompanyFilter={setCompanyFilter}
        lastInteractionFilter={lastInteractionFilter}
        setLastInteractionFilter={setLastInteractionFilter}
        companies={uniqueCompanies}
        clearFilters={clearFilters}
      />
      
      <ContactList
        contacts={filteredContacts}
        loading={loading}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onContactSelect={handleContactSelect}
        onDeleteContact={handleDeleteContact}
      />
      
      {selectedContact && !isMobile && (
        <Dialog open={!!selectedContact} onOpenChange={(open) => !open && setSelectedContact(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedContact.name}</DialogTitle>
            </DialogHeader>
            <ContactDetails
              contact={selectedContact}
              comments={contactComments}
              newComment={newComment}
              commentLoading={commentLoading}
              isEditing={isEditingContact}
              editedContact={editedContact}
              lastInteractionDate={lastInteractionDate}
              onEditedContactChange={handleEditedContactChange}
              onLastInteractionDateChange={setLastInteractionDate}
              onSaveChanges={handleUpdateContact}
              onCommentChange={handleCommentChange}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
            />
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
              {selectedContact && (
                <ContactDetails
                  contact={selectedContact}
                  comments={contactComments}
                  newComment={newComment}
                  commentLoading={commentLoading}
                  isEditing={isEditingContact}
                  editedContact={editedContact}
                  lastInteractionDate={lastInteractionDate}
                  onEditedContactChange={handleEditedContactChange}
                  onLastInteractionDateChange={setLastInteractionDate}
                  onSaveChanges={handleUpdateContact}
                  onCommentChange={handleCommentChange}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                />
              )}
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
