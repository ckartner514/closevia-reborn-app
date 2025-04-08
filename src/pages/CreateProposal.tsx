
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, Contact } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

const CreateProposal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>();
  
  useEffect(() => {
    if (!user) return;
    fetchContacts();
  }, [user]);
  
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
  
  const handleCreateProposal = async () => {
    if (!selectedContact) {
      toast.error("Please select a contact");
      return;
    }
    
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    try {
      setIsSubmitting(true);
      const { data, error } = await supabase
        .from("proposals")
        .insert([
          {
            contact_id: selectedContact.id,
            title,
            description,
            amount: Number(amount),
            follow_up_date: followUpDate ? followUpDate.toISOString() : null,
            status: "Pending",
            user_id: user!.id,
          },
        ])
        .select();
      
      if (error) throw error;
      
      toast.success("Proposal created successfully");
      navigate("/proposals");
    } catch (error) {
      console.error("Error creating proposal:", error);
      toast.error("Failed to create proposal");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const filteredContacts = contacts.filter((contact) => {
    if (!searchValue) return true;
    
    const search = searchValue.toLowerCase();
    return (
      contact.name.toLowerCase().includes(search) ||
      contact.company.toLowerCase().includes(search) ||
      contact.email.toLowerCase().includes(search)
    );
  });
  
  return (
    <div className="space-y-6">
      <h1 className="page-title">Create Proposal</h1>
      
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>New Proposal</CardTitle>
          <CardDescription>Create a new proposal for a client</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Contact Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Contact</label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="text-muted-foreground">Loading contacts...</span>
                  ) : selectedContact ? (
                    `${selectedContact.name} (${selectedContact.company})`
                  ) : (
                    "Select a contact..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Search contacts..."
                    value={searchValue}
                    onValueChange={setSearchValue}
                  />
                  {filteredContacts.length === 0 && !loading ? (
                    <CommandEmpty>No contacts found</CommandEmpty>
                  ) : null}
                  <CommandGroup className="max-h-[300px] overflow-y-auto">
                    {filteredContacts.map((contact) => (
                      <CommandItem
                        key={contact.id}
                        value={contact.id}
                        onSelect={() => {
                          setSelectedContact(contact);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedContact?.id === contact.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {contact.name} - {contact.company}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Proposal Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="Proposal title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Proposal details and scope of work"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>
          
          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
              <Input
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  // Only allow numbers and decimal point
                  const value = e.target.value.replace(/[^0-9.]/g, "");
                  setAmount(value);
                }}
                className="pl-8"
                type="text"
                inputMode="decimal"
              />
            </div>
          </div>
          
          {/* Follow-up Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Follow-up Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !followUpDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {followUpDate ? format(followUpDate, "PPP") : "Set a reminder"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={followUpDate}
                  onSelect={setFollowUpDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <Button
            onClick={handleCreateProposal}
            className="w-full"
            disabled={!selectedContact || !title || !amount || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Proposal"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateProposal;
