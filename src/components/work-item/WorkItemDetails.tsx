import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WorkItemDetailsType } from "../EditWorkItemDialog";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface WorkItemDetailsProps {
  workItem: WorkItemDetailsType;
  boardColumns: any[];
  members: any[];
}

export function WorkItemDetails({ workItem, boardColumns, members }: WorkItemDetailsProps) {
  const currentColumn = boardColumns.find(c => c.id === workItem.boardColumnId);

  const getStatusColor = (columnName: string) => {
    const name = columnName?.toUpperCase() || "";
    if (name.includes("DONE")) return "bg-green-600 hover:bg-green-700 text-white";
    if (name.includes("PROGRESS")) return "bg-blue-600 hover:bg-blue-700 text-white";
    if (name.includes("FAIL")) return "bg-red-600 hover:bg-red-700 text-white";
    return "bg-slate-200 text-slate-700 hover:bg-slate-300";
  };

  return (
    <aside className="flex-[3] border-l border-t bg-slate-50/50">
      <ScrollArea className="h-full p-6 space-y-6">
        <Select value={workItem.boardColumnId} onValueChange={() => {}}>
          <SelectTrigger className={cn("w-fit min-w-[100px] border-none font-bold text-xs uppercase h-8", getStatusColor(currentColumn?.name || ""))}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {boardColumns.map(col => <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Collapsible defaultOpen className="border rounded-md bg-white">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-slate-50 border-b">
            <span className="text-xs font-bold text-slate-700">Details</span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 space-y-4">
            <div className="grid grid-cols-5 items-center text-sm">
              <Label className="col-span-2 text-slate-500 font-medium">Assignee</Label>
              <div className="col-span-3 flex items-center gap-2 px-1">
                <Avatar className="h-6 w-6"><AvatarFallback>U</AvatarFallback></Avatar>
                <span>{workItem.assignee?.userName || "Unassigned"}</span>
              </div>
            </div>

            <div className="grid grid-cols-5 items-center text-sm">
              <Label className="col-span-2 text-slate-500 font-medium">Reporter</Label>
              <div className="col-span-3 flex items-center gap-2 px-1">
                <Avatar className="h-6 w-6"><AvatarFallback>R</AvatarFallback></Avatar>
                <span>{workItem.reporter?.userName || "Unknown"}</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </ScrollArea>
    </aside>
  );
}
