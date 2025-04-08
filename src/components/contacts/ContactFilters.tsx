
import { useState } from "react";
import { Search, X, RefreshCw, FilterIcon } from "lucide-react";
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
import { isWithinWeek, isWithinPast } from "@/utils/date-utils";

interface ContactFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  companyFilter: string;
  setCompanyFilter: (company: string) => void;
  lastInteractionFilter: string;
  setLastInteractionFilter: (filter: string) => void;
  companies: string[];
  clearFilters: () => void;
}

const ContactFilters = ({
  searchQuery,
  setSearchQuery,
  companyFilter,
  setCompanyFilter,
  lastInteractionFilter,
  setLastInteractionFilter,
  companies,
  clearFilters
}: ContactFiltersProps) => {
  
  // Calculate if any filters are active
  const hasActiveFilters = searchQuery || 
    companyFilter || 
    (lastInteractionFilter && lastInteractionFilter !== "all");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Company</label>
                <Select 
                  value={companyFilter} 
                  onValueChange={setCompanyFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {companies.map(company => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Interaction</label>
                <Select 
                  value={lastInteractionFilter} 
                  onValueChange={setLastInteractionFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by last interaction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Interactions</SelectItem>
                    <SelectItem value="thisWeek">This Week</SelectItem>
                    <SelectItem value="last30Days">Last 30 Days</SelectItem>
                    <SelectItem value="noInteraction">No Interaction Yet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Active filters display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-4">
                {companyFilter && companyFilter !== "all" && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Company: {companyFilter}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setCompanyFilter("all")} 
                    />
                  </Badge>
                )}
                {lastInteractionFilter && lastInteractionFilter !== "all" && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Interaction: {
                      lastInteractionFilter === 'thisWeek' ? 'This Week' : 
                      lastInteractionFilter === 'last30Days' ? 'Last 30 Days' : 
                      'No Interaction Yet'
                    }
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setLastInteractionFilter("all")} 
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

export default ContactFilters;
