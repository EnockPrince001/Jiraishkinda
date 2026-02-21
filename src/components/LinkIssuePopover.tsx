import React, { useState, useEffect } from "react";
import { Link2, Loader2 } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getGraphQLClient } from "@/lib/graphql-client";
import { SEARCH_WORK_ITEMS } from "@/lib/queries";
import { useAuth } from "@/context/AuthContext";

interface LinkIssuePopoverProps {
  onLink: (targetId: string, type: string) => Promise<void>;
  currentWorkItemId: string;
}

export function LinkIssuePopover({ onLink, currentWorkItemId }: LinkIssuePopoverProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [linkType, setLinkType] = useState("relates to");
  const { token } = useAuth();

  useEffect(() => {
    // Clear results if the query is empty
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const client = getGraphQLClient(token || undefined);
        const data: any = await client.request(SEARCH_WORK_ITEMS, {
          query: searchQuery,
          excludeId: currentWorkItemId
        });
        setResults(data.workItems || []);
      } catch (error) {
        console.error("Search failed", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce to save your backend from unnecessary hits

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, token, currentWorkItemId]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2">
          <Link2 className="h-3.5 w-3.5" /> Link issue
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[400px]" align="start">
        {/* Relationship Type Selector */}
        <div className="flex items-center border-b p-2 gap-2 bg-muted/20">
          <Select value={linkType} onValueChange={setLinkType}>
            <SelectTrigger className="h-8 w-[140px] text-xs shadow-none border-none bg-muted hover:bg-muted/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relates to">relates to</SelectItem>
              <SelectItem value="blocks">blocks</SelectItem>
              <SelectItem value="is blocked by">is blocked by</SelectItem>
              <SelectItem value="duplicates">duplicates</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground italic">this issue</span>
        </div>
        
        {/* Search Command Menu */}
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search issues by key or summary..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
            autoFocus
          />
          <CommandList className="max-h-[250px]">
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            
            {!loading && searchQuery && results.length === 0 && (
              <CommandEmpty className="py-6 text-sm text-center">
                No work items found.
              </CommandEmpty>
            )}
            
            <CommandGroup>
              {results.map((item) => (
                <CommandItem 
                  key={item.id} 
                  onSelect={async () => {
                    setLoading(true);
                    await onLink(item.id, linkType);
                    setLoading(false);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                  className="cursor-pointer p-2"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">
                      {item.key}
                    </span>
                    <span className="text-sm line-clamp-1 text-foreground/90">
                      {item.summary}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>

        {/* Loading overlay for the actual linking action */}
        {loading && !searchQuery && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}