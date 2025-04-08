
import { useState } from "react";
import { Search, X, RefreshCw, CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface InvoiceFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  contacts: { id: string; name: string; company: string }[];
  selectedContactId: string | null;
  setSelectedContactId: (id: string | null) => void;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  dateOpen: boolean;
  setDateOpen: (open: boolean) => void;
  clearFilters: () => void;
}

export const InvoiceFilters = ({
  searchQuery,
  setSearchQuery,
  contacts,
  selectedContactId,
  setSelectedContactId,
  dateRange,
  setDateRange,
  dateOpen,
  setDateOpen,
  clearFilters
}: InvoiceFiltersProps) => {
  
  const setCurrentMonth = () => {
    const now = new Date();
    setDateRange({
      from: startOfMonth(now),
      to: endOfMonth(now)
    });
  };
  
  const setPreviousMonth = () => {
    const now = new Date();
    const previousMonth = subMonths(now, 1);
    setDateRange({
      from: startOfMonth(previousMonth),
      to: endOfMonth(previousMonth)
    });
  };

  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search invoices..."
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
      
      <Select 
        value={selectedContactId || ""} 
        onValueChange={(value) => setSelectedContactId(value || null)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All contacts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All contacts</SelectItem>
          {contacts.map(contact => (
            <SelectItem key={contact.id} value={contact.id}>
              {contact.name} ({contact.company})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Popover open={dateOpen} onOpenChange={setDateOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[200px] justify-start text-left",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              "Date range"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b">
            <div className="flex gap-2 mb-2">
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs"
                onClick={setCurrentMonth}
              >
                Current Month
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs"
                onClick={setPreviousMonth}
              >
                Last Month
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs"
                onClick={() => setDateRange(undefined)}
              >
                Clear
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs ml-auto"
                onClick={() => setDateOpen(false)}
              >
                Apply
              </Button>
            </div>
          </div>
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={setDateRange}
            initialFocus
            numberOfMonths={2}
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
      
      {(searchQuery || selectedContactId || dateRange) && (
        <Button 
          variant="ghost" 
          onClick={clearFilters}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );
};
