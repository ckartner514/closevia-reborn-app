
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, Contact } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
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
      setError(null);
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user!.id)
        .order("name", { ascending: true });
      
      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setError("Failed to load contacts. Please try again later.");
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
        .from("deals") // Changed from "proposals" to "deals" based on DB schema
        .insert([
          {
            contact_id: selectedContact.id,
            title,
            notes: description, // Changed from "description" to "notes" based on DB schema
            amount: Number(amount),
            due_date: followUpDate ? followUpDate.toISOString() : null, // Changed from "follow_up_date" to "due_date"
            status: "open", // Default status for new deals
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
  
  // Filter contacts safely, ensuring contacts array exists
  const filteredContacts = contacts && contacts.length > 0 
    ? contacts.filter((contact) => {
        if (!searchValue) return true;
        
        const search = searchValue.toLowerCase();
        return (
          contact.name.toLowerCase().includes(search) ||
          (contact.company && contact.company.toLowerCase().includes(search)) ||
          (contact.email && contact.email.toLowerCase().includes(search))
        );
      })
    : [];
  
  const nextStep = () => {
    // Validate current step
    if (currentStep === 1 && !selectedContact) {
      toast.error("Please select a contact");
      return;
    }
    
    if (currentStep === 2) {
      if (!title.trim()) {
        toast.error("Please enter a title");
        return;
      }
      
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // On the last step, create the proposal
      handleCreateProposal();
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Content for Step 1: Select Contact
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Contact</label>
        {error ? (
          <div className="text-sm text-destructive">{error}</div>
        ) : (
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
                  `${selectedContact.name} (${selectedContact.company || 'No Company'})`
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
                <CommandList>
                  <CommandEmpty>No contacts found</CommandEmpty>
                  {filteredContacts.length > 0 && (
                    <CommandGroup>
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
                          {contact.name} - {contact.company || 'No Company'}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
        {contacts.length === 0 && !loading && !error && (
          <div className="text-sm text-amber-600">
            No contacts found. Please <a href="/contacts" className="underline font-medium">create a contact</a> first.
          </div>
        )}
      </div>
    </div>
  );
  
  // Content for Step 2: Proposal Details
  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Proposal Title */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Title</label>
        <Input
          placeholder="Proposal title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
    </div>
  );
  
  // Content for Step 3: Additional Details
  const renderStep3 = () => (
    <div className="space-y-6">
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
    </div>
  );
  
  // Render the appropriate step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      <h1 className="page-title">Create Proposal</h1>
      
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>New Proposal</CardTitle>
          <CardDescription>Create a new proposal for a client</CardDescription>
        </CardHeader>
        
        {/* Step Indicator */}
        <div className="px-6">
          <div className="flex justify-between mb-6">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-medium",
                    currentStep > index + 1 
                      ? "bg-primary text-primary-foreground" 
                      : currentStep === index + 1
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {index + 1}
                </div>
                {index < totalSteps - 1 && (
                  <div 
                    className={cn(
                      "h-1 w-24 mx-2",
                      currentStep > index + 1 ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        
        <CardContent className="space-y-6">
          {renderStepContent()}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          <Button
            onClick={nextStep}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : currentStep === totalSteps ? (
              "Create Proposal"
            ) : (
              "Next"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CreateProposal;
