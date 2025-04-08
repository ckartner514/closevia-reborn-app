import { useState } from "react";
import { Search, X, RefreshCw, FilterIcon, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

interface ProposalFiltersProps {
  filterStatus: string;
  onFilterChange: (status: string) => void;
  onCreateNew: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedAmountRange: string;
  setSelectedAmountRange: (range: string) => void;
  selectedFollowUpRange: string;
  setSelectedFollowUpRange: (range: string) => void;
  followUpDateRange: DateRange | undefined;
  setFollowUpDateRange: (range: DateRange | undefined) => void;
  followUpDateOpen: boolean;
  setFollowUpDateOpen: (open: boolean) => void;
  clearFilters: () => void;
  contacts: { id: string; name: string; company: string }[];
  selectedContactId: string | null;
  setSelectedContactId: (contactId: string | null) => void;
}

const ProposalFilters = ({
  filterStatus,
  onFilterChange,
  onCreateNew,
  searchQuery,
  setSearchQuery,
  selectedAmountRange,
  setSelectedAmountRange,
  selectedFollowUpRange,
  setSelectedFollowUpRange,
  followUpDateRange,
  setFollowUpDateRange,
  followUpDateOpen,
  setFollowUpDateOpen,
  clearFilters,
  contacts,
  selectedContactId,
  setSelectedContactId
}: ProposalFiltersProps) => {
  
  const hasActiveFilters = 
    filterStatus !== "all" ||
    searchQuery ||
    selectedAmountRange !== "all" ||
    selectedFollowUpRange !== "all" ||
    selectedContactId !== null ||
    (followUpDateRange?.from !== undefined || followUpDateRange?.to !== undefined);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search proposals..."
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

        <Select value={filterStatus} onValueChange={onFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="viewed">Viewed</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={onCreateNew}>Create New</Button>

        {hasActiveFilters && (
          <Button 
            variant="outline" 
            onClick={clearFilters}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      <div className="border rounded-md p-4">
        <div className="flex items-center gap-2 mb-2">
          <FilterIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Advanced Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium block mb-2">Amount Range</label>
            <Select 
              value={selectedAmountRange} 
              onValueChange={setSelectedAmountRange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by amount" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Amounts</SelectItem>
                <SelectItem value="0-1000">$0 - $1,000</SelectItem>
                <SelectItem value="1000-5000">$1,000 - $5,000</SelectItem>
                <SelectItem value="5000-10000">$5,000 - $10,000</SelectItem>
                <SelectItem value="10000+">$10,000+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Contact</label>
            <Select
              value={selectedContactId || "all"}
              onValueChange={(value) => setSelectedContactId(value === "all" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by contact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contacts</SelectItem>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name} ({contact.company})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Follow Up Date</label>
            <Select 
              value={selectedFollowUpRange} 
              onValueChange={setSelectedFollowUpRange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by follow up" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Date</SelectItem>
                <SelectItem value="thisWeek">This Week</SelectItem>
                <SelectItem value="next30Days">Next 30 Days</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            {selectedFollowUpRange === "custom" && (
              <Popover open={followUpDateOpen} onOpenChange={setFollowUpDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !followUpDateRange?.from && "text-muted-foreground"
                    )}
                  >
                    {followUpDateRange?.from ? (
                      followUpDateRange.to ? (
                        <>
                          {format(followUpDateRange.from, "PPP")} -{" "}
                          {format(followUpDateRange.to, "PPP")}
                        </>
                      ) : (
                        format(followUpDateRange.from, "PPP")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center" side="bottom">
                  <Calendar
                    mode="range"
                    defaultMonth={followUpDateRange?.from}
                    selected={followUpDateRange}
                    onSelect={setFollowUpDateRange}
                    disabled={{ before: new Date() }}
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-4">
            {filterStatus !== "all" && (
              <Badge variant="outline" className="flex items-center gap-1">
                Status: {filterStatus}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => onFilterChange("all")} 
                />
              </Badge>
            )}
            {selectedAmountRange !== "all" && (
              <Badge variant="outline" className="flex items-center gap-1">
                Amount: {selectedAmountRange}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setSelectedAmountRange("all")}
                />
              </Badge>
            )}
            {selectedContactId && (
              <Badge variant="outline" className="flex items-center gap-1">
                Contact: {contacts.find(c => c.id === selectedContactId)?.name}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setSelectedContactId(null)}
                />
              </Badge>
            )}
            {selectedFollowUpRange !== "all" && (
              <Badge variant="outline" className="flex items-center gap-1">
                Follow Up: {selectedFollowUpRange}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setSelectedFollowUpRange("all")}
                />
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="outline" className="flex items-center gap-1">
                Search: {searchQuery}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setSearchQuery("")} 
                />
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProposalFilters;
