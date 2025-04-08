
import { useState, useEffect } from "react";
import { Contact } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import ContactComments from "./ContactComments";

type ContactComment = {
  id: string;
  contact_id: string;
  text: string;
  created_at: string;
  user_id: string;
};

interface ContactDetailsProps {
  contact: Contact;
  comments: ContactComment[];
  newComment: string;
  commentLoading: boolean;
  isEditing: boolean;
  editedContact: Partial<Contact>;
  lastInteractionDate: Date | undefined;
  onEditedContactChange: (field: string, value: string) => void;
  onLastInteractionDateChange: (date: Date | undefined) => void;
  onSaveChanges: () => void;
  onCommentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onAddComment: () => void;
  onDeleteComment: (commentId: string) => void;
}

const ContactDetails = ({
  contact,
  comments,
  newComment,
  commentLoading,
  isEditing,
  editedContact,
  lastInteractionDate,
  onEditedContactChange,
  onLastInteractionDateChange,
  onSaveChanges,
  onCommentChange,
  onAddComment,
  onDeleteComment
}: ContactDetailsProps) => {
  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input 
              value={editedContact.name || ""}
              onChange={(e) => onEditedContactChange("name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Company</label>
            <Input 
              value={editedContact.company || ""}
              onChange={(e) => onEditedContactChange("company", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input 
              type="email"
              value={editedContact.email || ""}
              onChange={(e) => onEditedContactChange("email", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone</label>
            <Input 
              value={editedContact.phone || ""}
              onChange={(e) => onEditedContactChange("phone", e.target.value)}
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
                  onSelect={onLastInteractionDateChange}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <Button
          className="w-full mt-4"
          onClick={onSaveChanges}
          disabled={isEditing}
        >
          {isEditing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
      
      <div className="mt-8">
        <ContactComments
          comments={comments}
          newComment={newComment}
          isLoading={commentLoading}
          onCommentChange={onCommentChange}
          onAddComment={onAddComment}
          onDeleteComment={onDeleteComment}
        />
      </div>
    </>
  );
};

export default ContactDetails;
