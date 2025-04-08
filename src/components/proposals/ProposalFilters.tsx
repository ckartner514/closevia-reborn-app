
import { useState } from "react";
import { PlusCircle, Search, X, RefreshCw, CalendarIcon, FilterIcon } from "lucide-react";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";

interface ProposalFiltersProps {
  filterStatus: string;
  onFilterChange: (value: string) => void;
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
  setSelectedContactId: (id: string | null) => void;
}

export const ProposalFilters = ({
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
  
  // Calculate if any filters are active
  const hasActiveFilters = searchQuery || 
    (filterStatus !== "all") ||
    (selectedAmountRange && selectedAmountRange !== "all") ||
    (selectedFollowUpRange && selectedFollowUpRange !== "all") ||
    selectedContactId;

  const setThisWeek = () => {
    const now = new Date();
    setFollowUpDateRange({
      from: startOfWeek(now, { weekStartsOn: 1 }),
      to: endOfWeek(now, { weekStartsOn: 1 })
    });
  };

  const setNext30Days = () => {
    const now = new Date();
    setFollowUpDateRange({
      from: now,
      to: addDays(now, 30)
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="page-title">Proposals</h1>
        
        <Button onClick={onCreateNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Proposal
        </Button>
      </div>
      
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
      
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="filters">
          <AccordionTrigger className="text-sm py-2">
            <div className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4" />
              <span>Advanced Filters</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 text-xs">Active</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select 
                  value={filterStatus} 
                  onValueChange={onFilterChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="refused">Refused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact</label>
                <Select 
                  value={selectedContactId || ""} 
                  onValueChange={(value) => setSelectedContactId(value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All contacts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All contacts</SelectItem>
                    {contacts.map(contact => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name} ({contact.company})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount Range</label>
                <Select 
                  value={selectedAmountRange} 
                  onValueChange={setSelectedAmountRange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by amount" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Amounts</SelectItem>
                    <SelectItem value="lt500">Less than $500</SelectItem>
                    <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                    <SelectItem value="1000-5000">$1,000 - $5,000</SelectItem>
                    <SelectItem value="gt5000">More than $5,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Follow-up Date</label>
                <Select 
                  value={selectedFollowUpRange} 
                  onValueChange={setSelectedFollowUpRange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by follow-up date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="thisWeek">This Week</SelectItem>
                    <SelectItem value="next30Days">Next 30 Days</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {selectedFollowUpRange === 'custom' && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Custom Date Range</label>
                  <Popover open={followUpDateOpen} onOpenChange={setFollowUpDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left",
                          !followUpDateRange && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {followUpDateRange?.from ? (
                          followUpDateRange.to ? (
                            <>
                              {format(followUpDateRange.from, "LLL dd, y")} -{" "}
                              {format(followUpDateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(followUpDateRange.from, "LLL dd, y")
                          )
                        ) : (
                          "Select date range"
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
                            onClick={setThisWeek}
                          >
                            This Week
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs"
                            onClick={setNext30Days}
                          >
                            Next 30 Days
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs"
                            onClick={() => setFollowUpDateRange(undefined)}
                          >
                            Clear
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs ml-auto"
                            onClick={() => setFollowUpDateOpen(false)}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                      <Calendar
                        mode="range"
                        selected={followUpDateRange}
                        onSelect={setFollowUpDateRange}
                        initialFocus
                        numberOfMonths={2}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
            
            {/* Active filters display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-4">
                {filterStatus && filterStatus !== "all" && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Status: {filterStatus}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => onFilterChange("all")} 
                    />
                  </Badge>
                )}
                {selectedAmountRange && selectedAmountRange !== "all" && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Amount: {selectedAmountRange.replace('lt', '<').replace('gt', '>').replace('-', ' - $')}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setSelectedAmountRange("all")} 
                    />
                  </Badge>
                )}
                {selectedFollowUpRange && selectedFollowUpRange !== "all" && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Follow-up: {selectedFollowUpRange === 'thisWeek' ? 'This Week' : 
                                selectedFollowUpRange === 'next30Days' ? 'Next 30 Days' : 
                                selectedFollowUpRange === 'overdue' ? 'Overdue' : 'Custom'}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setSelectedFollowUpRange("all")} 
                    />
                  </Badge>
                )}
                {selectedContactId && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Contact: {contacts.find(c => c.id === selectedContactId)?.name || ''}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setSelectedContactId(null)} 
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
