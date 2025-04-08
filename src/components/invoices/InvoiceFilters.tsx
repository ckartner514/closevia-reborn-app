
import { useState } from "react";
import { Search, X, RefreshCw, CalendarIcon, FilterIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, addDays, startOfWeek, endOfWeek } from "date-fns";
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
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  selectedAmountRange: string;
  setSelectedAmountRange: (range: string) => void;
  selectedDueRange: string;
  setSelectedDueRange: (range: string) => void;
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
  clearFilters,
  selectedStatus,
  setSelectedStatus,
  selectedAmountRange,
  setSelectedAmountRange,
  selectedDueRange,
  setSelectedDueRange
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

  const setThisWeek = () => {
    const now = new Date();
    setDateRange({
      from: startOfWeek(now, { weekStartsOn: 1 }),
      to: endOfWeek(now, { weekStartsOn: 1 })
    });
  };

  const setNext30Days = () => {
    const now = new Date();
    setDateRange({
      from: now,
      to: addDays(now, 30)
    });
  };

  // Calculate if any filters are active
  const hasActiveFilters = searchQuery || 
    selectedContactId || 
    dateRange || 
    (selectedStatus && selectedStatus !== "all") ||
    (selectedAmountRange && selectedAmountRange !== "all") ||
    (selectedDueRange && selectedDueRange !== "all");

  return (
    <div className="space-y-4">
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
                  value={selectedStatus} 
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
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
                <label className="text-sm font-medium">Due Date</label>
                <Select 
                  value={selectedDueRange} 
                  onValueChange={setSelectedDueRange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by due date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Due Dates</SelectItem>
                    <SelectItem value="thisWeek">This Week</SelectItem>
                    <SelectItem value="next30Days">Next 30 Days</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {selectedDueRange === 'custom' && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Custom Date Range</label>
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left",
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
                </div>
              )}
            </div>
            
            {/* Active filters display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedStatus && selectedStatus !== "all" && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Status: {selectedStatus}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setSelectedStatus("all")} 
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
                {selectedDueRange && selectedDueRange !== "all" && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Due: {selectedDueRange === 'thisWeek' ? 'This Week' : 
                          selectedDueRange === 'next30Days' ? 'Next 30 Days' : 
                          selectedDueRange === 'overdue' ? 'Overdue' : 'Custom'}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setSelectedDueRange("all")} 
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
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
