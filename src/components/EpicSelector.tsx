import React, { useState, useEffect } from "react";
import { Plus, Loader2, Zap } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { getGraphQLClient } from "@/lib/graphql-client";
import { SEARCH_EPICS } from "@/lib/queries";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EpicSelectorProps {
  currentEpic: { id: string; key: string; summary: string } | null;
  onSelect: (epicId: string | null) => Promise<void>;
}

export function EpicSelector({ currentEpic, onSelect }: EpicSelectorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [epics, setEpics] = useState<any[]>([]);
  const { token } = useAuth();

  useEffect(() => {
    const fetchEpics = async () => {
      if (!open) return;
      setLoading(true);
      try {
        const client = getGraphQLClient(token || undefined);
        const data: any = await client.request(SEARCH_EPICS, { query: searchQuery });
        setEpics(data.workItems || []);
      } catch (err) {
        console.error("Failed to fetch epics", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchEpics, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, open, token]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {currentEpic ? (
          <Badge 
            variant="outline" 
            className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 cursor-pointer py-1.5 px-3 gap-2 transition-all shadow-sm"
            onClick={() => setOpen(true)}
          >
            <Zap className="h-3 w-3 fill-current" />
            <span className="font-bold tracking-tight">{currentEpic.key}</span>
            <Separator orientation="vertical" className="h-3 bg-purple-200" />
            <span className="max-w-[150px] truncate font-medium">{currentEpic.summary}</span>
          </Badge>
        ) : (
          <Button variant="outline" size="sm" className="h-8 gap-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5">
            <Plus className="h-3.5 w-3.5" /> 
            Add epic
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[320px] shadow-xl border-border/50" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search epics..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-10"
          />
          <CommandList className="max-h-[300px]">
            {loading && (
              <div className="p-4 flex justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            )}
            {!loading && epics.length === 0 && (
              <CommandEmpty className="py-6 text-sm text-muted-foreground">
                No epics found in this project.
              </CommandEmpty>
            )}
            <CommandGroup title="Suggested Epics">
              {epics.map((epic) => (
                <CommandItem
                  key={epic.id}
                  value={epic.id}
                  onSelect={async () => {
                    await onSelect(epic.id);
                    setOpen(false);
                  }}
                  className="flex flex-col items-start gap-0.5 py-2.5 px-4 cursor-pointer"
                >
                  <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">
                    {epic.key}
                  </span>
                  <span className="text-sm font-semibold text-foreground line-clamp-1">
                    {epic.summary}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            
            {currentEpic && (
              <>
                <div className="h-px bg-border" />
                <CommandGroup>
                  <CommandItem 
                    onSelect={() => {
                      onSelect(null);
                      setOpen(false);
                    }} 
                    className="text-destructive font-medium flex justify-center py-2 hover:bg-red-50"
                  >
                    Remove from Epic
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Small helper for the badge separator
const Separator = ({ className, orientation }: { className?: string; orientation?: string }) => (
  <div className={cn("bg-border", orientation === "vertical" ? "w-[1px] h-full" : "h-[1px] w-full", className)} />
);