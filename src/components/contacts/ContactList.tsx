
import { useState } from "react";
import { Contact } from "@/lib/supabase";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Trash2, X } from "lucide-react";
import { format, parseISO } from "date-fns";

interface ContactListProps {
  contacts: Contact[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onContactSelect: (contact: Contact) => void;
  onDeleteContact?: (contactId: string) => void;
}

const ContactList = ({ 
  contacts, 
  loading, 
  searchQuery, 
  setSearchQuery, 
  onContactSelect,
  onDeleteContact
}: ContactListProps) => {
  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchQuery.toLowerCase();
    return (
      contact.name.toLowerCase().includes(searchLower) ||
      (contact.company && contact.company.toLowerCase().includes(searchLower)) ||
      (contact.email && contact.email.toLowerCase().includes(searchLower)) ||
      (contact.phone && contact.phone.toLowerCase().includes(searchLower))
    );
  });

  return (
    <>
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
                {onDeleteContact && (
                  <TableHead className="w-[50px]"></TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell onClick={() => onContactSelect(contact)}>{contact.name}</TableCell>
                  <TableCell onClick={() => onContactSelect(contact)}>{contact.company}</TableCell>
                  <TableCell onClick={() => onContactSelect(contact)} className="hidden md:table-cell">{contact.email}</TableCell>
                  <TableCell onClick={() => onContactSelect(contact)} className="hidden md:table-cell">{contact.phone}</TableCell>
                  <TableCell onClick={() => onContactSelect(contact)}>
                    {contact.last_interaction 
                      ? format(parseISO(contact.last_interaction), "PP") 
                      : "Not set"}
                  </TableCell>
                  {onDeleteContact && (
                    <TableCell className="text-right p-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteContact(contact.id);
                        }}
                        className="hover:bg-destructive/10 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
};

export default ContactList;
