
import { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Contact } from "@/lib/supabase";

interface CreateContactFormProps {
  newContact: Partial<Contact>;
  setNewContact: Dispatch<SetStateAction<Partial<Contact>>>;
  isCreating: boolean;
  onCreateContact: () => void;
}

const CreateContactForm = ({
  newContact,
  setNewContact,
  isCreating,
  onCreateContact
}: CreateContactFormProps) => {
  return (
    <>
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
          onClick={onCreateContact}
          disabled={!newContact.name || isCreating}
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Contact"
          )}
        </Button>
      </DialogFooter>
    </>
  );
};

export default CreateContactForm;
